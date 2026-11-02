const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// GET /api/users - Get all users (admin/faculty only)
router.get('/', auth, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department, u.roll_number, u.is_active, u.created_at,
        sp.skills, sp.interests, sp.cgpa
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
    `;
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push(`u.role = $${params.length + 1}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/students - Get all students (for team formation)
router.get('/students', auth, async (req, res) => {
  try {
    const { search, skills } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.department, u.roll_number,
        sp.skills, sp.interests, sp.cgpa, sp.github_url, sp.bio
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'student' AND u.is_active = true
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.department ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY u.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/faculty - Get all faculty
router.get('/faculty', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department FROM users WHERE role IN ('faculty', 'admin') AND is_active = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, u.roll_number, u.phone, u.avatar_url, u.created_at,
        sp.bio, sp.skills, sp.interests, sp.github_url, sp.linkedin_url, sp.portfolio_url, sp.cgpa, sp.year_of_study
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/toggle - Toggle user active status
router.patch('/:id/toggle', auth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, name, is_active',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
