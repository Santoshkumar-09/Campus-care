import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student',
    department: '', roll_number: '', phone: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        const user = await login(formData.email, formData.password);
        toast.success(`Welcome back, ${user.name}! 🎉`);
        navigate('/');
      } else {
        await register(formData);
        toast.success('Account created successfully! 🎓');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="logo-emoji">🎓</span>
            <h1>REVA Campus Portal</h1>
            <p>Student Project & Grievance Management System</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
              Sign In
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" name="name" type="text" placeholder="John Doe"
                    value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" name="department" value={formData.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>
                </div>
                {formData.role === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input className="form-input" name="roll_number" type="text" placeholder="R20CS001"
                      value={formData.roll_number} onChange={handleChange} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" name="phone" type="tel" placeholder="+91 98765 43210"
                    value={formData.phone} onChange={handleChange} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" name="email" type="email" placeholder="you@reva.edu.in"
                value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" name="password" type="password" placeholder="••••••••"
                value={formData.password} onChange={handleChange} required />
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? '⏳ Please wait...' : tab === 'login' ? '🚀 Sign In' : '✨ Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>🔑 Demo Accounts (Password: Admin@123)</strong>
            <div>👨‍💼 Admin: admin@reva.edu.in</div>
            <div>👨‍🏫 Faculty: rajesh.kumar@reva.edu.in</div>
            <div>👨‍🎓 Student: student@reva.edu.in</div>
          </div>
        </div>
      </div>
    </div>
  );
}
