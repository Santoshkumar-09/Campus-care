import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Priority badge colors
const priorityColors = { low: 'success', medium: 'info', high: 'warning', urgent: 'danger' };
const statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

// Task Modal
function TaskModal({ task, members, onClose, onSave }) {
  const [form, setForm] = useState(task || {
    title: '', description: '', assigned_to: '', priority: 'medium',
    status: 'todo', due_date: '', estimated_hours: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{task ? '✏️ Edit Task' : '➕ Add Task'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" placeholder="e.g., Implement user authentication"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Task details..."
              value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assigned_to || ''}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">🟢 Low</option>
                <option value="medium">🔵 Medium</option>
                <option value="high">🟡 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date || ''}
                onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <input className="form-input" type="number" step="0.5" placeholder="e.g., 4"
              value={form.estimated_hours || ''} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Member Modal
function AddMemberModal({ projectId, onClose, onAdd }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersAPI.getStudents({ search }).then(res => setStudents(res.data)).catch(() => {});
  }, [search]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">👥 Add Team Member</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <input className="form-input" placeholder="Search students by name or department..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.department} • {s.roll_number}</div>
                {s.skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {s.skills.slice(0, 3).map(sk => (
                      <span key={sk} className="tag">{sk}</span>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onAdd(s.id)}>Add</button>
            </div>
          ))}
          {students.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No students found</div>}
        </div>
      </div>
    </div>
  );
}

// Document Modal
function DocumentModal({ projectId, onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', description: '', link_url: '', file_type: 'link' });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">📄 Add Document / Link</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" placeholder="e.g., Project Report PDF"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Brief description..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })}>
              <option value="link">🔗 Link</option>
              <option value="figma">🎨 Figma</option>
              <option value="github">💻 GitHub</option>
              <option value="doc">📝 Document</option>
              <option value="video">🎥 Video</option>
              <option value="report">📊 Report</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">URL / Link</label>
          <input className="form-input" type="url" placeholder="https://..."
            value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if(form.title) onAdd(form); }}>Add Document</button>
        </div>
      </div>
    </div>
  );
}

