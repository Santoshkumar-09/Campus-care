const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// Auto-generate ticket ID
const generateTicketId = async () => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    "SELECT COUNT(*) FROM complaints WHERE ticket_id LIKE $1",
    [`REV-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `REV-${year}-${String(count).padStart(4, '0')}`;
};

// GET /api/complaints/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaint_categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints - Get complaints
router.get('/', auth, async (req, res) => {
  try {
    const { status, category_id, priority, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
        cc.name as category_name, cc.icon as category_icon, cc.department as category_department,
        u.name as submitted_by_name, u.email as submitted_by_email,
        a.name as assigned_to_name
      FROM complaints c
      LEFT JOIN complaint_categories cc ON c.category_id = cc.id
      LEFT JOIN users u ON c.submitted_by = u.id
      LEFT JOIN users a ON c.assigned_to = a.id
    `;

    const conditions = [];
    const params = [];

    // Students see only their complaints
    if (req.user.role === 'student') {
      conditions.push(`c.submitted_by = $${params.length + 1}`);
      params.push(req.user.id);
    }

    if (status) {
      conditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }
    if (category_id) {
      conditions.push(`c.category_id = $${params.length + 1}`);
      params.push(category_id);
    }
    if (priority) {
      conditions.push(`c.priority = $${params.length + 1}`);
      params.push(priority);
    }
    if (search) {
      conditions.push(`(c.title ILIKE $${params.length + 1} OR c.ticket_id ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM complaints c';
    const countParams = params.slice(0, -2); // Remove limit and offset
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      complaints: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints/stats - Analytics
router.get('/stats', auth, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 END) as avg_resolution_hours
      FROM complaints
    `);

    const byCategory = await pool.query(`
      SELECT cc.name, cc.icon, COUNT(c.id) as count
      FROM complaint_categories cc
      LEFT JOIN complaints c ON cc.id = c.category_id
      GROUP BY cc.id, cc.name, cc.icon
      ORDER BY count DESC
    `);

    const byPriority = await pool.query(`
      SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority
    `);

    const recent = await pool.query(`
      SELECT c.ticket_id, c.title, c.status, c.priority, c.created_at, u.name as submitted_by_name
      FROM complaints c
      LEFT JOIN users u ON c.submitted_by = u.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    const monthly = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
      FROM complaints
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    res.json({
      stats: stats.rows[0],
      byCategory: byCategory.rows,
      byPriority: byPriority.rows,
      recent: recent.rows,
      monthly: monthly.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
        cc.name as category_name, cc.icon as category_icon, cc.department as category_department,
        u.name as submitted_by_name, u.email as submitted_by_email, u.phone as submitted_by_phone,
        a.name as assigned_to_name
       FROM complaints c
       LEFT JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN users u ON c.submitted_by = u.id
       LEFT JOIN users a ON c.assigned_to = a.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Get status history
    const history = await pool.query(
      `SELECT csh.*, u.name as changed_by_name
       FROM complaint_status_history csh
       LEFT JOIN users u ON csh.changed_by = u.id
       WHERE csh.complaint_id = $1
       ORDER BY csh.changed_at ASC`,
      [req.params.id]
    );

    // Get comments
    const comments = await pool.query(
      `SELECT cc.*, u.name as user_name, u.role as user_role
       FROM complaint_comments cc
       LEFT JOIN users u ON cc.user_id = u.id
       WHERE cc.complaint_id = $1 AND (cc.is_internal = false OR $2 IN ('admin', 'faculty'))
       ORDER BY cc.created_at ASC`,
      [req.params.id, req.user.role]
    );

    // Get feedback
    const feedback = await pool.query(
      'SELECT * FROM complaint_feedback WHERE complaint_id = $1',
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      statusHistory: history.rows,
      comments: comments.rows,
      feedback: feedback.rows
    });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/complaints - Submit complaint
router.post('/', auth, async (req, res) => {
  const { title, description, category_id, priority = 'medium', location, image_url } = req.body;
  try {
    const ticketId = await generateTicketId();

    // Get department from category
    const catResult = await pool.query('SELECT department FROM complaint_categories WHERE id = $1', [category_id]);
    const department = catResult.rows[0]?.department;

    const result = await pool.query(
      `INSERT INTO complaints (ticket_id, title, description, category_id, priority, location, image_url, submitted_by, assigned_department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [ticketId, title, description, category_id, priority, location, image_url, req.user.id, department]
    );

    const complaint = result.rows[0];

    // Add initial status history
    await pool.query(
      'INSERT INTO complaint_status_history (complaint_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
      [complaint.id, 'submitted', 'Complaint submitted successfully', req.user.id]
    );

    res.status(201).json(complaint);
  } catch (err) {
    console.error('Submit complaint error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/complaints/:id/status - Update status
router.put('/:id/status', auth, requireRole('admin', 'faculty'), async (req, res) => {
  const { status, notes, assigned_to, rejection_reason, resolution_notes, estimated_resolution } = req.body;
  try {
    let updateQuery = 'UPDATE complaints SET status=$1, updated_at=NOW()';
    const params = [status];
    let paramCount = 2;

    if (assigned_to) {
      updateQuery += `, assigned_to=$${paramCount++}`;
      params.push(assigned_to);
    }
    if (rejection_reason) {
      updateQuery += `, rejection_reason=$${paramCount++}`;
      params.push(rejection_reason);
    }
    if (resolution_notes) {
      updateQuery += `, resolution_notes=$${paramCount++}`;
      params.push(resolution_notes);
    }
    if (estimated_resolution) {
      updateQuery += `, estimated_resolution=$${paramCount++}`;
      params.push(estimated_resolution);
    }
    if (status === 'resolved') {
      updateQuery += `, resolved_at=NOW()`;
    }

    updateQuery += ` WHERE id=$${paramCount} RETURNING *`;
    params.push(req.params.id);

    const result = await pool.query(updateQuery, params);

    // Add to history
    await pool.query(
      'INSERT INTO complaint_status_history (complaint_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
      [req.params.id, status, notes || `Status changed to ${status}`, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/complaints/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  const { content, is_internal = false } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO complaint_comments (complaint_id, user_id, content, is_internal) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.user.id, content, is_internal && ['admin', 'faculty'].includes(req.user.role)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/complaints/:id/feedback
router.post('/:id/feedback', auth, async (req, res) => {
  const { rating, feedback_text } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO complaint_feedback (complaint_id, user_id, rating, feedback_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (complaint_id, user_id) DO UPDATE SET rating=$3, feedback_text=$4
       RETURNING *`,
      [req.params.id, req.user.id, rating, feedback_text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints/users/search - Search users for assignment
router.get('/users/search', auth, requireRole('admin', 'faculty'), async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department FROM users 
       WHERE (name ILIKE $1 OR email ILIKE $1) AND role IN ('faculty', 'admin')
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
