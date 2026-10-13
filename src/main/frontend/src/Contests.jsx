import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Calendar, Users, Award, CheckCircle2, Lock, Play, Building2, Search, AlertCircle, ArrowRight } from 'lucide-react';
import ContestReminderBanner from './components/ContestReminderBanner';

function Contests() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [stats, setStats] = useState({ participatedCount: 0, conductedCount: 0, winsCount: 0, currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ONGOING, UPCOMING, COMPLETED, MY
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchContests();
    fetchStats();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/contests');
      setContests(res.data || []);
    } catch (err) {
      console.error("Error fetching contests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/contests/my-stats');
      if (res.data) setStats(res.data);
    } catch (err) {
      console.error("Error fetching contest stats:", err);
    }
  };

  const handleRegister = async (contestId) => {
    try {
      setActionLoading(contestId);
      setMessage(null);
      await axios.post(`/api/contests/${contestId}/register`);
      setMessage({ type: 'success', text: 'Successfully registered for contest!' });
      fetchContests();
      fetchStats();
    } catch (err) {
      console.error("Registration error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Failed to register for contest.' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'TBA';
    try {
      if (typeof isoString === 'string' && isoString.includes('T')) {
        const clean = isoString.replace('Z', '').split('.')[0];
        const [datePart, timePart] = clean.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        const d = new Date(year, month - 1, day, hours, minutes);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const filteredContests = contests.filter(c => {
    if (filterTab === 'ONGOING' && c.status !== 'ONGOING') return false;
    if (filterTab === 'UPCOMING' && c.status !== 'UPCOMING' && c.status !== 'PUBLISHED') return false;
    if (filterTab === 'COMPLETED' && c.status !== 'COMPLETED') return false;
    if (filterTab === 'MY' && !c.registered) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title && c.title.toLowerCase().includes(q);
      const matchOrg = c.organizationName && c.organizationName.toLowerCase().includes(q);
      const matchDesc = c.description && c.description.toLowerCase().includes(q);
      return matchTitle || matchOrg || matchDesc;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '1.25rem' }}>
      
      {/* HEADER & STREAK BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={24} color="var(--primary)" /> Official Contests
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Compete in officially organized competitive programming rounds and test your algorithmic mastery.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/contests/create')}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Trophy size={14} /> Host New Contest
          </button>
        )}
      </div>

      {/* USER STATS BANNER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem'
      }}>
        <div className="dashboard-card" style={{ padding: '0.85rem 1rem', textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contests Participated</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
            {stats.participatedCount || 0}
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '0.85rem 1rem', textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contest Victories 🏆</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#eab308', marginTop: '2px' }}>
            {stats.winsCount || 0}
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '0.85rem 1rem', textAlign: 'center', margin: 0, borderLeft: '3px solid #d97706' }}>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>Current Streak 🔥</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
            {stats.currentStreak || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>contests</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '0.85rem 1rem', textAlign: 'center', margin: 0, borderLeft: '3px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>Longest Streak ⭐</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
            {stats.longestStreak || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>contests</span>
          </div>
        </div>
      </div>

      {/* CONTEST REMINDER & COUNTDOWN BANNER */}
      <ContestReminderBanner />

      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '7px',
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="dashboard-card" style={{ padding: '0.85rem 1.1rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Contests' },
            { id: 'LIVE', label: '🔴 Live Now' },
            { id: 'REGISTRATION OPEN', label: 'Registration Open' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Past Contests' },
            { id: 'MY', label: 'My Registered' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                background: filterTab === tab.id ? 'var(--primary)' : 'var(--tag-bg)',
                color: filterTab === tab.id ? '#ffffff' : 'var(--text)',
                fontWeight: filterTab === tab.id ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by title or organization..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.4rem 0.75rem 0.4rem 1.8rem', fontSize: '0.825rem', borderRadius: '6px', minWidth: '220px' }}
          />
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

      </div>

      {/* CONTESTS GRID */}
      {loading && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading contests from database...</p>
        </div>
      )}

      {!loading && filteredContests.length === 0 && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <Trophy size={40} color="var(--primary)" style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
          <h4 style={{ margin: 0, color: 'var(--text)' }}>No Contests Found</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.85rem' }}>
            No contests match the current filter or search criteria.
          </p>
        </div>
      )}

      {!loading && filteredContests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
          {filteredContests.map(c => {
            const isLive = c.status === 'LIVE' || c.status === 'ONGOING';
            const isRegOpen = c.status === 'REGISTRATION OPEN';
            const isUpcoming = c.status === 'UPCOMING' || c.status === 'PUBLISHED';
            const isFinished = c.status === 'COMPLETED';
            const isRegClosed = c.status === 'REGISTRATION CLOSED';
            const isInvited = c.accessMode === 'INVITED';

            const getStatusBadge = () => {
              if (isLive) {
                return (
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ffffff', background: '#ef4444', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white', display: 'inline-block' }} /> LIVE
                  </span>
                );
              }
              if (isInvited && c.registered) {
                return (
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00AFB9', background: 'rgba(0, 175, 185, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    INVITED
                  </span>
                );
              }
              if (isRegOpen) {
                return (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', background: 'rgba(22, 163, 74, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    REGISTRATION OPEN
                  </span>
                );
              }
              if (isUpcoming) {
                return (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', background: 'rgba(2, 132, 199, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                    UPCOMING
                  </span>
                );
              }
              if (isRegClosed) {
                return (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', background: 'rgba(217, 119, 6, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    REGISTRATION CLOSED
                  </span>
                );
              }
              return (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--tag-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                  COMPLETED
                </span>
              );
            };

            return (
              <div
                key={c.id}
                className="dashboard-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isLive ? '1.5px solid #ef4444' : (c.registered ? '1.5px solid var(--primary)' : '1px solid var(--card-border)'),
                  margin: 0
                }}
              >
                <div>
                  {/* ORGANIZATION & STATUS BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={13} color="var(--primary)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {c.organizationName || 'KODIFY'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isInvited ? 'rgba(0, 175, 185, 0.15)' : 'rgba(0, 129, 167, 0.15)',
                        color: isInvited ? 'var(--secondary)' : 'var(--primary)',
                        border: `1px solid ${isInvited ? 'rgba(0, 175, 185, 0.3)' : 'rgba(0, 129, 167, 0.3)'}`
                      }}>
                        {isInvited ? 'INVITED' : (c.contestType === 'OPEN' ? 'FLEXIBLE START' : 'SYNCHRONIZED')}
                      </span>
                      {getStatusBadge()}
                    </div>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3
                    onClick={() => navigate(`/contests/${c.id}`)}
                    style={{ margin: '0 0 0.35rem 0', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    {c.title}
                  </h3>
                  
                  <p style={{ margin: '0 0 0.85rem 0', color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: '1.45', minHeight: '34px' }}>
                    {c.description ? (c.description.length > 95 ? c.description.slice(0, 95) + '...' : c.description) : 'Official algorithmic programming round on KODIFY.'}
                  </p>

                  {/* TIMING INFO */}
                  <div style={{ background: 'var(--input-bg)', padding: '0.65rem 0.85rem', borderRadius: '7px', marginBottom: '0.9rem', fontSize: '0.775rem', display: 'grid', gap: '3px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                      <Calendar size={13} color="var(--primary)" />
                      <span><strong>Start:</strong> {formatDateTime(c.startTime)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                      <Calendar size={13} color="var(--secondary)" />
                      <span><strong>End:</strong> {formatDateTime(c.endTime)}</span>
                    </div>
                  </div>

                  {/* STATS ROW */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={13} /> {c.participantCount || 0} Registered
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {c.durationMinutes ? `${c.durationMinutes} mins` : '120 mins'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={13} /> {c.questionCount || 0} Problems
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {c.registered ? (
                    <button
                      onClick={() => navigate(`/contests/${c.id}/arena`)}
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0.5rem', fontWeight: 800 }}
                    >
                      <Play size={14} fill="currentColor" /> {isInvited ? 'Participate' : 'Enter Arena'}
                    </button>
                  ) : (
                    <>
                      {isFinished ? (
                        <button
                          onClick={() => navigate(`/contests/${c.id}`)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.5rem', fontWeight: 700 }}
                        >
                          View Results
                        </button>
                      ) : isInvited ? (
                        <button
                          onClick={() => navigate(`/contests/${c.id}`)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.5rem', fontWeight: 700, opacity: 0.8 }}
                        >
                          Invited Only
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/contests/${c.id}`)}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontWeight: 800,
                            background: c.canRegister ? 'var(--primary)' : 'var(--tag-bg)',
                            color: c.canRegister ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {c.canRegister ? 'Register' : (c.registrationClosed ? 'Registration Closed' : 'View Details')}
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => navigate(`/contests/${c.id}/leaderboard`)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    title="View Standings"
                  >
                    <Trophy size={14} /> Standings
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default Contests;
