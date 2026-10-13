import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import LanguageSelector from './LanguageSelector';
import { User, Mail, Lock, Sparkles, Terminal, Award, CheckCircle2 } from 'lucide-react';

function Signup() {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', repeatPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

  const { register, loginWithGoogle } = useContext(AuthContext);
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
      .catch(() => {});
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const user = await register(formData);
      handleSuccessfulAuth(user);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.defaultMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      
      {/* LEFT 60% – BRANDING */}
      <div className="auth-brand-side">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '1px', color: '#ffffff' }}>
              KODIFY
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--sandal)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', background: 'rgba(254, 217, 183, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(254, 217, 183, 0.3)' }}>
              கோடிஃபை
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--sandal)', fontFamily: 'var(--font-mono)' }}>
            <Sparkles size={12} color="var(--coral)" />
            <span>JOIN THE CODING COLLECTIVE</span>
          </div>
        </div>

        <div style={{ margin: 'auto 0', zIndex: 2, padding: '1rem 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--sandal)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            &mdash; for the crooked thinkers &mdash;
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 0.85rem 0', color: '#ffffff' }}>
            Think Different. Code Your Way.
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#d1e6ec', maxWidth: '560px', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Join thousands of developers challenging algorithmic boundaries, practicing multi-concept problem solving, and earning verified technical credentials.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '540px' }}>
            <div style={{ background: 'rgba(4, 23, 31, 0.7)', border: '1px solid rgba(254, 217, 183, 0.2)', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ color: 'var(--sandal)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>✓ Algorithmic Mastery</div>
              <div style={{ color: '#96b7c4', fontSize: '0.785rem' }}>Solve problems across dynamic programming, trees, graphs, and greedy algorithms.</div>
            </div>
            <div style={{ background: 'rgba(4, 23, 31, 0.7)', border: '1px solid rgba(254, 217, 183, 0.2)', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>✓ Verified Credentials</div>
              <div style={{ color: '#96b7c4', fontSize: '0.785rem' }}>Unlock Standard, Advanced, and Elite PDF credentials backed by academic board verification.</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1.25rem', zIndex: 2, fontSize: '0.75rem', color: '#96b7c4' }}>
          &copy; {new Date().getFullYear()} KODIFY Platform &bull; Edition 2026
        </div>
      </div>

      {/* RIGHT 40% – SIGNUP FORM */}
      <div className="auth-form-side">
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LanguageSelector compact={true} />
          <Link to="/" style={{ fontSize: '0.785rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            Back to Home &rarr;
          </Link>
        </div>

        <div className="auth-card-compact" style={{ maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--sandal-light)', border: '1px solid var(--sandal-border)', color: 'var(--sandal-dark)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              <Sparkles size={11} color="var(--coral)" /> New Developer
            </div>
            <h2 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: '1.35rem', fontFamily: 'var(--font-serif)' }}>
              Create Your Account
            </h2>
            <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Begin your journey on the KODIFY platform
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontSize: '0.785rem' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Anandha Raman" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.785rem' }}>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="username" required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.785rem' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@domain.com" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.785rem' }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 chars" required minLength="8" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.785rem' }}>Repeat</label>
                <input type="password" name="repeatPassword" value={formData.repeatPassword} onChange={handleChange} placeholder="Repeat password" required minLength="8" />
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--coral-subtle)', color: 'var(--coral-hover)', border: '1px solid rgba(240, 113, 103, 0.3)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.775rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.4rem' }}>
              {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Google Sign In */}
          <div style={{ marginTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div id="g_id_onload_signup" style={{ width: '100%' }}></div>

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
                    setError(err.response?.data?.message || err.message || "Google registration failed.");
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
                      prompt_parent_id: 'g_id_onload_signup'
                    });

                    window.google.accounts.id.prompt((notification) => {
                      if (notification.isNotDisplayed()) {
                        console.log("GIS signup prompt not displayed:", notification.getNotDisplayedReason?.());
                      }
                    });
                    return;
                  } catch (e) {
                    console.warn("GIS prompt initialization error:", e);
                    setError("Google Sign-Up initialization failed: " + (e.message || e));
                  }
                } else {
                  setError("Google Identity Services script is not loaded. Please check your internet connection.");
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Already have an account? <Link to={location.search ? `/login${location.search}` : "/login"} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Signup;



