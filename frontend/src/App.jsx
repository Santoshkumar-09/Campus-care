import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';

// Project Pages
import ProjectsPage from './pages/projects/ProjectsPage';
import NewProjectPage from './pages/projects/NewProjectPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import FacultyDashboard from './pages/projects/FacultyDashboard';

// Complaint Pages
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import NewComplaintPage from './pages/complaints/NewComplaintPage';
import ComplaintDetailPage from './pages/complaints/ComplaintDetailPage';
import AnalyticsPage from './pages/complaints/AnalyticsPage';

// Protected Layout
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading REVA Campus Portal...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Role guard
function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/students" element={<StudentsPage />} />

        {/* App 1: Project Management */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/faculty-dashboard" element={
          <RequireRole roles={['faculty', 'admin']}>
            <FacultyDashboard />
          </RequireRole>
        } />

        {/* App 2: Complaint Management */}
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/complaints/new" element={<NewComplaintPage />} />
        <Route path="/complaints/all" element={
          <RequireRole roles={['admin', 'faculty']}>
            <ComplaintsPage />
          </RequireRole>
        } />
        <Route path="/complaints/analytics" element={
          <RequireRole roles={['admin', 'faculty']}>
            <AnalyticsPage />
          </RequireRole>
        } />
        <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
