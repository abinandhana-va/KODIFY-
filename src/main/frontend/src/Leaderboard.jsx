import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { Trophy, Award, Flame, CheckCircle, RefreshCw, Filter, User as UserIcon, Code2, AlertCircle } from 'lucide-react';

function Leaderboard() {
  const { user: currentUser } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [type, setType] = useState('global'); // 'global' or 'weekly'
  const [language, setLanguage] = useState('ALL'); // 'ALL', 'JAVA', 'PYTHON', 'C'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (type) params.type = type;
      if (language && language !== 'ALL') params.language = language;

      const res = await axios.get('/api/leaderboard', { params });
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Unable to load leaderboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type, language]);

  // Find current user's entry
  const currentUserEntry = leaderboard.find(
    entry => entry.userId === currentUser?.id || entry.username === currentUser?.username
  );

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
        }}>
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
          color: '#334155',
          fontWeight: 800,
          boxShadow: '0 2px 6px rgba(148, 163, 184, 0.3)'
        }}>
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #b45309, #d97706)',
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 2px 6px rgba(180, 83, 9, 0.3)'
        }}>
          🥉
        </span>
      );
    }
    return (
      <span style={{
        fontWeight: 700,
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        padding: '0 8px'
      }}>
        #{rank}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* HEADER SECTION */}
      <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={26} color="var(--primary)" />
              <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.6rem' }}>
                KODIFY Leaderboard
              </h2>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time competitive coder rankings based on verified problem submissions & difficulty scores.
            </p>
          </div>

          <button
            onClick={fetchLeaderboard}
            style={{
              padding: '0.5rem 1rem',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* USER STATS SUMMARY (If logged in user is a competitor) */}
      {currentUser && currentUser.role !== 'ADMIN' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="dashboard-card" style={{ padding: '1.25rem', marginBottom: 0, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Current Rank</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
              {currentUserEntry ? `#${currentUserEntry.rank}` : 'Unranked'}
            </div>
          </div>
          <div className="dashboard-card" style={{ padding: '1.25rem', marginBottom: 0, borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Problems Solved</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.2rem' }}>
              {currentUserEntry ? currentUserEntry.problemsSolved : 0}
            </div>
          </div>
          <div className="dashboard-card" style={{ padding: '1.25rem', marginBottom: 0, borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score Points</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
              {currentUserEntry ? currentUserEntry.score : 0}
            </div>
          </div>
          <div className="dashboard-card" style={{ padding: '1.25rem', marginBottom: 0, borderLeft: '4px solid var(--coral)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--coral)', marginTop: '0.2rem' }}>
              {currentUserEntry ? `${currentUserEntry.acceptanceRate}%` : '0%'}
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="dashboard-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* TIMEFRAME TABS */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setType('global')}
              style={{
                padding: '0.45rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: type === 'global' ? 'var(--primary)' : 'transparent',
                color: type === 'global' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                boxShadow: type === 'global' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Global All-Time
            </button>
            <button
              onClick={() => setType('weekly')}
              style={{
                padding: '0.45rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: type === 'weekly' ? 'var(--primary)' : 'transparent',
                color: type === 'weekly' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                boxShadow: type === 'weekly' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Weekly Challenge
            </button>
          </div>

          {/* LANGUAGE SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1.5px solid var(--border)',
                background: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Languages</option>
              <option value="JAVA">Java</option>
              <option value="PYTHON">Python</option>
              <option value="C">C</option>
            </select>
          </div>

        </div>
      </div>

      {/* LEADERBOARD TABLE CARD */}
      <div className="dashboard-card" style={{ padding: '1.25rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Calculating leaderboard standings...</p>
          </div>
        )}

        {error && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Trophy size={48} color="var(--primary)" style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>No competitors yet</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              {type === 'weekly'
                ? 'No accepted submissions have been recorded for the current week.'
                : 'Solve challenges from the problem bank to appear on the leaderboard.'}
            </p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>User</th>
                  <th style={{ textAlign: 'center' }}>Problems Solved</th>
                  <th style={{ textAlign: 'center' }}>Accuracy</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th style={{ textAlign: 'center' }}>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentUser =
                    (currentUser?.id && entry.userId === currentUser.id) ||
                    (currentUser?.username && entry.username === currentUser.username);

                  return (
                    <tr
                      key={entry.userId || entry.username}
                      style={{
                        background: isCurrentUser ? 'rgba(0, 129, 167, 0.08)' : 'inherit',
                        borderLeft: isCurrentUser ? '4px solid var(--primary)' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {getRankBadge(entry.rank)}
                      </td>

                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isCurrentUser ? 'var(--primary)' : '#e2e8f0',
                            color: isCurrentUser ? '#ffffff' : 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {entry.name ? entry.name.charAt(0).toUpperCase() : entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{entry.name || entry.username}</span>
                              {isCurrentUser && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--primary)',
                                  color: '#ffffff',
                                  letterSpacing: '0.5px'
                                }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', verticalAlign: 'middle' }}>
                        {entry.problemsSolved}
                      </td>

                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: entry.acceptanceRate >= 75 ? '#dcfce7' : entry.acceptanceRate >= 40 ? '#fef08a' : '#fee2e2',
                          color: entry.acceptanceRate >= 75 ? '#166534' : entry.acceptanceRate >= 40 ? '#854d0e' : '#991b1b'
                        }}>
                          {entry.acceptanceRate}%
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', verticalAlign: 'middle' }}>
                        {entry.score}
                      </td>

                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                        {entry.acceptedSubmissions} / {entry.totalSubmissions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Leaderboard;
