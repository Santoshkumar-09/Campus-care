import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, projRes] = await Promise.all([
        projectsAPI.getFacultyDashboard(),
        projectsAPI.getAll({}),
      ]);
      setData(dashRes.data);
      setProjects(projRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner" style={{ minHeight: '80vh' }}><div className="spinner"></div></div>;

  const statusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length },
  ].filter(d => d.value > 0);

  const categoryData = [...new Set(projects.map(p => p.category).filter(Boolean))].map(cat => ({
    name: cat,
    count: projects.filter(p => p.category === cat).length,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Faculty Dashboard</h1>
        <p className="page-subtitle">Monitor all student projects and academic progress</p>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Projects', value: data?.stats?.total_projects || 0, icon: '🚀', color: 'primary' },
            { label: 'Active Projects', value: data?.stats?.active_projects || 0, icon: '⚡', color: 'accent' },
            { label: 'Completed', value: data?.stats?.completed_projects || 0, icon: '✅', color: 'success' },
            { label: 'Total Students', value: data?.stats?.total_students || 0, icon: '👥', color: 'warning' },
            { label: 'Total Tasks', value: data?.stats?.total_tasks || 0, icon: '📋', color: 'primary' },
            { label: 'Tasks Done', value: data?.stats?.completed_tasks || 0, icon: '🎯', color: 'success' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Projects by Status</div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Projects by Category</div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* All Projects Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Projects Overview</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Team</th>
                  <th>Progress</th>
                  <th>Tasks Done</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = `/projects/${p.id}`}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {p.creator_name}</div>
                    </td>
                    <td><span className="tag">{p.category || '-'}</span></td>
                    <td>
                      <span className={`badge badge-${p.status === 'active' ? 'primary' : p.status === 'completed' ? 'success' : 'secondary'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.member_count || 0} members</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80, height: 4 }}>
                          <div className="progress-fill" style={{ width: `${p.progress || 0}%` }}></div>
                        </div>
                        <span style={{ fontSize: 12 }}>{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.completed_tasks || 0}/{p.total_tasks || 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
