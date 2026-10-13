import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Clock, Medal, Award, User, RefreshCw } from 'lucide-react';

function ContestLeaderboard() {
  const { id } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [contestTitle, setContestTitle] = useState('Contest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/contests/${id}/leaderboard`);
      setLeaderboard(res.data || []);
      
      // Also get contest title
      const contestRes = await axios.get(`/api/contests/${id}`);
      if (contestRes.data?.title) {
        setContestTitle(contestRes.data.title);
      }
    } catch (err) {
      console.error("Error loading contest leaderboard:", err);
      setError("Unable to load contest leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [id]);

  const formatFinishTime = (isoString) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="dashboard-card">
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to={`/contests/${id}`} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={26} color="var(--primary)" /> {contestTitle} Leaderboard
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Official rankings computed by problems solved (DESC), total score (DESC), and time (ASC).
              </p>
            </div>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="admin-btn"
            style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading rankings...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && leaderboard.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>
            No submissions recorded yet for this contest.
          </p>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Coder</th>
                  <th style={{ textAlign: 'center' }}>Problems Solved</th>
                  <th style={{ textAlign: 'center' }}>Total Score</th>
                  <th>Last Solve Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(entry => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.userId}
                      style={{
                        background: isTop1 ? 'rgba(234, 179, 8, 0.08)' : (isTop2 ? 'rgba(148, 163, 184, 0.08)' : (isTop3 ? 'rgba(217, 119, 6, 0.08)' : 'transparent'))
                      }}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>
                        {isTop1 ? (
                          <span style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem' }}>
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '1.05rem' }}>
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '1.05rem' }}>
                            🥉 3
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>#{entry.rank}</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {(entry.name || entry.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                              {entry.name || entry.username}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: entry.problemsSolved > 0 ? '#16a34a' : 'var(--text-muted)',
                          background: entry.problemsSolved > 0 ? '#dcfce7' : '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {entry.problemsSolved}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                        {entry.score} pts
                      </td>

                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatFinishTime(entry.finishTime)}
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

export default ContestLeaderboard;
