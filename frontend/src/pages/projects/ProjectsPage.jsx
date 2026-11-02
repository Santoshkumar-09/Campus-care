import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusColors = {
  planning: 'secondary', active: 'primary', completed: 'success', on_hold: 'warning'
};

const categoryColors = {
  'Web Dev': '#6366f1', 'AI/ML': '#8b5cf6', 'IoT': '#06b6d4',
  'Mobile': '#10b981', 'Data Science': '#f59e0b', 'Cybersecurity': '#ef4444'
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getAll(filters);
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (p) => {
    if (p >= 80) return 'success';
    if (p >= 50) return '';
    return 'warning';
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">🚀 Projects</h1>
            <p className="page-subtitle">
              {user?.role === 'student' ? 'Your active and past projects' : 'All student projects'}
            </p>
          </div>
          <Link to="/projects/new" className="btn btn-primary">
            ➕ New Project
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search projects..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select className="form-select" style={{ width: 160 }}
            value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select className="form-select" style={{ width: 160 }}
            value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All Categories</option>
            {['Web Dev', 'AI/ML', 'IoT', 'Mobile', 'Data Science', 'Cybersecurity'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No Projects Yet</h3>
            <p>Create your first project and start building something amazing!</p>
            <Link to="/projects/new" className="btn btn-primary">Create Project</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {projects.map(project => (
              <div key={project.id} className="card card-hover"
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{ cursor: 'pointer' }}>
                
                {/* Category Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="tag" style={{ 
                    background: categoryColors[project.category] ? `${categoryColors[project.category]}22` : undefined,
                    borderColor: categoryColors[project.category] ? `${categoryColors[project.category]}44` : undefined,
                    color: categoryColors[project.category] || 'var(--text-secondary)',
                  }}>
                    {project.category || 'General'}
                  </span>
                  <span className={`badge badge-${statusColors[project.status] || 'secondary'}`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {project.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, 
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description || 'No description provided.'}
                </p>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${getProgressColor(project.progress || 0)}`}
                      style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>👥 {project.member_count || 0} members</span>
                    <span>✅ {project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                  </div>
                  {project.end_date && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      📅 {format(new Date(project.end_date), 'MMM d')}
                    </span>
                  )}
                </div>

                {project.mentor_name && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                    👨‍🏫 Mentor: {project.mentor_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
