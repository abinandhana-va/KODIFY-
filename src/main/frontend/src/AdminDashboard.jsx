import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Shield,
  BookOpen,
  Terminal,
  Trophy,
  ClipboardList,
  LifeBuoy,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart2,
  PieChart,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { KolamMotif } from './components/AmbientArt';

function AdminDashboard() {
  const [timeframe, setTimeframe] = useState('30D');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (tf = timeframe) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/admin/analytics?timeframe=${tf}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error loading admin analytics:", err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  // Max score for score histogram calculation
  const scoreBuckets = [
    { label: '0-20', count: analytics?.scoreBucket0To20 || 0, color: '#ef4444' },
    { label: '21-40', count: analytics?.scoreBucket21To40 || 0, color: '#f97316' },
    { label: '41-60', count: analytics?.scoreBucket41To60 || 0, color: '#eab308' },
    { label: '61-80', count: analytics?.scoreBucket61To80 || 0, color: '#3b82f6' },
    { label: '81-100', count: analytics?.scoreBucket81To100 || 0, color: '#10b981' }
  ];
  const maxBucketCount = Math.max(1, ...scoreBuckets.map(b => b.count));

  // Submissions verdict distribution
  const verdicts = [
    { label: 'Accepted', count: analytics?.verdictAccepted || 0, color: '#10b981' },
    { label: 'Wrong Answer', count: analytics?.verdictWrongAnswer || 0, color: '#ef4444' },
    { label: 'Compilation Error', count: analytics?.verdictCompilationError || 0, color: '#f59e0b' },
    { label: 'Runtime Error', count: analytics?.verdictRuntimeError || 0, color: '#8b5cf6' },
    { label: 'Time Limit Exceeded', count: analytics?.verdictTimeLimitExceeded || 0, color: '#6b7280' }
  ];
  const totalVerdictCount = Math.max(1, verdicts.reduce((acc, v) => acc + v.count, 0));

  // Registration timeline max
  const regTimeline = analytics?.registrationTimeline || [];
  const maxRegCount = Math.max(1, ...regTimeline.map(p => p.count));

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      
      {/* HEADER WITH TIMEFRAME SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
              ADMINISTRATION CONSOLE
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--sandal)', fontStyle: 'italic', background: 'rgba(254, 217, 183, 0.12)', padding: '1px 5px', borderRadius: '3px' }}>
              மேற்பார்வை
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
            System Analytics & Insights
          </h1>
          <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Authoritative platform KPIs, user growth trends, assessment compliance, and evaluation metrics.
          </p>
        </div>

        {/* Timeframe selector pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {[
            { id: '7D', label: '7 Days' },
            { id: '30D', label: '30 Days' },
            { id: '90D', label: '90 Days' },
            { id: 'ALL', label: 'All Time' }
          ].map(tf => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeframe(tf.id)}
              style={{
                background: timeframe === tf.id ? 'var(--primary)' : 'transparent',
                color: timeframe === tf.id ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.775rem',
                fontWeight: timeframe === tf.id ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tf.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fetchAnalytics(timeframe)}
            title="Refresh analytics"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Calculating platform telemetry and analytics...</p>
        </div>
      )}

      {error && (
        <div className="error-msg" style={{ marginBottom: '1.25rem' }}>{error}</div>
      )}

      {!loading && analytics && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          
          {/* TOP 6 KPI METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Users
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
                    {analytics.totalUsers}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
                    Active: {analytics.activeUsersCount}
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 129, 167, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                  <Users size={20} />
                </div>
              </div>
            </div>

            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid var(--secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Problem Bank
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--secondary)', marginTop: '4px' }}>
                    {analytics.totalProblems}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Validated test suites
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 175, 185, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--secondary)' }}>
                  <BookOpen size={20} />
                </div>
              </div>
            </div>

            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Assessments
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                    {analytics.totalAssignments}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
                    {analytics.assignmentCompleted} completed attempts
                  </div>
                </div>
                <div style={{ background: 'rgba(22, 163, 74, 0.1)', padding: '8px', borderRadius: '8px', color: '#16a34a' }}>
                  <ClipboardList size={20} />
                </div>
              </div>
            </div>

            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid #eab308' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Contests
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                    {analytics.totalContests}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {analytics.contestParticipants} participants
                  </div>
                </div>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '8px', borderRadius: '8px', color: '#eab308' }}>
                  <Trophy size={20} />
                </div>
              </div>
            </div>

            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Submissions
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>
                    {analytics.totalSubmissions}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Docker sandboxed
                  </div>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px', borderRadius: '8px', color: '#8b5cf6' }}>
                  <Terminal size={20} />
                </div>
              </div>
            </div>

            <div className="dashboard-card" style={{ margin: 0, padding: '1.1rem', borderTop: '3px solid #f07167' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Open Tickets
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: analytics.openComplaintsCount > 0 ? '#ef4444' : '#16a34a', marginTop: '4px' }}>
                    {analytics.openComplaintsCount}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Avg SLA: ~{analytics.complaintAverageResolutionHours}h
                  </div>
                </div>
                <div style={{ background: 'rgba(240, 113, 103, 0.1)', padding: '8px', borderRadius: '8px', color: '#f07167' }}>
                  <LifeBuoy size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: USER REGISTRATION TIMELINE & VERDICT BREAKDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            
            {/* REGISTRATION TIMELINE CHART */}
            <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} color="var(--primary)" /> Developer Registrations Trend
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily user onboarding volume over selected window</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Window: {timeframe}
                </span>
              </div>

              {regTimeline.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  {regTimeline.map((pt, idx) => {
                    const heightPct = Math.max(8, Math.round((pt.count / maxRegCount) * 100));
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${pt.date}: ${pt.count} users`}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                          {pt.count > 0 ? pt.count : ''}
                        </div>
                        <div style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          background: 'linear-gradient(180deg, var(--primary) 0%, rgba(0, 129, 167, 0.4) 100%)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease'
                        }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registration records in this timeframe.</div>
              )}
            </div>

            {/* SUBMISSIONS VERDICT BREAKDOWN */}
            <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} color="var(--secondary)" /> Execution Verdict Breakdown
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distribution of evaluated code outcomes across problems & contests</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {verdicts.map(v => {
                  const pct = Math.round((v.count / totalVerdictCount) * 1000) / 10;
                  return (
                    <div key={v.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text)' }}>{v.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{v.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '7px', width: '100%', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: v.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ROW 3: SCORE DISTRIBUTION & ASSESSMENT METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            
            {/* SCORE DISTRIBUTION HISTOGRAM */}
            <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color="#eab308" /> Performance & Score Distribution
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scores achieved across candidate assessments & contests</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Overall Avg</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{analytics.overallAverageScore || 0} pts</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '150px', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                {scoreBuckets.map((bucket, idx) => {
                  const heightPct = Math.max(10, Math.round((bucket.count / maxBucketCount) * 100));
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: bucket.color, marginBottom: '3px' }}>
                        {bucket.count}
                      </div>
                      <div style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: bucket.color,
                        borderRadius: '4px 4px 0 0',
                        opacity: 0.85
                      }} />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '6px' }}>
                        {bucket.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ASSESSMENT & COMPLIANCE SUMMARY */}
            <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0 }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} color="#10b981" /> Assessment Participation & SLA
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance compliance, exam completion, and support turnaround</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-hover)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Completion Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                    {analytics.assignmentCompletionRate || 0}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {analytics.assignmentCompleted} of {analytics.assignmentAttended} submitted
                  </div>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Exam Duration</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', marginTop: '2px' }}>
                    {analytics.assignmentAverageTimeMinutes || 0}m
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Per completed attempt
                  </div>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Contest Participation</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#eab308', marginTop: '2px' }}>
                    {analytics.contestParticipants}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {analytics.contestAcceptedSubmissions} AC submissions
                  </div>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Support SLA Time</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--secondary)', marginTop: '2px' }}>
                    ~{analytics.complaintAverageResolutionHours || 2.5}h
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {analytics.complaintResolved} resolved tickets
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* MANAGEMENT QUICK ACCESS PANEL */}
          <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0 }}>
            <h3 style={{ margin: '0 0 0.85rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
              Administrative Workspaces
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <Link to="/admin/problems" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={15} color="var(--primary)" /> Problems</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
              <Link to="/admin/assignments" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ClipboardList size={15} color="#16a34a" /> Assignments</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
              <Link to="/admin/contests" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={15} color="#eab308" /> Contests</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
              <Link to="/admin/support" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><LifeBuoy size={15} color="#f07167" /> Support Desk</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
              <Link to="/admin/users" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={15} color="var(--primary)" /> Users</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
              <Link to="/admin/submissions" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontWeight: 600, color: 'var(--text)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Terminal size={15} color="#8b5cf6" /> Submissions</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              </Link>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
