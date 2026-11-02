import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProjectNavLinks = ({ user }) => (
  <>
    <div className="nav-section-label">Project Portal</div>
    <NavLink to="/projects" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">🚀</span> My Projects
    </NavLink>
    <NavLink to="/projects/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">➕</span> New Project
    </NavLink>
    <NavLink to="/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">👥</span> Find Students
    </NavLink>
    {(user?.role === 'faculty' || user?.role === 'admin') && (
      <NavLink to="/faculty-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📊</span> Faculty Dashboard
      </NavLink>
    )}
  </>
);

const ComplaintNavLinks = ({ user }) => (
  <>
    <div className="nav-section-label" style={{ marginTop: 8 }}>Complaint System</div>
    <NavLink to="/complaints" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">📋</span> My Complaints
    </NavLink>
    <NavLink to="/complaints/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">📝</span> Submit Complaint
    </NavLink>
    {(user?.role === 'admin' || user?.role === 'faculty') && (
      <>
        <NavLink to="/complaints/all" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📂</span> All Complaints
        </NavLink>
        <NavLink to="/complaints/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📈</span> Analytics
        </NavLink>
      </>
    )}
  </>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ background: 'var(--gradient-primary)', fontSize: 20 }}>🎓</div>
        <div className="logo-text">REVA Campus Portal</div>
        <div className="logo-sub">Smart Student Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span> Home
          </NavLink>
        </div>

        <div className="nav-section">
          <ProjectNavLinks user={user} />
        </div>

        <div className="nav-section">
          <ComplaintNavLinks user={user} />
        </div>

        <div className="nav-section">
          <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span> My Profile
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">⚙️</span> User Management
            </NavLink>
          )}
          <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role} • {user?.department?.split(' ')[0] || 'REVA'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