// Faculty Review Modal
function ReviewModal({ projectId, onClose, onAdd }) {
  const [form, setForm] = useState({ review_text: '', rating: 7 });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">⭐ Add Review</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Rating (1-10): {form.rating}</label>
          <input type="range" min={1} max={10} value={form.rating}
            onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--primary)', marginTop: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>Needs Improvement</span><span>Excellent</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Review Comments</label>
          <textarea className="form-textarea" rows={4} placeholder="Provide constructive feedback..."
            value={form.review_text} onChange={e => setForm({ ...form, review_text: e.target.value })} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onAdd(form)}>Submit Review</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchProject(); }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getById(id);
      setProject(res.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editTask?.id) {
        await projectsAPI.updateTask(id, editTask.id, taskData);
        toast.success('Task updated!');
      } else {
        await projectsAPI.createTask(id, taskData);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      setEditTask(null);
      fetchProject();
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await projectsAPI.addMember(id, { user_id: userId });
      toast.success('Team member added!');
      fetchProject();
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleAddDocument = async (docData) => {
    try {
      await projectsAPI.addDocument(id, docData);
      toast.success('Document added!');
      setShowDocModal(false);
      fetchProject();
    } catch (err) {
      toast.error('Failed to add document');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await projectsAPI.deleteTask(id, taskId);
      toast.success('Task deleted');
      fetchProject();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await projectsAPI.addComment(id, { content: comment });
      setComment('');
      fetchProject();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleAddReview = async (reviewData) => {
    try {
      await projectsAPI.addReview(id, reviewData);
      toast.success('Review submitted!');
      setShowReviewModal(false);
      fetchProject();
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const task = project.tasks.find(t => t.id === taskId);
      await projectsAPI.updateTask(id, taskId, { ...task, status: newStatus });
      fetchProject();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  if (loading) return <div className="loading-spinner" style={{ minHeight: '80vh' }}><div className="spinner"></div></div>;
  if (!project) return null;

  const tasksByStatus = {
    todo: project.tasks?.filter(t => t.status === 'todo') || [],
    in_progress: project.tasks?.filter(t => t.status === 'in_progress') || [],
    review: project.tasks?.filter(t => t.status === 'review') || [],
    done: project.tasks?.filter(t => t.status === 'done') || [],
  };

  const isMemberOrAdmin = user?.role !== 'student' ||
    project.members?.some(m => m.id === user?.id);

  const tabs = [
    { id: 'kanban', label: '📋 Kanban' },
    { id: 'team', label: '👥 Team' },
    { id: 'milestones', label: '🎯 Milestones' },
    { id: 'documents', label: '📄 Documents' },
    { id: 'comments', label: '💬 Discussion' },
    { id: 'reviews', label: '⭐ Reviews' },
  ];

  return (
    <div>
      <div className="page-header">
        {/* Back + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Back</button>
          <span className={`badge badge-${project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : 'secondary'}`}>
            {project.status?.replace('_', ' ')}
          </span>
          {project.category && <span className="tag">{project.category}</span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 className="page-title">{project.title}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, maxWidth: 600 }}>
              {project.description}
            </p>
            {project.mentor_name && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                👨‍🏫 Mentor: {project.mentor_name}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                💻 GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                🚀 Demo
              </a>
            )}
            {isMemberOrAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                ➕ Add Task
              </button>
            )}
            {(user?.role === 'faculty' || user?.role === 'admin') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewModal(true)}>
                ⭐ Review
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 16, maxWidth: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Overall Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'var(--transition)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* KANBAN TAB */}
        {activeTab === 'kanban' && (
          <div className="kanban-board">
            {Object.entries(tasksByStatus).map(([status, tasks]) => (
              <div key={status} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    {status === 'todo' ? '📌 To Do' :
                     status === 'in_progress' ? '⚡ In Progress' :
                     status === 'review' ? '🔍 Review' : '✅ Done'}
                  </div>
                  <span className="kanban-column-count">{tasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {tasks.map(task => (
                    <div key={task.id} className="task-card" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-meta">
                        <span className={`badge badge-${priorityColors[task.priority]}`}>{task.priority}</span>
                        {task.due_date && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            📅 {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {task.assignee_name && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                            {task.assignee_name[0]}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.assignee_name}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        {status !== 'done' && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={e => { e.stopPropagation(); handleQuickStatusChange(task.id, status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'review' : 'done'); }}>
                            Move →
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 8px', color: 'var(--danger)' }}
                          onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Team Members ({project.members?.length || 0})</h3>
              {isMemberOrAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                  ➕ Invite Member
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {project.members?.map(member => (
                <div key={member.id} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                      {member.name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{member.name}</div>
                        <span className={`badge ${member.project_role === 'leader' ? 'badge-warning' : 'badge-secondary'}`}>
                          {member.project_role === 'leader' ? '👑 Leader' : 'Member'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{member.department}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</div>
                      {member.skills?.length > 0 && (
                        <div className="skills-grid" style={{ marginTop: 8 }}>
                          {member.skills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  {(user?.role !== 'student' || project.created_by === user?.id) && member.id !== user?.id && (
                    <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 12, right: 12, color: 'var(--danger)', fontSize: 11 }}
                      onClick={() => handleRemoveMember(member.id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Project Milestones</h3>
            {project.milestones?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3>No Milestones Yet</h3>
                <p>Milestones help you track major project phases.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {project.milestones?.map(m => (
                  <div key={m.id} className="card" style={{ borderLeft: `4px solid ${m.status === 'completed' ? 'var(--success)' : m.status === 'in_progress' ? 'var(--primary)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{m.title}</div>
                        {m.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{m.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {m.due_date && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {format(new Date(m.due_date), 'MMM d, yyyy')}</span>}
                        <span className={`badge badge-${m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'primary' : 'secondary'}`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Documents & Resources</h3>
              {isMemberOrAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowDocModal(true)}>
                  ➕ Add Document
                </button>
              )}
            </div>
            {project.documents?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>No Documents Yet</h3>
                <p>Upload reports, designs, or add useful links here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {project.documents?.map(doc => (
                  <a key={doc.id} href={doc.link_url || doc.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}>
                    <div className="card card-hover">
                      <div style={{ fontSize: 32, marginBottom: 10 }}>
                        {doc.file_type === 'figma' ? '🎨' : doc.file_type === 'github' ? '💻' :
                         doc.file_type === 'video' ? '🎥' : doc.file_type === 'doc' ? '📝' : '🔗'}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{doc.title}</div>
                      {doc.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{doc.description}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>By {doc.uploader_name}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div style={{ maxWidth: 700 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Discussion</h3>
            <form onSubmit={handleAddComment} style={{ marginBottom: 24 }}>
              <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment or update..." rows={3} style={{ marginBottom: 8 }} />
              <button className="btn btn-primary btn-sm" type="submit">Post Comment</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {project.comments?.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {c.user_name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{c.user_name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-card)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
              {project.comments?.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <h3>No Comments Yet</h3>
                  <p>Start the discussion with your team!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Faculty Reviews</h3>
              {(user?.role === 'faculty' || user?.role === 'admin') && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowReviewModal(true)}>
                  ⭐ Add Review
                </button>
              )}
            </div>
            {project.reviews?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⭐</div>
                <h3>No Reviews Yet</h3>
                <p>Faculty reviews will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {project.reviews?.map(r => (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontWeight: 600 }}>{r.faculty_name}</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 20, color: '#fbbf24' }}>★</span>
                        <span style={{ fontWeight: 700 }}>{r.rating}/10</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                          {format(new Date(r.reviewed_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.review_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          members={project.members || []}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleSaveTask}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdd={handleAddMember}
        />
      )}
      {showDocModal && (
        <DocumentModal
          projectId={id}
          onClose={() => setShowDocModal(false)}
          onAdd={handleAddDocument}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          projectId={id}
          onClose={() => setShowReviewModal(false)}
          onAdd={handleAddReview}
        />
      )}
    </div>
  );
}
