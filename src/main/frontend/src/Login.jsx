import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import LanguageSelector from './LanguageSelector';
import { ShieldCheck, User as UserIcon, ArrowLeft, Lock, Terminal, Sparkles, Code2, CheckCircle2, Award } from 'lucide-react';

function Login() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

  const { login, adminLogin, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    axios.get('/api/auth/config')
      .then(res => {
        if (res.data?.googleClientId) {
          setGoogleClientId(res.data.googleClientId);
        }
      })
      .catch(() => { });
  }, []);

  const getSanitizedReturnUrl = () => {
    const raw = searchParams.get('returnUrl') || location.state?.from;
    if (raw && typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('://')) {
      return raw;
    }
    return null;
  };

  const handleSuccessfulAuth = (authenticatedUser) => {
    const returnUrl = getSanitizedReturnUrl();
    if (returnUrl) {
      navigate(returnUrl, { replace: true });
    } else if (authenticatedUser?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSwitchMode = (admin) => {
    setIsAdminMode(admin);
    setError('');
    setPassword('');
    if (admin) {
      setEmail('kodifyofficial@gmail.com');
    } else {
      setEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        const user = await adminLogin(password);
        if (user?.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          setError('Access denied. Administrator privileges required.');
        }
      } else {
        const user = await login(email, password);
        handleSuccessfulAuth(user);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || (isAdminMode ? 'Invalid admin credentials' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">

      {/* =========================================================
          LEFT 60% – KODIFY BRAND / CONTENT
          Rich Tamil Cultural Coding Theme & Visual Identity
      ========================================================= */}
      <div className="auth-brand-side">
        {/* Top Bar inside Left Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '1px',
              color: '#ffffff'
            }}>
              KODIFY
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--sandal)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              background: 'rgba(254, 217, 183, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(254, 217, 183, 0.3)'
            }}>
              கோடிஃபை
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--sandal)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Sparkles size={12} color="var(--coral)" />
            <span>EDITION 2026</span>
          </div>
        </div>

        {/* Central Brand Statement & Visual Workspace */}
        <div style={{ margin: 'auto 0', zIndex: 2, padding: '1rem 0' }}>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--sandal)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem'
          }}>
            &mdash; for the crooked thinkers &mdash;
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 0.85rem 0',
            color: '#ffffff',
            letterSpacing: '-0.01em'
          }}>
            Where traditional curiosity meets modern code.
          </h1>

          <p style={{
            fontSize: '0.95rem',
            color: '#d1e6ec',
            maxWidth: '560px',
            lineHeight: 1.6,
            marginBottom: '1.75rem'
          }}>
            From ancient Kolam geometric recursion to high-throughput algorithmic pipelines — test your logic, conquer competitive milestones, and earn authentic engineering credentials.
          </p>

          {/* VISUAL CODING & KOLAM TERMINAL ARTIFACT */}
          <div style={{
            background: 'rgba(4, 23, 31, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(254, 217, 183, 0.25)',
            borderRadius: '8px',
            padding: '1.25rem',
            boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.4)',
            maxWidth: '580px',
            fontFamily: 'var(--font-mono)'
          }}>
            {/* Editor Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F07167' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FED9B7' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#96b7c4' }}>kolam_symmetry_recurse.py &bull; KODIFY Sandbox</span>
            </div>

            {/* Code Snippet with Tamil Line Geometry comments */}
            <div style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#e0f2f7' }}>
              <span style={{ color: 'var(--sandal)', fontStyle: 'italic' }}># Tamil heritage logic: Pattern → Repetition → Symmetry</span><br />
              <span style={{ color: '#F07167' }}>def</span> <span style={{ color: '#00AFB9', fontWeight: 700 }}>solve_crooked_path</span>(grid, symmetry_nodes):<br />
              &nbsp;&nbsp;optimal_flow = [<br />
              &nbsp;&nbsp;&nbsp;&nbsp;node.evaluate() <span style={{ color: '#F07167' }}>for</span> node <span style={{ color: '#F07167' }}>in</span> symmetry_nodes<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#F07167' }}>if</span> node.satisfies_constraints(grid)<br />
              &nbsp;&nbsp;]<br />
              &nbsp;&nbsp;<span style={{ color: '#10B981' }}>return</span> compose_solution(optimal_flow)<br />
            </div>

            {/* Terminal Live Check */}
            <div style={{
              marginTop: '0.85rem',
              paddingTop: '0.6rem',
              borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#34d399'
            }}>
              <span>✓ Testcases passed: 24/24 [0.012s]</span>
              <span style={{ color: 'var(--sandal)' }}>Memory: 4.8MB</span>
            </div>
          </div>

        </div>

        {/* Feature Strip at Bottom of Left Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '1.25rem',
          zIndex: 2
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sandal)', fontWeight: 700, textTransform: 'uppercase' }}>Docker Isolated</div>
            <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>Multi-Language Sandbox</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sandal)', fontWeight: 700, textTransform: 'uppercase' }}>3-Strike Exam</div>
            <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>Real-Time Integrity</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sandal)', fontWeight: 700, textTransform: 'uppercase' }}>Milestone Vector</div>
            <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>Verified Credentials</div>
          </div>
        </div>

      </div>

      {/* =========================================================
          RIGHT 40% – LOGIN FORM
          Focused, Centered, Compact Authentication Screen
      ========================================================= */}
      <div className="auth-form-side">

        {/* Top Controls (Language Selector & Home Link) */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LanguageSelector compact={true} />
          <Link to="/" style={{ fontSize: '0.785rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            Back to Home &rarr;
          </Link>
        </div>

        {/* Compact Centered Form Card */}
        <div className="auth-card-compact">

          {/* Card Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {isAdminMode ? (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.6rem auto',
                  border: '1px solid var(--border)'
                }}>
                  <ShieldCheck size={24} />
                </div>
                <h2 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: '1.35rem' }}>
                  Admin Portal
                </h2>
                <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Platform administration & assessment controls
                </p>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--sandal-light)',
                  border: '1px solid var(--sandal-border)',
                  color: 'var(--sandal-dark)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.4rem'
                }}>
                  <Sparkles size={11} color="var(--coral)" /> Welcome Back
                </div>
                <h2 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: '1.35rem', fontFamily: 'var(--font-serif)' }}>
                  Sign in to KODIFY
                </h2>
                <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Enter your credentials to access your workspace
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.785rem' }}>
                <UserIcon size={13} color="var(--primary)" />
                {isAdminMode ? 'Admin Email' : 'Email or Username'}
              </label>
              <input
                type="text"
                value={isAdminMode ? 'kodifyofficial@gmail.com' : email}
                onChange={e => !isAdminMode && setEmail(e.target.value)}
                disabled={isAdminMode}
                readOnly={isAdminMode}
                placeholder={isAdminMode ? 'kodifyofficial@gmail.com' : 'name@example.com / username'}
                style={{
                  backgroundColor: isAdminMode ? 'var(--tag-bg)' : 'var(--input-bg)',
                  cursor: isAdminMode ? 'not-allowed' : 'text',
                  fontWeight: isAdminMode ? 600 : 'normal'
                }}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '0.785rem' }}>
                  <Lock size={13} color="var(--primary)" />
                  Password
                </label>
              </div>
              <input
                type="password"
                placeholder={isAdminMode ? 'Enter admin master password' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus={isAdminMode}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--coral-subtle)',
                  color: 'var(--coral-hover)',
                  border: '1px solid rgba(240, 113, 103, 0.3)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '0.85rem',
                  animation: 'slideUp 0.15s ease'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                background: isAdminMode ? 'var(--primary-deep)' : 'var(--primary)'
              }}
            >
              {loading ? 'AUTHENTICATING...' : (isAdminMode ? 'ENTER ADMIN CONSOLE' : 'SIGN IN')}
            </button>
          </form>

          {/* Google Sign In (User Mode only) */}
          {!isAdminMode && (
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              <div id="g_id_onload" style={{ width: '100%' }}></div>

              <button
                type="button"
                className="google-auth-btn"
                disabled={loading}
                onClick={async () => {
                  setError('');
                  const activeClientId = googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
                  if (!activeClientId) {
                    setError("Google OAuth is not configured. Please set GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID in your environment.");
                    return;
                  }

                  const processToken = async (credentialToken) => {
                    try {
                      setLoading(true);
                      const user = await loginWithGoogle(credentialToken);
                      handleSuccessfulAuth(user);
                    } catch (err) {
                      setError(err.response?.data?.message || err.message || "Google authentication failed.");
                    } finally {
                      setLoading(false);
                    }
                  };

                  if (window.google?.accounts?.id) {
                    try {
                      window.google.accounts.id.initialize({
                        client_id: activeClientId,
                        callback: (res) => {
                          if (res?.credential) {
                            processToken(res.credential);
                          }
                        },
                        auto_select: false,
                        prompt_parent_id: 'g_id_onload'
                      });

                      window.google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed()) {
                          console.log("GIS prompt not displayed:", notification.getNotDisplayedReason?.());
                        }
                      });
                      return;
                    } catch (e) {
                      console.warn("GIS prompt initialization error:", e);
                      setError("Google Sign-In initialization failed: " + (e.message || e));
                    }
                  } else {
                    setError("Google Identity Services script is not loaded. Please check your internet connection.");
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {/* Switch Options (Admin / User / Signup) */}
          {isAdminMode ? (
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.825rem'
                }}
              >
                <ArrowLeft size={14} /> Back to User Login
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Don't have an account? <Link to={location.search ? `/signup${location.search}` : "/signup"} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
              </p>

              <button
                type="button"
                onClick={() => handleSwitchMode(true)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} color="var(--primary)" /> Administrator Access
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Login;

