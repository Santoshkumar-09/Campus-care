import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getStudents({ search });
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Find Students</h1>
        <p className="page-subtitle">Browse student profiles by skills and interests to form your dream team</p>
      </div>

      <div className="page-content">
        <div className="filter-bar" style={{ marginBottom: 24 }}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by name, department or skills..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No Students Found</h3>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {students.map(s => (
              <div key={s.id} className="card card-hover">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {s.name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.department}</div>
                    {s.roll_number && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.roll_number}</div>}
                  </div>
                  {s.cgpa && (
                    <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 'var(--radius)', padding: '4px 8px', fontSize: 12, fontWeight: 700, color: 'var(--primary-light)' }}>
                      {parseFloat(s.cgpa).toFixed(1)} CGPA
                    </div>
                  )}
                </div>

                {s.bio && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.bio}
                  </p>
                )}

                {s.skills?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>SKILLS</div>
                    <div className="skills-grid">
                      {s.skills.slice(0, 5).map(sk => <span key={sk} className="tag">{sk}</span>)}
                      {s.skills.length > 5 && <span className="tag">+{s.skills.length - 5}</span>}
                    </div>
                  </div>
                )}

                {s.interests?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>INTERESTS</div>
                    <div className="skills-grid">
                      {s.interests.slice(0, 3).map(i => (
                        <span key={i} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                          fontSize: 11, color: '#c084fc' }}>
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.github_url && (
                  <a href={s.github_url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    💻 View GitHub
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
