import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { WaveDivider, KolamMotif } from './components/AmbientArt';
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Flame,
  Award,
  Sparkles,
  Download,
  Calendar,
  Activity as ActivityIcon,
  Shield,
  Code2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, updateProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    contact: user?.contact || ''
  });

  const [pwdData, setPwdData] = useState({ newPassword: '', repeatPassword: '' });

  const [profileMsg, setProfileMsg] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);

  // Problem stats, Heatmap, Contest stats, Badges, Certs, Host Status
  const [problemStats, setProblemStats] = useState({ solvedTotal: 0, solvedEasy: 0, solvedMedium: 0, solvedHard: 0, totalProblems: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [contestStats, setContestStats] = useState({ participatedCount: 0, conductedCount: 0, winsCount: 0, currentStreak: 0, longestStreak: 0 });
  const [myBadges, setMyBadges] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [hostStatus, setHostStatus] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        contact: user.contact || ''
      });
      fetchExtras();
    }
  }, [user]);

  const fetchExtras = async () => {
    try {
      setLoadingExtras(true);
      setFetchError(false);
      const [statsRes, heatmapRes, badgesRes, certsRes, hostRes] = await Promise.all([
        axios.get('/api/users/stats').catch(() => ({ data: null })),
        axios.get('/api/users/heatmap').catch(() => ({ data: [] })),
        axios.get('/api/badges/me').catch(() => ({ data: [] })),
        axios.get('/api/certificates').catch(() => ({ data: [] })),
        axios.get('/api/creator-verification/status').catch(() => ({ data: null }))
      ]);

      if (statsRes?.data) {
        setProblemStats({
          solvedTotal: statsRes.data.solvedTotal || 0,
          solvedEasy: statsRes.data.solvedEasy || 0,
          solvedMedium: statsRes.data.solvedMedium || 0,
          solvedHard: statsRes.data.solvedHard || 0,
          totalProblems: statsRes.data.totalProblems || 0
        });
        setContestStats({
          participatedCount: statsRes.data.contestParticipated || 0,
          conductedCount: statsRes.data.contestConducted || 0,
          winsCount: statsRes.data.contestWins || 0,
          currentStreak: statsRes.data.currentStreak || 0,
          longestStreak: statsRes.data.longestStreak || 0
        });
      }

      setHeatmapData(heatmapRes?.data || []);
      setMyBadges(badgesRes?.data || []);
      setMyCertificates((certsRes?.data || []).filter(c => c && c.unlocked));
      if (hostRes && hostRes.data) setHostStatus(hostRes.data);
    } catch (err) {
      console.error("Error fetching profile stats:", err);
      setFetchError(true);
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      setSubmittingProfile(true);
      await updateProfile(formData);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error updating profile details.'
      });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (pwdData.newPassword !== pwdData.repeatPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      setSubmittingPwd(true);
      await axios.put('/api/users/password', { newPassword: pwdData.newPassword });
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setPwdData({ newPassword: '', repeatPassword: '' });
    } catch (err) {
      console.error("Password update error:", err);
      setPwdMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error updating password.'
      });
    } finally {
      setSubmittingPwd(false);
    }
  };

  const handleDownloadCert = async (cert) => {
    try {
      const response = await axios.get(`/api/certificates/${cert.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const safeName = (user?.name || user?.username || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `KODIFY_${cert.name}_${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download certificate.");
    }
  };

  // Generate 52 weeks (364 days) calendar grid for Heatmap
  const buildHeatmapGrid = () => {
    const dataMap = {};
    let totalSubmissions = 0;
    heatmapData.forEach(item => {
      dataMap[item.date] = item.count;
      totalSubmissions += item.count;
    });

    const days = [];
    const today = new Date();
    // Go back 364 days to yesterday + today
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dataMap[dateStr] || 0;
      days.push({
        date: dateStr,
        count,
        dayOfWeek: d.getDay() // 0 = Sun, 6 = Sat
      });
    }

    return { days, totalSubmissions };
  };

  const { days: heatmapDays, totalSubmissions } = buildHeatmapGrid();

  const getHeatmapColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#9be9a8';
    if (count <= 3) return '#40c463';
    if (count <= 6) return '#30a14e';
    return '#216e39';
  };

  const renderBadgeSticker = (shape, imageUrl, size = 64) => {
    let clipStyle = {};
    if (shape === 'CIRCLE') clipStyle = { borderRadius: '50%' };
    else if (shape === 'HEXAGON') clipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
    else if (shape === 'DIAMOND') clipStyle = { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
          padding: '3px',
          ...clipStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', height: '100%', ...clipStyle, overflow: 'hidden', background: 'var(--primary)' }}>
            {imageUrl ? (
              <img src={imageUrl} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Award size={size / 2.5} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--text)' }}>User Profile & Portfolio</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Activity contribution calendar, problem metrics, contest achievements, earned certificates, and account settings.
          </p>
        </div>

        {fetchError && (
          <button
            onClick={fetchExtras}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Retry Loading Data
          </button>
        )}
      </div>

      {/* USER SUMMARY CARD */}
      <div className="dashboard-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
            {user?.name || 'Developer'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            @{user?.username || 'user'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Role & Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{
              background: user?.role === 'ADMIN' ? 'rgba(0, 129, 167, 0.15)' : 'var(--tag-bg)',
              color: user?.role === 'ADMIN' ? 'var(--primary)' : 'var(--text)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {user?.role || 'USER'}
            </span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#059669',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {user?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Email & Phone</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
            {user?.email || 'Not provided'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {user?.contact || 'Not provided'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bio</div>
          <div style={{ fontSize: '0.85rem', color: user?.bio ? 'var(--text)' : 'var(--text-dim)', fontStyle: user?.bio ? 'normal' : 'italic', marginTop: '2px', lineHeight: 1.4 }}>
            {user?.bio || 'No bio added'}
          </div>
        </div>
      </div>

      {/* PROBLEM SOLVING METRICS BANNER */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={20} color="var(--primary)" /> Real Problem Solving Statistics
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: '3px solid var(--primary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Solved</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
              {problemStats.solvedTotal}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Accepted Unique
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: '3px solid #10B981' }}>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Easy Problems</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
              {problemStats.solvedEasy}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fundamental Logic
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: '3px solid #F59E0B' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Medium Problems</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
              {problemStats.solvedMedium}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Algorithmic Depth
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: '3px solid #EF4444' }}>
            <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Hard Problems</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
              {problemStats.solvedHard}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Complex Optimizations
            </div>
          </div>
        </div>
      </div>

      {/* CONTEST PERFORMANCE & STREAKS BANNER */}
      {user?.role !== 'ADMIN' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--primary)" /> Contest Performance & Streaks
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contests Participated</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
                {contestStats.participatedCount || 0}
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contests Conducted</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)', marginTop: '4px' }}>
                {contestStats.conductedCount || 0}
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contest Victories 🏆</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                {contestStats.winsCount || 0}
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: '1.25rem', textAlign: 'center', background: '#fffbeb', border: '1.5px solid #fde047' }}>
              <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Flame size={16} color="#d97706" /> Contest Streak 🔥
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
                {contestStats.currentStreak || 0} <span style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 600 }}>active</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '2px', fontWeight: 600 }}>
                Longest Streak: {contestStats.longestStreak || 0} contests
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB-STYLE ACTIVITY CONTRIBUTION HEATMAP */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
            <ActivityIcon size={20} />
            <span>Activity Contribution Heatmap</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {totalSubmissions} submissions in the last year
          </div>
        </div>

        {/* HEATMAP GRID */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div style={{
            display: 'inline-grid',
            gridTemplateRows: 'repeat(7, 13px)',
            gridAutoFlow: 'column',
            gridAutoColumns: '13px',
            gap: '3px'
          }}>
            {heatmapDays.map((d, idx) => (
              <div
                key={idx}
                title={`${d.count} submission${d.count === 1 ? '' : 's'} on ${d.date}`}
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '2px',
                  background: getHeatmapColor(d.count),
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* LEGEND */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Less</span>
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: '#ebedf0' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: '#9be9a8' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: '#40c463' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: '#30a14e' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: '#216e39' }} />
          <span>More</span>
        </div>
      </div>

      {/* EARNED CERTIFICATES SECTION */}
      {myCertificates.length > 0 && (
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
              <Award size={20} />
              <span>Verified Certificates ({myCertificates.length})</span>
            </div>
            <Link to="/certificates" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
              View All Certificates &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {myCertificates.map(cert => {
              const isContestCert = cert.category === 'CONTEST' || cert.rank === 1 || (cert.name && cert.name.includes('Contest'));
              return (
                <div
                  key={cert.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    border: isContestCert ? '1.5px solid #eab308' : '1.5px solid #86efac',
                    background: isContestCert ? '#fffdf0' : '#f0fdf4',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} color={isContestCert ? '#d97706' : '#16a34a'} />
                        <span style={{ fontWeight: 800, color: isContestCert ? '#92400e' : '#166534', fontSize: '1rem' }}>{cert.name}</span>
                      </div>
                      {isContestCert && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 7px', borderRadius: '4px' }}>
                          🏆 1ST RANK
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {cert.description || 'Verified Kodify Achievement Certificate.'}
                    </p>
                    {cert.contestTitle && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.85rem' }}>
                        Contest: {cert.contestTitle} {cert.contestDate ? `(${cert.contestDate.split('T')[0]})` : ''}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownloadCert(cert)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      background: isContestCert ? '#d97706' : '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EARNED BADGES SECTION */}
      {myBadges.length > 0 && (
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
              <Sparkles size={20} />
              <span>Earned Sticker Badges ({myBadges.length})</span>
            </div>
            <Link to="/badges" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
              View All Badges &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {myBadges.map(ub => (
              <div key={ub.id} style={{ textAlign: 'center', width: '90px' }}>
                {renderBadgeSticker(ub.shape || 'CIRCLE', ub.imageUrl, 64)}
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)', marginTop: '6px' }}>
                  {ub.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOST VERIFICATION STATUS BADGE CARD */}
      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 129, 167, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assignment Host Status
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {user?.role === 'ADMIN' || hostStatus?.status === 'HOST_VERIFIED' || hostStatus?.status === 'APPROVED' || hostStatus?.hostVerified || hostStatus?.approved ? (
                <span className="verification-status-pill approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> VERIFIED HOST
                </span>
              ) : (hostStatus?.status === 'OTP_PENDING' || hostStatus?.status === 'ADMIN_APPROVED') ? (
                <span className="verification-status-pill pending" style={{ background: '#fef3c7', color: '#b45309' }}>
                  OTP Pending Verification
                </span>
              ) : hostStatus?.status === 'PENDING' ? (
                <span className="verification-status-pill pending">Verification Pending</span>
              ) : hostStatus?.status === 'REJECTED' ? (
                <span className="verification-status-pill rejected">Rejected</span>
              ) : (
                <span className="verification-status-pill not_submitted">Not Submitted</span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {user?.role === 'ADMIN' || hostStatus?.status === 'HOST_VERIFIED' || hostStatus?.status === 'APPROVED' || hostStatus?.hostVerified || hostStatus?.approved
                  ? 'Authorized to create & host assessments'
                  : (hostStatus?.status === 'OTP_PENDING' || hostStatus?.status === 'ADMIN_APPROVED')
                  ? 'Admin approved! Enter your 6-digit email OTP to activate host privileges'
                  : hostStatus?.status === 'PENDING'
                  ? 'Under administrator review'
                  : 'Host verification required to create assessments'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Link
            to={user?.role === 'ADMIN' || hostStatus?.status === 'HOST_VERIFIED' || hostStatus?.status === 'APPROVED' || hostStatus?.hostVerified || hostStatus?.approved ? "/assignments/create" : "/host-verification"}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600 }}
          >
            {user?.role === 'ADMIN' || hostStatus?.status === 'HOST_VERIFIED' || hostStatus?.status === 'APPROVED' || hostStatus?.hostVerified || hostStatus?.approved
              ? 'Create Assessment'
              : (hostStatus?.status === 'OTP_PENDING' || hostStatus?.status === 'ADMIN_APPROVED')
              ? 'Enter OTP'
              : 'Verify Organization'} &rarr;
          </Link>
        </div>
      </div>

      <WaveDivider height={14} opacity={0.3} />

      {/* PROFILE DETAILS FORM */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
          <UserIcon size={20} />
          <span>Account & Profile Details</span>
        </div>

        {profileMsg && (
          <div style={{
            padding: '0.85rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            background: profileMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${profileMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: profileMsg.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            {profileMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> Email / Gmail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {user?.role !== 'ADMIN' && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> Contact Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
            )}
          </div>

          {user?.role !== 'ADMIN' && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={14} /> Personal Bio (Optional)
              </label>
              <textarea
                placeholder="Share a brief description about your programming experience, goals, or favorite tech stack..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                style={{ height: '100px' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submittingProfile}
            style={{ width: 'auto', padding: '0.75rem 2rem' }}
          >
            {submittingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* CHANGE PASSWORD FORM */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--coral)', fontSize: '1.1rem' }}>
          <Lock size={20} />
          <span>Security & Password</span>
        </div>

        {pwdMsg && (
          <div style={{
            padding: '0.85rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            background: pwdMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${pwdMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: pwdMsg.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            {pwdMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePwdSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="At least 8 characters with letters & numbers"
                value={pwdData.newPassword}
                onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={pwdData.repeatPassword}
                onChange={e => setPwdData({ ...pwdData, repeatPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submittingPwd}
            style={{ width: 'auto', padding: '0.75rem 2rem', background: 'var(--text)' }}
          >
            {submittingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
}

export default Profile;
