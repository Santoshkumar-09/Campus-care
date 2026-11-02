import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Web Dev',
    start_date: '', end_date: '', github_url: '',
    demo_url: '', faculty_mentor: '', is_public: false
  });

  useEffect(() => {
    usersAPI.getFaculty().then(res => setFaculty(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Project title is required');
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      toast.success('🎉 Project created successfully!');
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">➕ Create New Project</h1>
        <p className="page-subtitle">Set up your project, define goals, and invite your team</p>
      </div>

      <div className="page-content">
        <div style={{ maxWidth: 720 }}>
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>📋 Basic Information</h3>

              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input className="form-input" name="title" placeholder="e.g., Smart Campus Navigation App"
                  value={form.title} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="description" rows={4}
                  placeholder="Describe your project goals, features, and expected outcomes..."
                  value={form.description} onChange={handleChange} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                    {['Web Dev', 'AI/ML', 'IoT', 'Mobile', 'Data Science', 'Cybersecurity', 'Blockchain', 'Cloud Computing', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty Mentor</label>
                  <select className="form-select" name="faculty_mentor" value={form.faculty_mentor} onChange={handleChange}>
                    <option value="">Select Mentor (Optional)</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} — {f.department}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" name="start_date" value={form.start_date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date / Deadline</label>
                  <input className="form-input" type="date" name="end_date" value={form.end_date} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>🔗 Links & Resources</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">GitHub Repository URL</label>
                  <input className="form-input" name="github_url" type="url"
                    placeholder="https://github.com/your/repo"
                    value={form.github_url} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Demo / Deployment URL</label>
                  <input className="form-input" name="demo_url" type="url"
                    placeholder="https://your-demo.vercel.app"
                    value={form.demo_url} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Make project public</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Visible to all students on the platform</div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? '⏳ Creating...' : '🚀 Create Project'}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/projects')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
