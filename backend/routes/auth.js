const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'student', department, roll_number, phone } = req.body;
  try {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, department, roll_number, phone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, department`,
      [name, email, hashedPassword, role, department, roll_number, phone]
    );

    const user = result.rows[0];

    // Create empty student profile if student
    if (role === 'student') {
      await pool.query(
        'INSERT INTO student_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    }

    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, sp.skills, sp.interests, sp.bio, sp.github_url, sp.linkedin_url, sp.cgpa
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const { password, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  const { name, phone, department, bio, skills, interests, github_url, linkedin_url, portfolio_url, cgpa, year_of_study } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name=$1, phone=$2, department=$3, updated_at=NOW() WHERE id=$4',
      [name, phone, department, req.user.id]
    );

    if (req.user.role === 'student') {
      await pool.query(
        `INSERT INTO student_profiles (user_id, bio, skills, interests, github_url, linkedin_url, portfolio_url, cgpa, year_of_study)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           bio=$2, skills=$3, interests=$4, github_url=$5, linkedin_url=$6,
           portfolio_url=$7, cgpa=$8, year_of_study=$9, updated_at=NOW()`,
        [req.user.id, bio, skills, interests, github_url, linkedin_url, portfolio_url, cgpa, year_of_study]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
