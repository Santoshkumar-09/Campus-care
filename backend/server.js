require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', '*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/complaints', require('./routes/complaints'));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    apps: [
      'Student Project & Team Collaboration Portal',
      'Smart Campus Complaint & Grievance Management System'
    ]
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║    🎓 REVA HACKATHON PORTAL - BACKEND SERVER     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🚀 Server running on http://localhost:${PORT}      ║`);
  console.log('║  📡 API Base URL: http://localhost:5000/api      ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  App 1: Student Project Collaboration Portal     ║');
  console.log('║  App 2: Campus Complaint Management System       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
});

module.exports = app;
