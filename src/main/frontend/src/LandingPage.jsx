import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import LanguageSelector from './LanguageSelector';
import {
  Terminal,
  Shield,
  Trophy,
  Award,
  CheckCircle2,
  ArrowRight,
  Code2,
  Cpu,
  Lock,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Zap,
  Flame,
  Layers,
  ChevronRight,
  Compass,
  GitBranch,
  FileCode2,
  Check
} from 'lucide-react';

function LandingPage() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <div className="landing-ambient-wrapper" style={{ minHeight: '100vh', width: '100%', color: 'var(--text)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Subtle Theme-Colored Floating Ambient Orbs for Wide Displays */}
      <div className="landing-side-orb landing-side-orb-teal" aria-hidden="true" />
      <div className="landing-side-orb landing-side-orb-coral" aria-hidden="true" />
      <div className="landing-side-orb landing-side-orb-emerald" aria-hidden="true" />
      <div className="landing-side-orb landing-side-orb-sandal" aria-hidden="true" />

      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.55rem',
              fontWeight: 800,
              letterSpacing: '0.8px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              KODIFY
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--sandal-dark)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              background: 'var(--sandal-light)',
              padding: '1px 7px',
              borderRadius: '3px',
              border: '1px solid var(--sandal-border)'
            }}>
              கோடிஃபை
            </span>
          </Link>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/problems" style={{ color: 'var(--text)', fontSize: '0.835rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Problems
            </Link>
            <Link to="/assignments" style={{ color: 'var(--text-muted)', fontSize: '0.835rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Assessments
            </Link>
            <Link to="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.835rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Contests
            </Link>
            <Link to="/certificates" style={{ color: 'var(--text-muted)', fontSize: '0.835rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Certificates
            </Link>
            <Link to="/leaderboard" style={{ color: 'var(--text-muted)', fontSize: '0.835rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Leaderboard
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <LanguageSelector compact={true} />

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.6rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={14} color="var(--sandal)" /> : <Moon size={14} />}
          </button>

          {user ? (
            <button
              onClick={() => navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')}
              className="btn btn-primary btn-sm"
            >
              Workspace &rarr;
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ background: 'var(--primary)' }}>
                Start Coding
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* =========================================================
          HERO SECTION – FULL VIEWPORT WITH RICH CODING & CULTURAL ART
      ========================================================= */}
      <section style={{
        padding: '3.5rem 2rem 3rem 2rem',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--card-bg) 0%, var(--bg) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Background Kolam Radial Art */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 129, 167, 0.05) 0%, rgba(254, 217, 183, 0.08) 60%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '3rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          
          {/* HERO LEFT TEXT */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--sandal-light)',
              border: '1px solid var(--sandal-border)',
              padding: '3px 12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--sandal-dark)',
              marginBottom: '1.25rem'
            }}>
              <Sparkles size={13} color="var(--coral)" /> For the crooked thinkers
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.3rem, 3.8vw, 3.3rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 1.25rem 0',
              color: 'var(--text)',
              letterSpacing: '-0.02em'
            }}>
              Where traditional curiosity meets modern code.
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '1.25rem'
            }}>
              "Where the way you think matters more than the way you're expected to think."
            </p>

            {/* Core Value Statement Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1.85rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>&bull;</span> Practice problems
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>&bull;</span> Build logic
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--coral)', fontWeight: 800 }}>&bull;</span> Take assessments
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 800 }}>&bull;</span> Prove your skills
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to={user ? '/problems' : '/signup'}
                className="btn btn-primary btn-lg"
                style={{ fontWeight: 700, gap: '8px' }}
              >
                EXPLORE PROBLEMS <ArrowRight size={16} />
              </Link>

              <Link
                to={user ? '/dashboard' : '/login'}
                className="btn btn-secondary btn-lg"
                style={{ fontWeight: 600, borderColor: 'var(--sandal-border)', background: 'var(--sandal-light)', color: 'var(--sandal-dark)' }}
              >
                START CODING
              </Link>
            </div>

            {/* Terminal Code Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '2rem',
              background: 'var(--table-th-bg)',
              border: '1px solid var(--border)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.785rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>$ kodify test solution.py</span>
              <span>&bull;</span>
              <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>24/24 passed (0.01s)</span>
            </div>
          </div>

          {/* HERO RIGHT VISUAL – TRADITIONAL TAMIL STUDY MEETS MODERN CODING LAB */}
          <div style={{
            background: 'linear-gradient(145deg, #072b38 0%, #004d66 60%, #006685 100%)',
            borderRadius: '12px',
            border: '2px solid var(--sandal-border)',
            boxShadow: '0 20px 35px -8px rgba(0, 81, 103, 0.35)',
            padding: '1.5rem',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Symmetrical Kolam Line Geometry SVG Watermark */}
            <svg style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '220px', height: '220px', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 100 100">
              <polygon points="50,5 95,50 50,95 5,50" stroke="#FED9B7" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="30" stroke="#FED9B7" strokeWidth="2" fill="none" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#FED9B7" strokeWidth="1" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#FED9B7" strokeWidth="1" />
              <circle cx="50" cy="20" r="4" fill="#F07167" />
              <circle cx="50" cy="80" r="4" fill="#F07167" />
              <circle cx="20" cy="50" r="4" fill="#00AFB9" />
              <circle cx="80" cy="50" r="4" fill="#00AFB9" />
            </svg>

            {/* IDE Window Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--coral)' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sandal)' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--emerald)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--sandal)' }}>
                kolam_graph_traversal.java
              </span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px' }}>
                JDK 17
              </span>
            </div>

            {/* Code Snippet Window */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem', lineHeight: '1.65', color: '#e0f2f7', background: 'rgba(4, 21, 28, 0.75)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(254, 217, 183, 0.2)' }}>
              <span style={{ color: 'var(--sandal)', fontStyle: 'italic' }}>// Kolam Matrix: Symmetrical Node Traversal</span><br/>
              <span style={{ color: 'var(--coral)' }}>public class</span> <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>KolamLogicEngine</span> &#123;<br/>
              &nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>public static boolean</span> isSymmetric(int[][] matrix) &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>int</span> n = matrix.length;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>for</span> (<span style={{ color: 'var(--coral)' }}>int</span> i = 0; i &lt; n; i++) &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>for</span> (<span style={{ color: 'var(--coral)' }}>int</span> j = 0; j &lt; n; j++) &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>if</span> (matrix[i][j] != matrix[j][i]) <span style={{ color: 'var(--emerald)' }}>return false</span>;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--emerald)' }}>return true</span>; <span style={{ color: 'var(--sandal)', fontStyle: 'italic' }}>// Perfect Kolam Symmetry</span><br/>
              &nbsp;&nbsp;&#125;<br/>
              &#125;
            </div>

            {/* Interactive Live Status Output */}
            <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.725rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 10px', borderRadius: '4px', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} color="#34d399" /> Sandbox Verified: ACCEPTED
              </div>
              <div style={{ background: 'rgba(254, 217, 183, 0.15)', border: '1px solid rgba(254, 217, 183, 0.3)', padding: '6px 10px', borderRadius: '4px', color: 'var(--sandal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="var(--accent-gold)" /> Runtime: 0.04s (Top 2%)
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          PRODUCT TRUST / PILLARS STRIP (WARM SANDAL & TEAL THEME)
      ========================================================= */}
      <section style={{
        background: 'var(--sandal-light)',
        borderBottom: '1px solid var(--sandal-border)',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-deep)', fontFamily: 'var(--font-serif)' }}>Docker Isolated</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sandal-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Sandbox Execution Engine</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--coral)', fontFamily: 'var(--font-serif)' }}>3-Strike Exam</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sandal-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Real-Time Integrity Protection</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-deep)', fontFamily: 'var(--font-serif)' }}>Admin Contests</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sandal-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Live Rankings & Certificates</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-dark)', fontFamily: 'var(--font-serif)' }}>3-Tier Vector</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sandal-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Verified Milestone Certificates</div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SIGNATURE STORYTELLING: FROM KOLAM TO CODE
      ========================================================= */}
      <section style={{
        padding: '4.5rem 2rem',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              color: 'var(--primary-deep)',
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: '0.725rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              <Compass size={13} color="var(--primary)" /> The Kodify Story
            </div>

            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.3rem',
              fontWeight: 800,
              margin: '0 0 0.75rem 0',
              color: 'var(--text)'
            }}>
              Where Patterns Become Logic.
            </h2>

            <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              For centuries, South Indian Kolam tradition has cultivated intuitive mathematical thinking through symmetry, looping patterns, and recursive geometry. KODIFY brings this spirit into modern engineering.
            </p>
          </div>

          {/* Symmetrical Diagram Grid: Kolam to Code */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            background: 'var(--bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '10px',
            padding: '2rem'
          }}>
            {/* Step 1: Kolam Heritage */}
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--sandal-light)',
                border: '1.5px solid var(--sandal-border)',
                color: 'var(--sandal-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}>
                கோ
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                Kolam Geometry
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Dot grid &rarr; Symmetrical loops &rarr; Recursive strokes &rarr; Constraint satisfaction.
              </p>
            </div>

            {/* Step 2: Algorithmic Transformation */}
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--primary-subtle)',
                border: '1.5px solid var(--primary)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}>
                <GitBranch size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                Pattern Abstraction
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Problem state &rarr; Node relationships &rarr; Invariant detection &rarr; Optimized logic.
              </p>
            </div>

            {/* Step 3: Modern Code Execution */}
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--emerald-subtle)',
                border: '1.5px solid var(--emerald)',
                color: 'var(--emerald-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}>
                <FileCode2 size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                Production Code
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                &#123; &#125; &bull; [ ] &bull; if () &bull; for () &bull; Isolated Docker runtime.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          CODING FEATURES – ALTERNATING RHYTHMIC VISUAL SHOWCASES
      ========================================================= */}
      <section style={{ padding: '4.5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            High-Performance Engineering Features
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Every component designed with purposeful information density and authentic feedback loops.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
          {/* SHOWCASE 1: PROBLEM PRACTICE (TEXT LEFT, CODE VISUAL RIGHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Terminal size={14} /> Problem Practice
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text)' }}>
                Multi-Concept Algorithmic Challenges
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Practice problems tagged across core foundational concepts: Arrays, Trees, Dynamic Programming, and Graph theory. Run comprehensive test cases with instant feedback.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Easy (30)</span>
                <span style={{ fontSize: '0.75rem', background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Medium (45)</span>
                <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Hard (20)</span>
              </div>
              <Link to="/problems" className="btn btn-primary btn-sm">
                Browse Problems &rarr;
              </Link>
            </div>

            {/* MOCK CODE EDITOR VISUAL */}
            <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--sidebar-border)', borderRadius: '8px', padding: '1.25rem', color: '#f8fafc', boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--sandal)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <span>#42. Crooked Shortest Path</span>
                <span style={{ color: 'var(--emerald)' }}>Accepted</span>
              </div>
              <div style={{ fontSize: '0.785rem', lineHeight: 1.6, color: '#e0f2f7' }}>
                <span style={{ color: 'var(--coral)' }}>def</span> <span style={{ color: 'var(--secondary)' }}>shortest_path</span>(graph, start, end):<br/>
                &nbsp;&nbsp;visited = set()<br/>
                &nbsp;&nbsp;queue = deque([(start, [start])])<br/>
                &nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>while</span> queue:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;node, path = queue.popleft()<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--coral)' }}>if</span> node == end: <span style={{ color: 'var(--emerald)' }}>return</span> path<br/>
              </div>
            </div>
          </div>

          {/* SHOWCASE 2: SECURE ASSIGNMENTS (EXAM VISUAL LEFT, TEXT RIGHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            {/* EXAM WORKSPACE VISUAL */}
            <div style={{ background: '#09151e', border: '2px solid var(--coral)', borderRadius: '8px', padding: '1.25rem', color: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.725rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                  SECURE EXAM LOCK ACTIVE
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--sandal)' }}>
                  ⏱ 01:24:50
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Assessment: <strong>Midterm Data Structures & Algorithms</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', fontSize: '0.725rem', color: '#cbd5e1' }}>
                🛡 Tab switch detection &bull; Fullscreen enforced &bull; Copy/paste disabled &bull; Admin audit logging enabled
              </div>
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--coral)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Shield size={14} /> Secure Exam Mode
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text)' }}>
                Classroom Integrity & 3-Strike Rule
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Conduct exams with anti-cheat protection. Tab switches trigger real-time integrity strikes with instant administrative auditing.
              </p>
              <Link to="/assignments" className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}>
                View Assessments &rarr;
              </Link>
            </div>
          </div>

          {/* SHOWCASE 3: CONTESTS (TEXT LEFT, LEADERBOARD VISUAL RIGHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Trophy size={14} /> Coding Contests
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text)' }}>
                Organization Contests & Live Standings
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Compete against top developers in timed contests with live leaderboards, Rank 1 achievement certificates, and streak multiplier bonuses 🔥.
              </p>
              <Link to="/contests" className="btn btn-primary btn-sm" style={{ background: 'var(--primary-deep)' }}>
                Join Contests &rarr;
              </Link>
            </div>

            {/* LEADERBOARD VISUAL */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Live Contest Standings</span>
                <span style={{ fontSize: '0.725rem', color: 'var(--sandal-dark)', background: 'var(--sandal-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Top Rankers</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: '4px' }}>
                  <span>🥇 1. Rajesh Sundaram</span>
                  <strong style={{ color: 'var(--primary)' }}>400 pts (18m)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                  <span>🥈 2. Kaviya Priya</span>
                  <strong style={{ color: 'var(--primary)' }}>380 pts (24m)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                  <span>🥉 3. Vigneshwaran</span>
                  <strong style={{ color: 'var(--primary)' }}>350 pts (31m)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SHOWCASE 4: CERTIFICATES & BADGES (CERTIFICATE VISUAL LEFT, TEXT RIGHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            {/* CERTIFICATE CARD VISUAL */}
            <div className="cert-card-standard" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>KODIFY VERIFIED CREDENTIAL</div>
              <h4 style={{ margin: '0.5rem 0', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800 }}>Certificate of Algorithmic Mastery</h4>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Presented for solving milestone challenge requirements.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--emerald-subtle)', color: 'var(--emerald-dark)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: 800 }}>
                <Check size={12} /> ACADEMIC BOARD VERIFIED
              </div>
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--emerald)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Award size={14} /> Milestone Credentials
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text)' }}>
                Standard, Advanced & Elite Vector Certificates
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Earn verified PDF certificates with digital audit hashes as you progress from foundational problems to elite tournament victories.
              </p>
              <Link to="/certificates" className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--emerald)', color: 'var(--emerald-dark)' }}>
                Explore Certificates &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          EDITORIAL CTA SECTION
      ========================================================= */}
      <section style={{
        background: 'linear-gradient(135deg, #072b38 0%, #004d66 60%, #0081A7 100%)',
        color: '#ffffff',
        padding: '4rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--sandal)', fontSize: '0.785rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            <Sparkles size={13} color="var(--coral)" /> Ready to test your intellect?
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
            Join the Crooked Thinkers.
          </h2>
          <p style={{ fontSize: '1rem', color: '#d1e6ec', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
            Solve real problems, master algorithmic thinking, host classroom assessments, and stand out with verified coding credentials.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-lg" style={{ background: 'var(--sandal)', color: '#072b38', fontWeight: 800 }}>
              CREATE FREE ACCOUNT
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" style={{ background: 'transparent', color: '#ffffff', borderColor: '#ffffff' }}>
              SIGN IN
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER WITH TAMIL HOMAGE & LANGUAGE SELECTOR
      ========================================================= */}
      <footer style={{
        padding: '2rem 2rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--card-bg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>
            KODIFY
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--sandal-dark)', fontSize: '0.8rem' }}>
            கோடிஃபை &bull; Traditional Curiosity meets Modern Code
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/problems" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Problems</Link>
          <Link to="/assignments" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Assessments</Link>
          <Link to="/contests" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contests</Link>
          <Link to="/certificates" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Certificates</Link>
          <Link to="/leaderboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Leaderboard</Link>
          <LanguageSelector compact={true} />
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;

