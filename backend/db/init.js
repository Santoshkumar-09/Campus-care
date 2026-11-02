const pool = require('./db');

const initSQL = `
-- ============================================================
-- REVA HACKATHON PORTAL - DATABASE SCHEMA
-- App 1: Student Project & Team Collaboration Portal
-- App 2: Smart Campus Complaint & Grievance Management System
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SHARED TABLES
-- ============================================================

-- Users table (shared between both apps)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- student, faculty, admin, department_head
  department VARCHAR(255),
  roll_number VARCHAR(50),
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- APP 1: STUDENT PROJECT & TEAM COLLABORATION PORTAL
-- ============================================================

-- Student Skills & Interests
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  skills TEXT[], -- Array of skills e.g. ['React', 'Node.js', 'Python']
  interests TEXT[], -- e.g. ['Web Dev', 'AI/ML', 'Cybersecurity']
  github_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  year_of_study INTEGER,
  cgpa DECIMAL(4,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning', -- planning, active, completed, on_hold
  category VARCHAR(100), -- Web Dev, AI/ML, IoT, Mobile, etc.
  start_date DATE,
  end_date DATE,
  github_url VARCHAR(500),
  demo_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  created_by UUID REFERENCES users(id),
  faculty_mentor UUID REFERENCES users(id),
  progress INTEGER DEFAULT 0, -- 0-100
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- leader, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, done
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Documents
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500),
  link_url VARCHAR(500),
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Comments
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Reviews
CREATE TABLE IF NOT EXISTS faculty_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES users(id),
  review_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- APP 2: SMART CAMPUS COMPLAINT & GRIEVANCE MANAGEMENT SYSTEM
-- ============================================================

-- Complaint Categories
CREATE TABLE IF NOT EXISTS complaint_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(255), -- Which department handles this
  icon VARCHAR(100), -- emoji or icon class
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated e.g. REV-2024-0001
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES complaint_categories(id),
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, assigned, in_progress, resolved, rejected, closed
  location VARCHAR(255), -- Building/Block
  image_url VARCHAR(500),
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  assigned_department VARCHAR(255),
  resolution_notes TEXT,
  rejection_reason TEXT,
  resolved_at TIMESTAMP,
  estimated_resolution DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Status History
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Comments
CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal admin notes vs public
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Feedback
CREATE TABLE IF NOT EXISTS complaint_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(complaint_id, user_id)
);

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default complaint categories
INSERT INTO complaint_categories (name, description, department, icon) VALUES
  ('Infrastructure', 'Building damage, broken facilities, structural issues', 'Facilities Management', '🏗️'),
  ('Wi-Fi & Internet', 'Network connectivity issues, slow internet, dead zones', 'IT Department', '📶'),
  ('Cleanliness & Hygiene', 'Washroom cleanliness, garbage collection, pest control', 'Housekeeping', '🧹'),
  ('Transportation', 'Bus timings, route issues, vehicle problems', 'Transport Department', '🚌'),
  ('Water & Electricity', 'Power outages, water supply issues, plumbing', 'Maintenance', '💡'),
  ('Library', 'Book availability, noise, seating, AC issues', 'Library', '📚'),
  ('Canteen & Food', 'Food quality, pricing, hygiene, service', 'Canteen Management', '🍽️'),
  ('Academic', 'Class scheduling, faculty issues, lab equipment', 'Academic Affairs', '🎓'),
  ('Security', 'Safety concerns, unauthorized access, surveillance', 'Security Department', '🔒'),
  ('Medical', 'Health center issues, first aid, emergency response', 'Medical Center', '🏥')
ON CONFLICT DO NOTHING;

-- Insert default admin/faculty users (password: Admin@123)
INSERT INTO users (name, email, password, role, department) VALUES
  ('Admin', 'admin@reva.edu.in', '$2b$10$rQ8lknpfSP5.nKnJvEqIrOxQpLPZDKaO8mwA5F9aH5DEX0oVzCUga', 'admin', 'Administration'),
  ('Dr. Rajesh Kumar', 'rajesh.kumar@reva.edu.in', '$2b$10$rQ8lknpfSP5.nKnJvEqIrOxQpLPZDKaO8mwA5F9aH5DEX0oVzCUga', 'faculty', 'Computer Science'),
  ('Dr. Priya Sharma', 'priya.sharma@reva.edu.in', '$2b$10$rQ8lknpfSP5.nKnJvEqIrOxQpLPZDKaO8mwA5F9aH5DEX0oVzCUga', 'faculty', 'Information Technology'),
  ('Student Demo', 'student@reva.edu.in', '$2b$10$rQ8lknpfSP5.nKnJvEqIrOxQpLPZDKaO8mwA5F9aH5DEX0oVzCUga', 'student', 'Computer Science')
ON CONFLICT (email) DO NOTHING;
`;

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚀 Initializing database...');
    await client.query(initSQL);
    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - student_profiles');
    console.log('   - projects, project_members, milestones, tasks');
    console.log('   - project_documents, project_comments, faculty_reviews');
    console.log('   - complaint_categories, complaints, complaint_status_history');
    console.log('   - complaint_comments, complaint_feedback');
    console.log('\n🔑 Default credentials:');
    console.log('   Admin:   admin@reva.edu.in / Admin@123');
    console.log('   Faculty: rajesh.kumar@reva.edu.in / Admin@123');
    console.log('   Student: student@reva.edu.in / Admin@123');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(console.error);
