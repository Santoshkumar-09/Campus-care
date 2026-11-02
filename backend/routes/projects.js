const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// GET /api/projects - Get all projects (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = `
      SELECT p.*, 
        u.name as creator_name,
        f.name as mentor_name,
        COUNT(DISTINCT pm.user_id) as member_count,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users f ON p.faculty_mentor = f.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
    `;

    const conditions = [];
    const params = [];

    // Students see only their projects; faculty/admin see all
    if (req.user.role === 'student') {
      conditions.push(`p.id IN (SELECT project_id FROM project_members WHERE user_id = $${params.length + 1})`);
      params.push(req.user.id);
    }

    if (status) {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`p.category = $${params.length + 1}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`(p.title ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id, u.name, f.name ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - Get single project with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get project
    const projectResult = await pool.query(
      `SELECT p.*, u.name as creator_name, f.name as mentor_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN users f ON p.faculty_mentor = f.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get members
    const membersResult = await pool.query(
      `SELECT pm.role as project_role, pm.joined_at, u.id, u.name, u.email, u.department, u.avatar_url,
        sp.skills, sp.interests
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE pm.project_id = $1`,
      [id]
    );

    // Get tasks
    const tasksResult = await pool.query(
      `SELECT t.*, u.name as assignee_name, c.name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [id]
    );

    // Get milestones
    const milestonesResult = await pool.query(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date ASC',
      [id]
    );

    // Get documents
    const docsResult = await pool.query(
      `SELECT pd.*, u.name as uploader_name
       FROM project_documents pd
       JOIN users u ON pd.uploaded_by = u.id
       WHERE pd.project_id = $1
       ORDER BY pd.created_at DESC`,
      [id]
    );

    // Get comments
    const commentsResult = await pool.query(
      `SELECT pc.*, u.name as user_name, u.avatar_url
       FROM project_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.project_id = $1
       ORDER BY pc.created_at DESC`,
      [id]
    );

    // Get faculty reviews
    const reviewsResult = await pool.query(
      `SELECT fr.*, u.name as faculty_name
       FROM faculty_reviews fr
       JOIN users u ON fr.faculty_id = u.id
       WHERE fr.project_id = $1
       ORDER BY fr.reviewed_at DESC`,
      [id]
    );

    res.json({
      ...project,
      members: membersResult.rows,
      tasks: tasksResult.rows,
      milestones: milestonesResult.rows,
      documents: docsResult.rows,
      comments: commentsResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - Create project
router.post('/', auth, async (req, res) => {
  const { title, description, category, start_date, end_date, github_url, demo_url, faculty_mentor, is_public } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (title, description, category, start_date, end_date, github_url, demo_url, faculty_mentor, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, category, start_date, end_date, github_url, demo_url, faculty_mentor, is_public, req.user.id]
    );

    const project = result.rows[0];

    // Add creator as project leader
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'leader']
    );

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, status, start_date, end_date, github_url, demo_url, progress, is_public } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET title=$1, description=$2, category=$3, status=$4, start_date=$5,
       end_date=$6, github_url=$7, demo_url=$8, progress=$9, is_public=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, description, category, status, start_date, end_date, github_url, demo_url, progress, is_public, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1 AND created_by=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add team member
router.post('/:id/members', auth, async (req, res) => {
  const { user_id, role = 'member' } = req.body;
  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.params.id, user_id, role]
    );
    res.json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id=$1 AND user_id=$2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/tasks - Create task
router.post('/:id/tasks', auth, async (req, res) => {
  const { title, description, assigned_to, priority, due_date, milestone_id, estimated_hours, tags } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to, priority, due_date, estimated_hours, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.params.id, milestone_id, title, description, assigned_to, priority, due_date, estimated_hours, tags, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/tasks/:taskId - Update task
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  const { title, description, assigned_to, priority, status, due_date, actual_hours } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, assigned_to=$3, priority=$4, status=$5,
       due_date=$6, actual_hours=$7, updated_at=NOW()
       WHERE id=$8 AND project_id=$9 RETURNING *`,
      [title, description, assigned_to, priority, status, due_date, actual_hours, req.params.taskId, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1 AND project_id=$2', [req.params.taskId, req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/milestones
router.post('/:id/milestones', auth, async (req, res) => {
  const { title, description, due_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO milestones (project_id, title, description, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, title, description, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/milestones/:milestoneId
router.put('/:id/milestones/:milestoneId', auth, async (req, res) => {
  const { title, description, due_date, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE milestones SET title=$1, description=$2, due_date=$3, status=$4 WHERE id=$5 RETURNING *',
      [title, description, due_date, status, req.params.milestoneId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/documents
router.post('/:id/documents', auth, async (req, res) => {
  const { title, description, file_url, link_url, file_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO project_documents (project_id, title, description, file_url, link_url, file_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.params.id, title, description, file_url, link_url, file_type, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  const { content, task_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO project_comments (project_id, task_id, user_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, task_id, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/reviews - Faculty review
router.post('/:id/reviews', auth, requireRole('faculty', 'admin'), async (req, res) => {
  const { review_text, rating } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO faculty_reviews (project_id, faculty_id, review_text, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.user.id, review_text, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/faculty/dashboard - Faculty dashboard stats
router.get('/faculty/dashboard', auth, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
        COUNT(DISTINCT pm.user_id) as total_students,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.faculty_mentor = $1 OR $2 = 'admin'
    `, [req.user.id, req.user.role]);

    const recentProjects = await pool.query(`
      SELECT p.*, u.name as creator_name, COUNT(pm.user_id) as member_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.faculty_mentor = $1 OR $2 = 'admin'
      GROUP BY p.id, u.name
      ORDER BY p.updated_at DESC
      LIMIT 5
    `, [req.user.id, req.user.role]);

    res.json({
      stats: stats.rows[0],
      recentProjects: recentProjects.rows
    });
  } catch (err) {
    console.error('Faculty dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
