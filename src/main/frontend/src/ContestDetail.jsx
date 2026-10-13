import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Calendar,
  Award,
  ArrowLeft,
  Lock,
  Building2,
  Users,
  ShieldCheck,
  Check,
  FileCode,
  Sparkles
} from 'lucide-react';

function ContestDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Registration modal states
  const [showRegModal, setShowRegModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState(null);

  // Results State
  const [contestResult, setContestResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  useEffect(() => {
    fetchContestDetail();
  }, [id]);

  const fetchContestDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/contests/${id}`);
      const data = res.data;
      setContest(data);

      if (data.hasEnded) {
        fetchContestResult();
      }
    } catch (err) {
      console.error("Error fetching contest detail:", err);
      setError(err.response?.data?.message || err.response?.data || "Unable to load contest details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchContestResult = async () => {
    try {
      setLoadingResult(true);
      const res = await axios.get(`/api/contests/${id}/result`);
      setContestResult(res.data);
    } catch (err) {
      console.error("Error loading contest results:", err);
    } finally {
      setLoadingResult(false);
    }
  };

  const handleConfirmRegistration = async () => {
    try {
      setRegistering(true);
      setRegError(null);
      await axios.post(`/api/contests/${id}/register`);
      setRegSuccess(true);
      // Refresh contest details to update registration status
      await fetchContestDetail();
    } catch (err) {
      console.error("Registration error:", err);
      setRegError(err.response?.data?.message || err.response?.data || "Failed to complete registration.");
    } finally {
      setRegistering(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
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

  if (loading) {
    return (
      <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading contest information...</p>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="dashboard-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', color: '#dc2626', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 800 }}>Contest Not Found</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{error || 'Contest details could not be retrieved.'}</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/contests" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Return to Contests
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: CONTEST FINISHED / RESULTS SUMMARY
  // =========================================================================
  if (contest.hasEnded && contestResult) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Link to="/contests" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Contests
          </Link>
          <Link to={`/contests/${id}/leaderboard`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={14} /> Full Contest Leaderboard
          </Link>
        </div>

        {/* RESULTS HERO CARD */}
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center', border: '1.5px solid var(--border)', background: 'radial-gradient(ellipse at top, rgba(0, 175, 185, 0.1) 0%, var(--card-bg) 80%)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            <CheckCircle2 size={14} /> CONTEST COMPLETED
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            {contestResult.contestTitle}
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            The contest round has concluded. Below is your official standing and problem review.
          </p>

          {/* STATS METRIC ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto 2rem auto' }}>
            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Rank</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                #{contestResult.rank || '--'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score Earned</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
                {contestResult.score || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {contestResult.totalPossibleScore || 0}</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Solved</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                {contestResult.solvedCount || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {contestResult.totalQuestions || 0}</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Penalty Time</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)', marginTop: '4px' }}>
                {contestResult.formattedTime || '00:00'}
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION-BY-QUESTION RESULTS */}
        <div className="dashboard-card" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
            Problem-wise Submission Review
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {(contestResult.problemResults || []).map((pr, idx) => (
              <div key={pr.problemId || idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '6px' }}>Q{pr.questionOrder || idx + 1}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{pr.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({pr.difficulty})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                      background: pr.status === 'ACCEPTED' ? 'rgba(34, 197, 94, 0.15)' : (pr.status === 'WRONG_ANSWER' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-hover)'),
                      color: pr.status === 'ACCEPTED' ? '#16a34a' : (pr.status === 'WRONG_ANSWER' ? '#ef4444' : 'var(--text-muted)')
                    }}>
                      {pr.status === 'ACCEPTED' ? '✓ Accepted' : (pr.status === 'WRONG_ANSWER' ? '✗ Wrong Answer' : 'Not Attempted')}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                      {pr.earnedPoints || 0} / {pr.maxPoints || 100} pts
                    </span>
                  </div>
                </div>

                {pr.submittedCode && (
                  <div style={{ marginTop: '0.75rem', background: '#0f172a', borderRadius: '6px', padding: '0.75rem', color: '#f8fafc', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>Language: {pr.language || 'Code'} • Runtime: {pr.runtime ? `${pr.runtime}s` : 'N/A'} • Test Cases: {pr.passedTestCases || 0}/{pr.totalTestCases || 0}</div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pr.submittedCode}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN CONTEST DETAILS (UPCOMING / LIVE / REGISTERED)
  // =========================================================================
  const isRegistered = contest.registered;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '1.25rem' }}>
      
      {/* HEADER NAV */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/contests" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Back to Contests
        </Link>
        <Link to={`/contests/${id}/leaderboard`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={14} /> Standings
        </Link>
      </div>

      {/* HERO CARD */}
      <div
        className="dashboard-card"
        style={{
          padding: '2rem',
          margin: 0,
          border: isRegistered ? '1.5px solid var(--primary)' : '1px solid var(--border)',
          background: 'radial-gradient(ellipse at top, rgba(0, 129, 167, 0.08) 0%, var(--card-bg) 75%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Building2 size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {contest.organizationName || 'KODIFY'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: contest.contestType === 'OPEN' ? 'rgba(0, 175, 185, 0.15)' : 'rgba(0, 129, 167, 0.15)',
                  color: contest.contestType === 'OPEN' ? 'var(--secondary)' : 'var(--primary)'
                }}
              >
                {contest.contestType === 'OPEN' ? 'FLEXIBLE START' : 'SYNCHRONIZED'}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
              {contest.title}
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6, maxWidth: '750px' }}>
              {contest.description || 'Official competitive algorithmic programming round hosted on KODIFY.'}
            </p>
          </div>

          {/* STATUS BADGE */}
          <div>
            {isRegistered ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: contest.accessMode === 'INVITED' ? 'rgba(0, 175, 185, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: contest.accessMode === 'INVITED' ? 'var(--secondary)' : '#16a34a', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                <CheckCircle2 size={16} /> {contest.accessMode === 'INVITED' ? 'INVITED PARTICIPANT' : 'REGISTERED'}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                {contest.accessMode === 'INVITED' ? 'PRIVATE CONTEST (INVITED ONLY)' : 'NOT REGISTERED'}
              </div>
            )}
          </div>
        </div>

        {/* SPECS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Date & Time</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
              {formatDateTime(contest.startTime)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>End Date & Time</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
              {formatDateTime(contest.endTime)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Round Duration</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              {contest.durationMinutes ? `${contest.durationMinutes} Minutes` : '120 Minutes'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Problems</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {contest.questionCount || contest.questions?.length || 0} Questions
            </div>
          </div>
        </div>

        {/* ACTION CTA ROW */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          {isRegistered ? (
            <button
              onClick={() => navigate(`/contests/${id}/arena`)}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Play size={16} fill="currentColor" /> {contest.accessMode === 'INVITED' ? 'PARTICIPATE / ENTER ARENA →' : 'ENTER ARENA →'}
            </button>
          ) : (
            <>
              {contest.accessMode === 'INVITED' ? (
                <div style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--tag-bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                  🔒 This is an invited-only contest. Only invited candidates can participate.
                </div>
              ) : (
                <button
                  onClick={() => { setShowRegModal(true); setRegSuccess(false); setRegError(null); }}
                  disabled={!contest.canRegister}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    background: contest.canRegister ? 'var(--primary)' : 'var(--tag-bg)',
                    color: contest.canRegister ? '#ffffff' : 'var(--text-muted)',
                    cursor: contest.canRegister ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Trophy size={16} /> REGISTER FOR CONTEST
                </button>
              )}
            </>
          )}

          {!isRegistered && contest.accessMode !== 'INVITED' && !contest.canRegister && (
            <span style={{ fontSize: '0.825rem', color: '#dc2626', fontWeight: 600 }}>
              {contest.registrationClosed ? 'Registration has closed for this contest.' : 'Registration is not open yet.'}
            </span>
          )}
        </div>
      </div>

      {/* RULES & FORMAT SECTION */}
      <div className="dashboard-card" style={{ padding: '1.75rem', margin: 0 }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary)" /> Contest Rules & Regulations
        </h3>

        <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>1.</span>
            <span><strong>Server-Authoritative Clock:</strong> Arena access and timers sync directly to the KODIFY server. Solutions submitted after expiration will be rejected.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>2.</span>
            <span><strong>Dedicated Execution Environment:</strong> Code executes inside isolated Docker sandbox containers supporting Python 3, Java 17, and C (GCC).</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>3.</span>
            <span><strong>Sample Runs vs Submissions:</strong> 'RUN' evaluates only public sample cases without penalty. 'SUBMIT' evaluates all test cases to award contest points.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>4.</span>
            <span><strong>Leaderboard Scoring:</strong> Ranked by Total Points Solved &gt; Lowest Elapsed Penalty Time.</span>
          </div>
        </div>
      </div>

      {/* REGISTRATION CONFIRMATION MODAL */}
      {showRegModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !registering) setShowRegModal(false); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--primary)',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>

                <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--text)' }}>
                  ✓ Registration Successful!
                </h2>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                  You are officially registered for <strong>{contest.title}</strong>. A notification and calendar reminder have been placed on your dashboard.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setShowRegModal(false); navigate(`/contests/${id}/arena`); }}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Play size={14} fill="currentColor" /> ENTER ARENA
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 1.25rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={18} color="var(--primary)" /> Confirm Contest Registration
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    ✕
                  </button>
                </div>

                {regError && (
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} /> {regError}
                  </div>
                )}

                {/* USER PROFILE INFO AUTO-PREFILLED */}
                <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', marginBottom: '1rem', display: 'grid', gap: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
                  <div><strong>Participant:</strong> {user?.name || user?.username}</div>
                  <div><strong>Username:</strong> @{user?.username}</div>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Contest:</strong> {contest.title}</div>
                  <div><strong>Start Time:</strong> {formatDateTime(contest.startTime)}</div>
                  <div><strong>Duration:</strong> {contest.durationMinutes} Minutes</div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  By confirming registration, your participant entry will be stored in the official KODIFY database and reminders will be scheduled 10 minutes prior to the start time.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    disabled={registering}
                    className="btn btn-secondary"
                    style={{ padding: '0.6rem 1.25rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRegistration}
                    disabled={registering}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {registering ? 'Registering...' : 'CONFIRM REGISTRATION ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default ContestDetail;
