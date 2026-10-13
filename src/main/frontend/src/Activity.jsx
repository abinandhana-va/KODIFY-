import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity as ActivityIcon, CheckCircle2, UserCheck, KeyRound, UserPlus } from 'lucide-react';

function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/activity');
        setActivities(res.data || []);
      } catch (err) {
        console.error("Error loading activity:", err);
        setError('Failed to load user activity history.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getActionIcon = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('solved')) return <CheckCircle2 size={20} color="#16a34a" />;
    if (act.includes('logged')) return <UserCheck size={20} color="var(--primary)" />;
    if (act.includes('password')) return <KeyRound size={20} color="#d97706" />;
    if (act.includes('created')) return <UserPlus size={20} color="var(--secondary)" />;
    return <ActivityIcon size={20} color="var(--primary)" />;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--text)' }}>Activity History</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Recent account events and problem-solving activity log.
        </p>
      </div>

      <div className="dashboard-card">
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading activity history...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && activities.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
            No recent activity recorded.
          </p>
        )}

        {!loading && !error && activities.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '1.25rem',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--primary)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {getActionIcon(a.action)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{a.action}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                    {a.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Activity;
