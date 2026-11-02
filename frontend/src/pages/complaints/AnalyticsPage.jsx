import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6'];

const statusConfig = {
  submitted: { label: 'Submitted', color: '#3b82f6' },
  assigned: { label: 'Assigned', color: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#6366f1' },
  resolved: { label: 'Resolved', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' },
  closed: { label: 'Closed', color: '#64748b' },
};

export default function ComplaintAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintsAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" style={{ minHeight: '80vh' }}><div className="spinner"></div></div>;
  if (!data) return null;

  const { stats, byCategory, byPriority, recent, monthly } = data;

  const statusChartData = Object.entries({
    submitted: stats.submitted, assigned: stats.assigned,
    in_progress: stats.in_progress, resolved: stats.resolved,
    rejected: stats.rejected, closed: stats.closed
  }).map(([k, v]) => ({ name: statusConfig[k]?.label, value: parseInt(v) || 0, color: statusConfig[k]?.color }))
    .filter(d => d.value > 0);

  const resolutionHours = parseFloat(stats.avg_resolution_hours || 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Complaint Analytics</h1>
        <p className="page-subtitle">Real-time insights on campus grievances and resolution metrics</p>
      </div>

      <div className="page-content">
        {/* KPI Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Complaints', value: stats.total || 0, icon: '📋', color: 'primary' },
            { label: 'Submitted', value: stats.submitted || 0, icon: '📥', color: 'accent' },
            { label: 'In Progress', value: stats.in_progress || 0, icon: '⚙️', color: 'warning' },
            { label: 'Resolved', value: stats.resolved || 0, icon: '✅', color: 'success' },
            { label: 'Rejected', value: stats.rejected || 0, icon: '❌', color: 'danger' },
            {
              label: 'Avg Resolution',
              value: resolutionHours > 24 ? `${Math.round(resolutionHours / 24)}d` : `${Math.round(resolutionHours)}h`,
              icon: '⏱️', color: 'complaint'
            },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Complaints by Status</div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
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
              <div className="card-title">Complaints by Category</div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          {monthly?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Monthly Trends</div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Total" />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title">By Priority</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byPriority.map(p => {
                const total = byPriority.reduce((s, i) => s + parseInt(i.count), 0);
                const pct = total > 0 ? Math.round(parseInt(p.count) / total * 100) : 0;
                const color = p.priority === 'urgent' ? 'var(--danger)' : p.priority === 'high' ? 'var(--warning)' :
                              p.priority === 'medium' ? 'var(--info)' : 'var(--success)';
                return (
                  <div key={p.priority}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{p.priority}</span>
                      <span style={{ fontWeight: 600 }}>{p.count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: color, width: `${pct}%`, transition: 'width 0.5s' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Complaints</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(c => (
                  <tr key={c.ticket_id} style={{ cursor: 'pointer' }}>
                    <td><span className="ticket-id">{c.ticket_id}</span></td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                    <td>
                      <span className={`badge badge-${statusConfig[c.status]?.color === '#10b981' ? 'success' : statusConfig[c.status]?.color === '#ef4444' ? 'danger' : 'secondary'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.priority === 'urgent' ? 'danger' : c.priority === 'high' ? 'warning' : 'info'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>{c.submitted_by_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
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
