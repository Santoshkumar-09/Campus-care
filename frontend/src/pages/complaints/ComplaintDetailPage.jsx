import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const statusFlow = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'];

function UpdateStatusModal({ complaint, onClose, onUpdate }) {
  const [form, setForm] = useState({
    status: complaint.status, notes: '', rejection_reason: '',
    resolution_notes: '', estimated_resolution: ''
  });

  const nextStatuses = ['submitted', 'assigned', 'in_progress', 'resolved', 'rejected', 'closed'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">⚙️ Update Status</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">New Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {nextStatuses.map(s => (
              <option key={s} value={s}>{statusConfig[s]?.icon} {statusConfig[s]?.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status Update Notes</label>
          <textarea className="form-textarea" rows={3} placeholder="What action was taken?"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        {form.status === 'rejected' && (
          <div className="form-group">
            <label className="form-label">Rejection Reason *</label>
            <textarea className="form-textarea" rows={2} placeholder="Why is this being rejected?"
              value={form.rejection_reason} onChange={e => setForm({ ...form, rejection_reason: e.target.value })} />
          </div>
        )}
        {form.status === 'resolved' && (
          <div className="form-group">
            <label className="form-label">Resolution Notes</label>
            <textarea className="form-textarea" rows={2} placeholder="How was this resolved?"
              value={form.resolution_notes} onChange={e => setForm({ ...form, resolution_notes: e.target.value })} />
          </div>
        )}
        {['assigned', 'in_progress'].includes(form.status) && (
          <div className="form-group">
            <label className="form-label">Estimated Resolution Date</label>
            <input className="form-input" type="date" value={form.estimated_resolution}
              onChange={e => setForm({ ...form, estimated_resolution: e.target.value })} />
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onUpdate(form)}>Update Status</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ complaintId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">⭐ Rate Resolution</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">How satisfied are you with the resolution?</label>
          <div className="rating-stars" style={{ marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`star ${s <= rating ? 'filled' : 'empty'}`}
                onClick={() => setRating(s)}>★</span>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Additional Feedback (optional)</label>
          <textarea className="form-textarea" rows={3} placeholder="Tell us about your experience..."
            value={text} onChange={e => setText(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Skip</button>
          <button className="btn btn-primary" disabled={!rating}
            onClick={() => onSubmit({ rating, feedback_text: text })}>
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchComplaint(); }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const res = await complaintsAPI.getById(id);
      setComplaint(res.data);
    } catch (err) {
      toast.error('Failed to load complaint');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (data) => {
    try {
      await complaintsAPI.updateStatus(id, data);
      toast.success('Status updated successfully!');
      setShowStatusModal(false);
      fetchComplaint();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await complaintsAPI.addComment(id, { content: comment });
      setComment('');
      fetchComplaint();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleFeedback = async (data) => {
    try {
      await complaintsAPI.submitFeedback(id, data);
      toast.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
      fetchComplaint();
    } catch (err) {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) return <div className="loading-spinner" style={{ minHeight: '80vh' }}><div className="spinner"></div></div>;
  if (!complaint) return null;

  const status = statusConfig[complaint.status] || {};
  const canUpdate = user?.role === 'admin' || user?.role === 'faculty';
  const canFeedback = user?.id === complaint.submitted_by && complaint.status === 'resolved' && !complaint.feedback?.length;
  const currentStatusIndex = statusFlow.indexOf(complaint.status);

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/complaints')} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="ticket-id" style={{ fontSize: 16 }}>{complaint.ticket_id}</span>
              <span className={`badge badge-${status.color}`}>{status.icon} {status.label}</span>
              <span className={`badge badge-${complaint.priority === 'urgent' ? 'danger' : complaint.priority === 'high' ? 'warning' : 'info'}`}>
                {complaint.priority}
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: 24 }}>{complaint.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {complaint.category_icon} {complaint.category_name} • {complaint.assigned_department}
              {complaint.location && ` • 📍 ${complaint.location}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {canUpdate && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowStatusModal(true)}>
                ⚙️ Update Status
              </button>
            )}
            {canFeedback && (
              <button className="btn btn-complaint btn-sm" onClick={() => setShowFeedbackModal(true)}>
                ⭐ Rate Resolution
              </button>
            )}
          </div>
        </div>

        {/* Status Progress Bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {statusFlow.map((s, i) => {
              const isDone = i <= currentStatusIndex && complaint.status !== 'rejected';
              const isCurrent = s === complaint.status;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                      background: complaint.status === 'rejected' && s === 'rejected' ? 'var(--danger)' :
                                  isDone ? 'var(--gradient-primary)' : 'var(--bg-input)',
                      border: `2px solid ${isCurrent ? 'var(--primary)' : isDone ? 'transparent' : 'var(--border)'}`,
                      color: isDone ? 'white' : 'var(--text-muted)',
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: 10, color: isCurrent ? 'var(--primary-light)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {statusConfig[s]?.label}
                    </div>
                  </div>
                  {i < statusFlow.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < currentStatusIndex ? 'var(--primary)' : 'var(--border)', margin: '0 8px', marginBottom: 20 }}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Main Content */}
          <div>
            {/* Description */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 12 }}>📋 Complaint Description</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{complaint.description}</p>
              {complaint.image_url && (
                <div style={{ marginTop: 16 }}>
                  <img src={complaint.image_url} alt="Complaint" style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>

            {/* Resolution Notes */}
            {complaint.resolution_notes && (
              <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                <h3 className="card-title" style={{ color: 'var(--success)', marginBottom: 12 }}>✅ Resolution</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{complaint.resolution_notes}</p>
                {complaint.resolved_at && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Resolved on: {format(new Date(complaint.resolved_at), 'MMMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason */}
            {complaint.rejection_reason && (
              <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <h3 className="card-title" style={{ color: 'var(--danger)', marginBottom: 12 }}>❌ Rejection Reason</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{complaint.rejection_reason}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>📜 Status History</h3>
              <div className="timeline">
                {complaint.statusHistory?.map((h, i) => (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-dot" style={{
                      background: h.status === 'resolved' ? 'var(--success)' :
                                  h.status === 'rejected' ? 'var(--danger)' : 'var(--primary)'
                    }}></div>
                    <div className="timeline-content">
                      <div className="timeline-status" style={{ color: statusConfig[h.status]?.color === 'success' ? 'var(--success)' : 'var(--text-primary)' }}>
                        {statusConfig[h.status]?.icon} {statusConfig[h.status]?.label}
                      </div>
                      <div className="timeline-notes">{h.notes}</div>
                      <div className="timeline-meta">
                        {h.changed_by_name && `By ${h.changed_by_name} • `}
                        {format(new Date(h.changed_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>💬 Comments</h3>
              {complaint.comments?.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {c.user_name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user_name}</span>
                      {c.user_role !== 'student' && (
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>{c.user_role}</span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {format(new Date(c.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-input)',
                      borderRadius: 'var(--radius)', padding: '8px 12px', border: '1px solid var(--border)' }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddComment} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <input className="form-input" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" type="submit">Send</button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>ℹ️ Complaint Info</h3>
              {[
                { label: 'Ticket ID', value: complaint.ticket_id, mono: true },
                { label: 'Submitted By', value: complaint.submitted_by_name },
                { label: 'Contact', value: complaint.submitted_by_email },
                { label: 'Phone', value: complaint.submitted_by_phone },
                { label: 'Category', value: `${complaint.category_icon} ${complaint.category_name}` },
                { label: 'Department', value: complaint.assigned_department },
                { label: 'Assigned To', value: complaint.assigned_to_name || '—' },
                { label: 'Submitted', value: format(new Date(complaint.created_at), 'MMM d, yyyy') },
                { label: 'Est. Resolution', value: complaint.estimated_resolution ? format(new Date(complaint.estimated_resolution), 'MMM d, yyyy') : '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right',
                    fontFamily: item.mono ? 'monospace' : undefined, color: item.mono ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {complaint.feedback?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⭐ User Feedback</h3>
                {complaint.feedback.map(f => (
                  <div key={f.id}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: 20, color: s <= f.rating ? '#fbbf24' : 'var(--text-muted)' }}>★</span>
                      ))}
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8, alignSelf: 'center' }}>{f.rating}/5</span>
                    </div>
                    {f.feedback_text && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.feedback_text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <UpdateStatusModal complaint={complaint} onClose={() => setShowStatusModal(false)} onUpdate={handleUpdateStatus} />
      )}
      {showFeedbackModal && (
        <FeedbackModal complaintId={id} onClose={() => setShowFeedbackModal(false)} onSubmit={handleFeedback} />
      )}
    </div>
  );
}
