import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig = {
  submitted: { label: 'Submitted', color: 'info', icon: '📥' },
  assigned: { label: 'Assigned', color: 'secondary', icon: '👤' },
  in_progress: { label: 'In Progress', color: 'primary', icon: '⚙️' },
  resolved: { label: 'Resolved', color: 'success', icon: '✅' },
  rejected: { label: 'Rejected', color: 'danger', icon: '❌' },
  closed: { label: 'Closed', color: 'secondary', icon: '🔒' },
};

const priorityConfig = {
  low: { color: 'success', icon: '🟢' },
  medium: { color: 'info', icon: '🔵' },
  high: { color: 'warning', icon: '🟡' },
  urgent: { color: 'danger', icon: '🔴' },
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category_id: '', priority: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, catRes] = await Promise.all([
        complaintsAPI.getAll({ ...filters, page: pagination.page }),
        complaintsAPI.getCategories(),
      ]);
      setComplaints(compRes.data.complaints);
      setPagination(prev => ({ ...prev, total: compRes.data.total, totalPages: compRes.data.totalPages }));
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">📋 {user?.role === 'student' ? 'My Complaints' : user?.role === 'admin' ? 'All Complaints' : 'Assigned Complaints'}</h1>
            <p className="page-subtitle">Track and manage campus grievances</p>
          </div>
          <Link to="/complaints/new" className="btn btn-complaint">
            📝 Submit Complaint
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by title or ticket ID..."
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="form-select" style={{ width: 160 }}
            value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([v, c]) => (
              <option key={v} value={v}>{c.icon} {c.label}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: 180 }}
            value={filters.category_id} onChange={e => setFilters({ ...filters, category_id: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 140 }}
            value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priority</option>
            <option value="low">🟢 Low</option>
            <option value="medium">🔵 Medium</option>
            <option value="high">🟡 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Complaints Found</h3>
            <p>
              {user?.role === 'student'
                ? "You haven't submitted any complaints yet."
                : 'No complaints match your current filters.'}
            </p>
            <Link to="/complaints/new" className="btn btn-complaint">Submit a Complaint</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {complaints.map(c => (
                <div key={c.id} className="complaint-card" onClick={() => navigate(`/complaints/${c.id}`)}>
                  <div className="complaint-card-header">
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
                      {/* Category Icon */}
                      <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>
                        {c.category_icon}
                      </div>
                      <div className="complaint-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className="ticket-id">{c.ticket_id}</span>
                          <span className={`badge badge-${statusConfig[c.status]?.color}`}>
                            {statusConfig[c.status]?.icon} {statusConfig[c.status]?.label}
                          </span>
                          <span className={`badge badge-${priorityConfig[c.priority]?.color}`}>
                            {priorityConfig[c.priority]?.icon} {c.priority}
                          </span>
                        </div>
                        <h3>{c.title}</h3>
                        <p style={{ marginTop: 4 }}>{c.category_name} • {c.assigned_department}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(new Date(c.created_at), 'MMM d, yyyy')}
                      </span>
                      {c.submitted_by_name && user?.role !== 'student' && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          by {c.submitted_by_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.location && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      📍 {c.location}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 14 }}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
