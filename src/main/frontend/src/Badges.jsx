import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Lock, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserBadges();
  }, []);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/badges');
      setBadges(res.data || []);
    } catch (err) {
      console.error("Error fetching badges:", err);
      setError("Unable to load achievement badges.");
    } finally {
      setLoading(false);
    }
  };

  const renderBadgeSticker = (shape, imageUrl, earned = true, size = 110) => {
    let clipStyle = {};
    if (shape === 'CIRCLE') {
      clipStyle = { borderRadius: '50%' };
    } else if (shape === 'HEXAGON') {
      clipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
    } else if (shape === 'DIAMOND') {
      clipStyle = { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: earned 
          ? 'drop-shadow(0 6px 14px rgba(0, 129, 167, 0.35))' 
          : 'grayscale(100%) opacity(45%)',
        transition: 'transform 0.3s ease, filter 0.3s ease'
      }}>
        {/* STICKER WHITE BORDER RING */}
        <div style={{
          width: '100%',
          height: '100%',
          background: earned 
            ? 'linear-gradient(135deg, #ffffff 0%, #dff7fa 100%)' 
            : '#e2e8f0',
          padding: '5px',
          ...clipStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* INNER IMAGE */}
          <div style={{
            width: '100%',
            height: '100%',
            ...clipStyle,
            overflow: 'hidden',
            background: earned ? 'var(--primary)' : '#94a3b8'
          }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Badge Sticker"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Award size={size / 2.2} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={28} color="var(--secondary)" /> My Badges & Achievements
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Earn exclusive sticker badges by solving unique coding challenges across various difficulty levels.
        </p>
      </div>

      {loading && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your achievement badges...</p>
        </div>
      )}

      {error && <div className="dashboard-card error-msg">{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* EARNED BADGES SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} color="var(--primary)" /> Earned Badges ({earnedBadges.length})
              </h3>
            </div>

            {earnedBadges.length === 0 ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', border: '1px dashed var(--border)' }}>
                <Award size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>No badges earned yet</h4>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Solve problems to unlock your first achievement sticker badge!
                </p>
                <Link to="/problems" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', display: 'inline-block' }}>
                  Start Solving Problems
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.25rem'
              }}>
                {earnedBadges.map(b => (
                  <div
                    key={b.id}
                    className="dashboard-card"
                    style={{
                      margin: 0,
                      padding: '1.75rem 1.25rem',
                      textAlign: 'center',
                      background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                      border: '1.5px solid #86efac',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* STICKER */}
                    <div style={{ marginBottom: '1rem' }}>
                      {renderBadgeSticker(b.shape, b.imageUrl, true, 110)}
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, color: 'var(--text)', fontSize: '1.1rem' }}>
                      {b.name}
                    </h4>

                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', flex: 1, lineHeight: '1.4' }}>
                      {b.description}
                    </p>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <CheckCircle2 size={13} /> Earned ({b.target} Problems Solved)
                    </div>

                    {b.earnedAt && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {new Date(b.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCKED / IN PROGRESS BADGES SECTION */}
          {lockedBadges.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} /> Locked & Upcoming Badges ({lockedBadges.length})
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.25rem'
              }}>
                {lockedBadges.map(b => {
                  const currentProg = b.currentProgress || 0;
                  const targetProg = b.target || 1;
                  const pct = Math.min(100, Math.round((currentProg / targetProg) * 100));

                  return (
                    <div
                      key={b.id}
                      className="dashboard-card"
                      style={{
                        margin: 0,
                        padding: '1.75rem 1.25rem',
                        textAlign: 'center',
                        background: '#fafafa',
                        border: '1px dashed var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: 0.85
                      }}
                    >
                      {/* LOCKED STICKER PREVIEW */}
                      <div style={{ marginBottom: '1rem', position: 'relative' }}>
                        {renderBadgeSticker(b.shape, b.imageUrl, false, 95)}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(30, 41, 59, 0.75)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <Lock size={16} />
                        </div>
                      </div>

                      <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, color: '#475569', fontSize: '1.05rem' }}>
                        {b.name}
                      </h4>

                      <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.825rem', flex: 1, lineHeight: '1.4' }}>
                        {b.description}
                      </p>

                      {/* PROGRESS BAR */}
                      <div style={{ width: '100%', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Progress</span>
                          <span>{currentProg} / {targetProg} Solved</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--secondary)',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default Badges;
