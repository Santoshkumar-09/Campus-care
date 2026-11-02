import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', priority: 'medium',
    location: '', image_url: ''
  });

  useEffect(() => {
    complaintsAPI.getCategories().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectedCategory = categories.find(c => c.id === form.category_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category_id || !form.description.trim()) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      const res = await complaintsAPI.submit(form);
      toast.success(`✅ Complaint submitted! Ticket ID: ${res.data.ticket_id}`);
      navigate(`/complaints/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📝 Submit Complaint</h1>
        <p className="page-subtitle">Report campus issues and get them resolved quickly</p>
      </div>

      <div className="page-content">
        <div style={{ maxWidth: 720 }}>
          <form onSubmit={handleSubmit}>
            {/* Category Selection */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>🏷️ Select Category</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {categories.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => setForm({ ...form, category_id: cat.id })}
                    style={{
                      padding: '14px 12px', border: `2px solid ${form.category_id === cat.id ? 'var(--complaint-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', background: form.category_id === cat.id ? 'rgba(249,115,22,0.1)' : 'var(--bg-input)',
                      cursor: 'pointer', transition: 'var(--transition)', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{cat.department}</div>
                  </button>
                ))}
              </div>
              {selectedCategory && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(249,115,22,0.05)', borderRadius: 'var(--radius)',
                  border: '1px solid rgba(249,115,22,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  ℹ️ This complaint will be sent to: <strong>{selectedCategory.department}</strong>
                </div>
              )}
            </div>

            {/* Complaint Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>📋 Complaint Details</h3>

              <div className="form-group">
                <label className="form-label">Complaint Title *</label>
                <input className="form-input" name="title"
                  placeholder="Brief description of the issue (e.g., Wi-Fi not working in Block C)"
                  value={form.title} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea className="form-textarea" name="description" rows={5}
                  placeholder="Provide all relevant details: when did it start, how often, what impact, any previous complaints..."
                  value={form.description} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">🟢 Low — Minor inconvenience</option>
                    <option value="medium">🔵 Medium — Affects daily tasks</option>
                    <option value="high">🟡 High — Major disruption</option>
                    <option value="urgent">🔴 Urgent — Safety/Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" name="location"
                    placeholder="e.g., Block A, Room 204, Library"
                    value={form.location} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (optional)</label>
                <input className="form-input" name="image_url" type="url"
                  placeholder="https://... (link to screenshot or photo of the issue)"
                  value={form.image_url} onChange={handleChange} />
              </div>
            </div>

            {/* Ticket Info */}
            <div style={{ marginBottom: 20, padding: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)' }}>
              🎫 A unique <strong>Ticket ID</strong> will be auto-generated for tracking your complaint.
              You can track status at any time from "My Complaints".
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-complaint btn-lg" disabled={loading}>
                {loading ? '⏳ Submitting...' : '📝 Submit Complaint'}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/complaints')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
