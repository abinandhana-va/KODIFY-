import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Clock, Calendar, Users, ArrowRight, Play, AlertCircle, Sparkles } from 'lucide-react';

export function ContestReminderBanner({ onContestLoaded }) {
  const [nearestContest, setNearestContest] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  const [regTimeLeft, setRegTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  const [contestState, setContestState] = useState('LOADING'); // LIVE, REG_OPEN, REG_CLOSED, ENDED, NONE
  const navigate = useNavigate();

  const parseServerDate = (isoString) => {
    if (!isoString) return null;
    try {
      if (typeof isoString === 'string' && isoString.includes('T')) {
        const clean = isoString.replace('Z', '').split('.')[0];
        const [datePart, timePart] = clean.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }
      return new Date(isoString);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    axios.get('/api/contests')
      .then(res => {
        if (!mounted) return;
        const list = res.data || [];
        const now = new Date();

        // Sort by start time
        const activeOrUpcoming = list
          .filter(c => c.status !== 'COMPLETED' && c.status !== 'DRAFT')
          .sort((a, b) => {
            const da = parseServerDate(a.startTime);
            const db = parseServerDate(b.startTime);
            return (da || 0) - (db || 0);
          });

        // Pick live contest first, or next upcoming
        const live = activeOrUpcoming.find(c => {
          const s = parseServerDate(c.startTime);
          const e = parseServerDate(c.endTime);
          return s && e && now >= s && now <= e;
        });

        const chosen = live || activeOrUpcoming[0] || null;
        setNearestContest(chosen);
        if (onContestLoaded && chosen) {
          onContestLoaded(chosen);
        }
      })
      .catch(err => console.error("Could not fetch contest reminder:", err));

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!nearestContest) return;

    const updateTimer = () => {
      const now = new Date();
      const start = parseServerDate(nearestContest.startTime);
      const end = parseServerDate(nearestContest.endTime);

      if (!start || !end) return;

      const regDeadline = new Date(start.getTime() - 30 * 60 * 1000);

      if (now >= start && now <= end) {
        setContestState('LIVE');
        const diff = end - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours: h, minutes: m, seconds: s, totalMs: diff });
      } else if (now < start) {
        const diff = start - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours: h, minutes: m, seconds: s, totalMs: diff });

        if (now <= regDeadline) {
          setContestState('REG_OPEN');
          const regDiff = regDeadline - now;
          const rh = Math.floor(regDiff / (1000 * 60 * 60));
          const rm = Math.floor((regDiff % (1000 * 60 * 60)) / (1000 * 60));
          const rs = Math.floor((regDiff % (1000 * 60)) / 1000);
          setRegTimeLeft({ hours: rh, minutes: rm, seconds: rs, totalMs: regDiff });
        } else {
          setContestState('REG_CLOSED');
        }
      } else {
        setContestState('ENDED');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nearestContest]);

  if (!nearestContest || contestState === 'ENDED' || contestState === 'LOADING') {
    return null;
  }

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  const formattedStartTime = (() => {
    const d = parseServerDate(nearestContest.startTime);
    if (!d) return 'TBA';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  })();

  const isLive = contestState === 'LIVE';

  return (
    <div
      className="dashboard-card"
      style={{
        margin: '0 0 1.25rem 0',
        padding: '1.15rem 1.4rem',
        background: isLive
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(0, 129, 167, 0.08) 0%, rgba(0, 175, 185, 0.04) 100%)',
        border: `1.5px solid ${isLive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 129, 167, 0.25)'}`,
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 129, 167, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Trophy size={24} color={isLive ? '#ef4444' : 'var(--primary)'} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              background: isLive ? '#ef4444' : (contestState === 'REG_OPEN' ? '#16a34a' : '#d97706'),
              color: '#ffffff'
            }}>
              {isLive ? '🔴 CONTEST LIVE' : (contestState === 'REG_OPEN' ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Start: <strong>{formattedStartTime}</strong>
            </span>
          </div>

          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
            {nearestContest.title}
          </h4>
        </div>
      </div>

      {/* COUNTDOWN CLOCK & ACTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isLive ? 'Contest Ends In' : 'Contest Starts In'}
          </div>
          <div style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: isLive ? '#ef4444' : 'var(--primary)',
            letterSpacing: '1px'
          }}>
            {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </div>
          {contestState === 'REG_OPEN' && (
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
              Registration closes in {pad(regTimeLeft.hours > 0 ? regTimeLeft.hours * 60 + regTimeLeft.minutes : regTimeLeft.minutes)}m {pad(regTimeLeft.seconds)}s
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(nearestContest.registered ? `/contests/${nearestContest.id}/arena` : `/contests/${nearestContest.id}`)}
          className={`btn ${isLive ? 'btn-danger' : 'btn-primary'}`}
          style={{
            padding: '0.55rem 1.15rem',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isLive ? '#ef4444' : undefined
          }}
        >
          {nearestContest.registered ? (
            <>
              <Play size={15} fill="currentColor" /> Enter Arena
            </>
          ) : (
            <>
              <span>{contestState === 'REG_OPEN' ? 'Register Now' : 'View Contest'}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ContestReminderBanner;
