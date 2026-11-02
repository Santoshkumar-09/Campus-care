import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-badge">
          🏫 REVA University Weekend Hackathon
        </div>

        <h1 className="landing-title">
          Campus <span>Smart Portal</span>
        </h1>

        <p className="landing-subtitle">
          A unified platform for managing student projects with team collaboration and
          resolving campus grievances with transparency and accountability.
        </p>

        <div className="app-cards">
          <Link to="/projects" className="app-card project">
            <span className="app-card-icon">🚀</span>
            <div className="app-card-title">Student Project Portal</div>
            <div className="app-card-desc">
              Form teams, manage projects with Kanban boards, assign tasks, 
              track milestones and get faculty mentorship.
            </div>
            <div className="app-card-features">
              <div className="app-feature">Team formation & collaboration</div>
              <div className="app-feature">Kanban task management</div>
              <div className="app-feature">Faculty dashboard & reviews</div>
              <div className="app-feature">Document & resource sharing</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <span className="btn btn-primary btn-sm">Open Project Portal →</span>
            </div>
          </Link>

          <Link to="/complaints" className="app-card complaint">
            <span className="app-card-icon">📋</span>
            <div className="app-card-title">Complaint Management</div>
            <div className="app-card-desc">
              Submit campus complaints with auto-generated ticket IDs,
              track resolution status and provide feedback.
            </div>
            <div className="app-card-features">
              <div className="app-feature">Auto ticket ID generation</div>
              <div className="app-feature">Department auto-assignment</div>
              <div className="app-feature">Real-time status tracking</div>
              <div className="app-feature">Analytics & resolution metrics</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <span className="btn btn-complaint btn-sm">Open Complaint Portal →</span>
            </div>
          </Link>
        </div>

        {!user ? (
          <Link to="/login" className="btn btn-primary btn-lg">
            🎓 Login to Get Started
          </Link>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Welcome back, <strong style={{ color: 'var(--primary-light)' }}>{user.name}</strong>! 
            Choose an app above to get started.
          </div>
        )}

        <div style={{ marginTop: 48, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { emoji: '👥', label: 'Team Collaboration' },
            { emoji: '📊', label: 'Progress Tracking' },
            { emoji: '🎯', label: 'Task Management' },
            { emoji: '📢', label: 'Grievance System' },
            { emoji: '📈', label: 'Analytics Dashboard' },
            { emoji: '🔔', label: 'Status Notifications' },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
              <span>{f.emoji}</span> {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
