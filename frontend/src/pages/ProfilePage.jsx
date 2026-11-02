import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const SKILLS_OPTIONS = ['React', 'Node.js', 'Python', 'Java', 'C++', 'MongoDB', 'PostgreSQL',
  'Machine Learning', 'AI', 'Flutter', 'Android', 'iOS', 'AWS', 'Docker', 'TypeScript',
  'Vue.js', 'Angular', 'Django', 'FastAPI', 'Spring Boot', 'Cybersecurity', 'Blockchain',
  'IoT', 'Figma', 'UI/UX', 'Data Science', 'DevOps', 'Git', 'Linux'];

const INTERESTS_OPTIONS = ['Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 'IoT',
  'Cybersecurity', 'Blockchain', 'Cloud Computing', 'Game Development', 'Open Source',
  'Competitive Programming', 'Research', 'Entrepreneurship'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', department: user?.department || '',
    bio: user?.bio || '', skills: user?.skills || [], interests: user?.interests || [],
    github_url: user?.github_url || '', linkedin_url: user?.linkedin_url || '',
    portfolio_url: user?.portfolio_url || '', cgpa: user?.cgpa || '',
    year_of_study: user?.year_of_study || ''
  });

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(form);
      const res = await authAPI.getMe();
      updateUser(res.data);
      toast.success('Profile updated successfully! ✨');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">Manage your profile, skills and interests</p>
      </div>

      <div className="page-content">
        <div style={{ maxWidth: 800 }}>
          {/* Profile Header */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{user?.name}</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span className="tag">📧 {user?.email}</span>
                  <span className={`badge badge-${user?.role === 'admin' ? 'danger' : user?.role === 'faculty' ? 'warning' : 'primary'}`}>
                    {user?.role}
                  </span>
                  {user?.department && <span className="tag">🏫 {user?.department}</span>}
                  {user?.roll_number && <span className="tag">🎓 {user?.roll_number}</span>}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>📋 Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" rows={3} value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself, your interests and career goals..." />
              </div>
            </div>

            {/* Student-specific fields */}
            {user?.role === 'student' && (
              <>
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 className="card-title" style={{ marginBottom: 20 }}>🎓 Academic Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Year of Study</label>
                      <select className="form-select" value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}>
                        <option value="">Select Year</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">CGPA</label>
                      <input className="form-input" type="number" min="0" max="10" step="0.01"
                        value={form.cgpa} onChange={e => setForm({ ...form, cgpa: e.target.value })}
                        placeholder="e.g., 8.5" />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 className="card-title" style={{ marginBottom: 16 }}>💻 Technical Skills</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Select all skills you have. This helps team leaders find you for projects.
                  </p>
                  <div className="skills-grid">
                    {SKILLS_OPTIONS.map(skill => (
                      <button key={skill} type="button"
                        onClick={() => toggleSkill(skill)}
                        style={{
                          padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13,
                          border: `1px solid ${form.skills.includes(skill) ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.skills.includes(skill) ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)',
                          color: form.skills.includes(skill) ? 'var(--primary-light)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'var(--transition)',
                        }}>
                        {skill}
                      </button>
                    ))}
                  </div>
                  {form.skills.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      ✅ {form.skills.length} skill{form.skills.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                {/* Interests */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 className="card-title" style={{ marginBottom: 16 }}>🎯 Interests</h3>
                  <div className="skills-grid">
                    {INTERESTS_OPTIONS.map(interest => (
                      <button key={interest} type="button"
                        onClick={() => toggleInterest(interest)}
                        style={{
                          padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13,
                          border: `1px solid ${form.interests.includes(interest) ? 'var(--secondary)' : 'var(--border)'}`,
                          background: form.interests.includes(interest) ? 'rgba(139,92,246,0.15)' : 'var(--bg-input)',
                          color: form.interests.includes(interest) ? '#c084fc' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'var(--transition)',
                        }}>
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Links */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>🔗 Links & Portfolio</h3>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" type="url" value={form.github_url}
                  onChange={e => setForm({ ...form, github_url: e.target.value })}
                  placeholder="https://github.com/yourusername" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" type="url" value={form.linkedin_url}
                  onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourusername" />
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio Website</label>
                <input className="form-input" type="url" value={form.portfolio_url}
                  onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
                  placeholder="https://yourportfolio.com" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '⏳ Saving...' : '💾 Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
