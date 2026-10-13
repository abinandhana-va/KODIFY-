import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  BookOpen,
  Award,
  Flame,
  Zap,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Trophy,
  Bell,
  Calendar,
  ShieldCheck,
  ClipboardList,
  PlusCircle,
  Play,
  TrendingUp,
  Target,
  FileCode,
  Check
} from 'lucide-react';
import { KolamMotif } from './components/AmbientArt';
import ContestReminderBanner from './components/ContestReminderBanner';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedTotal: 0,
    solvedEasy: 0,
    solvedMedium: 0,
    solvedHard: 0
  });

  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [certificatesList, setCertificatesList] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [contestStats, setContestStats] = useState({ participatedCount: 0, conductedCount: 0, winsCount: 0, currentStreak: 0, longestStreak: 0 });
  const [assignedList, setAssignedList] = useState([]);
  const [createdList, setCreatedList] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [lastProblem, setLastProblem] = useState(null);
  const [creatorStatus, setCreatorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, subsRes, certRes, badgesRes, contestStatsRes, assignedRes, createdRes, creatorRes, probsRes] = await Promise.allSettled([
          axios.get('/api/users/stats'),
          axios.get('/api/submissions/my'),
          axios.get('/api/certificates'),
          axios.get('/api/badges/me'),
          axios.get('/api/contests/my-stats'),
          axios.get('/api/assignments/my-assigned'),
          axios.get('/api/assignments/my-created'),
          axios.get('/api/creator-verification/status'),
          axios.get('/api/problems')
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (subsRes.status === 'fulfilled') {
          const subs = subsRes.value.data || [];
          setRecentSubmissions(subs.slice(0, 6));
          if (subs.length > 0) {
            setLastProblem(subs[0]);
          }
        }
        if (certRes.status === 'fulfilled') setCertificatesList(certRes.value.data || []);
        if (badgesRes.status === 'fulfilled') setEarnedBadges(badgesRes.value.data || []);
        if (contestStatsRes.status === 'fulfilled') setContestStats(contestStatsRes.value.data || {});
        if (assignedRes.status === 'fulfilled') setAssignedList(assignedRes.value.data || []);
        if (createdRes.status === 'fulfilled') setCreatedList(createdRes.value.data || []);
        if (creatorRes.status === 'fulfilled') setCreatorStatus(creatorRes.value.data);
        if (probsRes.status === 'fulfilled') {
          const probs = probsRes.value.data || [];
          setRecommendedProblems(probs.slice(0, 3));
          if (!lastProblem && probs.length > 0) {
            setLastProblem({
              problemId: probs[0].id,
              problemTitle: probs[0].title,
              problemDifficulty: probs[0].difficulty,
              concept: probs[0].concept || 'Algorithms'
            });
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load user dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const easy = Number(stats.solvedEasy || 0);
  const medium = Number(stats.solvedMedium || 0);
  const hard = Number(stats.solvedHard || 0);
  const totalSolved = Number(stats.solvedTotal || (easy + medium + hard));
  const totalProblems = Number(stats.totalProblems || 100);

  // Donut SVG Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const easyRatio = totalSolved > 0 ? easy / totalSolved : 0;
  const mediumRatio = totalSolved > 0 ? medium / totalSolved : 0;
  const hardRatio = totalSolved > 0 ? hard / totalSolved : 0;

  const easyStroke = easyRatio * circumference;
  const mediumStroke = mediumRatio * circumference;
  const hardStroke = hardRatio * circumference;

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : (currentHour < 17 ? 'Good afternoon' : 'Good evening');
  const streakDays = contestStats.currentStreak || 7;

  const formatDate = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getDifficultyBadge = (diff) => {
    const norm = (diff || '').toUpperCase();
    if (norm === 'EASY') {
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}>Easy</span>;
    }
    if (norm === 'MEDIUM') {
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>Medium</span>;
    }
    return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Hard</span>;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
      {/* =========================================================
          TOP: GREETING & STREAK BANNER
      ========================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 129, 167, 0.08) 0%, rgba(0, 175, 185, 0.12) 100%)',
        border: '1px solid rgba(0, 129, 167, 0.2)',
        borderRadius: '10px',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
              DEVELOPER PLATFORM
            </span>
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {timeGreeting}, {user?.name || user?.username}!
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#f97316" /> Keep coding. You're on a <strong style={{ color: '#f97316' }}>{streakDays}-day streak</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to="/problems"
            className="btn btn-primary"
            style={{ fontWeight: 700, padding: '0.55rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={14} /> Continue Problem &rarr;
          </Link>
        </div>
      </div>

      {/* CONTEST REMINDER BANNER */}
      <ContestReminderBanner />

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading your developer workspace...</p>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* =========================================================
              LEFT COLUMN: PRIMARY SECTIONS & ASSIGNMENTS
          ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* PRIMARY SECTION: CONTINUE CODING HERO CARD */}
            <div className="dashboard-card" style={{
              margin: 0,
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0, 129, 167, 0.04) 100%)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} /> Continue Coding
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  In Progress
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
                      {lastProblem?.problemTitle || 'Two Sum & Hash Maps'}
                    </h3>
                    {getDifficultyBadge(lastProblem?.problemDifficulty || 'Easy')}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Topic: <strong>{lastProblem?.concept || 'Array & Hash Table'}</strong> • Standard algorithmic challenge
                  </p>
                </div>

                <Link
                  to={lastProblem?.problemId ? `/problems/${lastProblem.problemId}` : '/problems'}
                  className="btn btn-primary"
                  style={{ fontWeight: 700, padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Play size={14} /> Continue &rarr;
                </Link>
              </div>
            </div>

            {/* SECONDARY SECTION: YOUR PROGRESS COMPACT METRICS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>
              <div className="dashboard-card" style={{ margin: 0, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Problems Solved</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{totalSolved}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of {totalProblems} available</div>
              </div>

              <div className="dashboard-card" style={{ margin: 0, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Streak</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Flame size={18} /> {streakDays}d
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Best: {contestStats.longestStreak || streakDays}d</div>
              </div>

              <div className="dashboard-card" style={{ margin: 0, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>88.4%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>First-try submissions</div>
              </div>

              <div className="dashboard-card" style={{ margin: 0, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contest Rating</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>1420</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rank: Knight</div>
              </div>
            </div>

            {/* UPCOMING & ENROLLED ASSIGNMENTS (HORIZONTAL CARDS) */}
            <div className="dashboard-card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} color="var(--primary)" /> Upcoming Assessments & Exams
                </div>
                <Link to="/assignments" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  View All ({assignedList.length}) &rarr;
                </Link>
              </div>

              {assignedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No pending assignments enrolled. When an instructor invites you, it will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {assignedList.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)' }}>
                            {a.title}
                          </span>
                          {a.secureMode && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                              Proctored
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Host: {a.creatorName || 'Instructor'} • Duration: {a.durationMinutes || 60}m • {a.problemCount || 1} Problems • Due: {formatDate(a.dueDate)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/assignments/${a.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          View Details
                        </Link>
                        {a.secureMode && (
                          <Link
                            to={`/assignments/enter/${a.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Enter Exam &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT SUBMISSIONS & ACTIVITY */}
            <div className="dashboard-card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--primary)" /> Recent Code Submissions
                </div>
                <Link to="/submissions" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  View History &rarr;
                </Link>
              </div>

              {recentSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No recent code submissions. Start solving challenges in the Problems section!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Runtime</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                            <Link to={`/problems/${s.problemId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {s.problemTitle || `Problem #${s.problemId}`}
                            </Link>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {s.language || 'Python'}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: s.status === 'ACCEPTED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: s.status === 'ACCEPTED' ? '#16a34a' : '#ef4444'
                            }}>
                              {s.status === 'ACCEPTED' ? '✓ Accepted' : (s.status || 'Wrong Answer')}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            {s.runtime ? `${Math.round(s.runtime * 1000)}ms` : '--'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {formatDate(s.submittedAt || s.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RECOMMENDED PROBLEMS SECTION */}
            <div className="dashboard-card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary)" /> Recommended For You
                </div>
                <Link to="/problems" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Browse All &rarr;
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {recommendedProblems.map((rp) => (
                  <div
                    key={rp.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        {getDifficultyBadge(rp.difficulty)}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rp.concept || 'Algorithms'}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {rp.title}
                      </div>
                    </div>
                    <Link
                      to={`/problems/${rp.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '100%', justifyContent: 'center' }}
                    >
                      Solve Challenge &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =========================================================
              RIGHT COLUMN: VISUALIZATIONS & ACHIEVEMENTS
          ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* PROGRESS VISUALIZATION: DIFFICULTY DONUT CHART */}
            <div className="dashboard-card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--primary)" /> Problem Solving Progress
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '1rem' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {/* Background Track */}
                  <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
                  
                  {/* Easy Slice */}
                  <circle
                    cx="70" cy="70" r={radius} fill="none" stroke="#16a34a" strokeWidth="12"
                    strokeDasharray={`${easyStroke} ${circumference}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 70 70)"
                  />
                  {/* Medium Slice */}
                  <circle
                    cx="70" cy="70" r={radius} fill="none" stroke="#d97706" strokeWidth="12"
                    strokeDasharray={`${mediumStroke} ${circumference}`}
                    strokeDashoffset={-easyStroke}
                    transform="rotate(-90 70 70)"
                  />
                  {/* Hard Slice */}
                  <circle
                    cx="70" cy="70" r={radius} fill="none" stroke="#ef4444" strokeWidth="12"
                    strokeDasharray={`${hardStroke} ${circumference}`}
                    strokeDashoffset={-(easyStroke + mediumStroke)}
                    transform="rotate(-90 70 70)"
                  />
                </svg>

                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)' }}>{totalSolved}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solved</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                    Easy
                  </span>
                  <strong>{easy} solved</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                    Medium
                  </span>
                  <strong>{medium} solved</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    Hard
                  </span>
                  <strong>{hard} solved</strong>
                </div>
              </div>
            </div>

            {/* ACHIEVEMENTS & BADGES SHELF */}
            <div className="dashboard-card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="var(--primary)" /> Achievements & Badges
                </div>
                <Link to="/badges" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                  All ({earnedBadges.length}) &rarr;
                </Link>
              </div>

              {earnedBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Solve problems and maintain streaks to unlock badges!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  {earnedBadges.slice(0, 6).map((b, idx) => (
                    <div
                      key={b.id || idx}
                      style={{
                        padding: '0.65rem 0.35rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)'
                      }}
                    >
                      <div style={{ fontSize: '1.3rem', marginBottom: '2px' }}>
                        {b.icon || '🏅'}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.title || b.name || 'Badge'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONTESTS ARENA SHORTCUT CARD */}
            <div className="dashboard-card" style={{
              margin: 0,
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 129, 167, 0.08) 0%, rgba(240, 113, 103, 0.08) 100%)',
              border: '1px solid rgba(0, 129, 167, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={18} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                    Official Contests
                  </h4>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>
                  {contestStats.participatedCount || 0} Joined
                </span>
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Compete in synchronized algorithmic rounds, climb the global rankings, and win badges.
              </p>
              <Link
                to="/contests"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}
              >
                Join Contests &rarr;
              </Link>
            </div>

            {/* CREATOR / EDUCATOR SHORTCUT CARD */}
            <div className="dashboard-card" style={{
              margin: 0,
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 175, 185, 0.08) 0%, rgba(254, 217, 183, 0.1) 100%)',
              border: '1px solid rgba(0, 175, 185, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--secondary)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                  Host Assessments
                </h4>
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Conduct secure, timed assessments with full-screen proctoring and comprehensive candidate reports.
              </p>
              <Link
                to="/assignments/create"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}
              >
                Launch Assessment &rarr;
              </Link>
            </div>

            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <KolamMotif size={36} opacity={0.25} color="var(--primary)" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
