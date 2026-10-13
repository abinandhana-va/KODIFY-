import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import {
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Calendar,
  Play,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Zap,
  FileText,
  AlertTriangle,
  X,
  Eye,
  BarChart2,
  UserPlus,
  Video,
  Check,
  Percent,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  HelpCircle,
  Code,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
  Terminal,
  Activity
} from 'lucide-react';
import { AssignmentOverviewWidget, SecurityStatusWidget, ExpandableInstructionsWidget } from './components/AssignmentWidgets';
import { KolamMotif, WaveDivider } from './components/AmbientArt';
import ExamMediaRecordingPlayer from './components/ExamMediaRecordingPlayer';
import { formatDateTime, formatDate as formatSimpleDate } from './utils/dateUtils';

function AssignmentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab View for Creator: 'OVERVIEW', 'PARTICIPANTS', 'SECURITY'
  // For Participant: 'OVERVIEW', 'REVIEW'
  const requestedTab = searchParams.get('tab')?.toUpperCase();
  const [activeTab, setActiveTab] = useState(requestedTab === 'REVIEW' ? 'REVIEW' : 'OVERVIEW');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Filtering & Sorting in Participants tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scoreSort, setScoreSort] = useState('DEFAULT');

  // Creator Deep-Dive Participant Review Modal
  const [selectedParticipantUserId, setSelectedParticipantUserId] = useState(null);
  const [participantReview, setParticipantReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewSubTab, setReviewSubTab] = useState('QUESTIONS'); // 'QUESTIONS', 'RECORDING', 'INTEGRITY'
  const [activeReviewQIndex, setActiveReviewQIndex] = useState(0);

  // Integrity Audit Modal (Quick standalone view)
  const [selectedAuditAttemptId, setSelectedAuditAttemptId] = useState(null);
  const [auditReport, setAuditReport] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Invite All Users Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allUsersCount, setAllUsersCount] = useState(0);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  // Participant Review state (for non-creator completed participant)
  const [myReview, setMyReview] = useState(null);
  const [loadingMyReview, setLoadingMyReview] = useState(false);
  const [expandedQuestionCode, setExpandedQuestionCode] = useState({});

  const isCreator = useMemo(() => {
    if (!assignment) return false;
    return Boolean(
      assignment.isCreator ||
      assignment.creator === true ||
      (assignment.creatorId && user?.id && assignment.creatorId === user.id) ||
      user?.role === 'ADMIN'
    );
  }, [assignment, user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedParticipantUserId(null);
        setParticipantReview(null);
        setSelectedAuditAttemptId(null);
        setAuditReport(null);
        setShowInviteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/assignments/${id}`);
      const data = res.data;
      setAssignment(data);

      const isUserCreator = Boolean(
        data.isCreator ||
        data.creator === true ||
        (data.creatorId && user?.id && data.creatorId === user.id) ||
        user?.role === 'ADMIN'
      );

      if (isUserCreator) {
        fetchReport();
      } else {
        fetchMyReview();
        if (requestedTab === 'REVIEW' || data.isCompleted || data.status === 'CLOSED') {
          setActiveTab('REVIEW');
        }
      }
    } catch (err) {
      console.error("Error fetching assignment:", err);
      setError(err.response?.data?.message || "Unable to load assignment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      setLoadingMyReview(true);
      const res = await axios.get(`/api/assignments/${id}/my-review`);
      setMyReview(res.data);
    } catch (err) {
      console.error("Failed to load participant review:", err);
    } finally {
      setLoadingMyReview(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoadingReport(true);
      const res = await axios.get(`/api/assignments/${id}/report`);
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to load assignment report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleOpenParticipantReview = async (userId) => {
    if (!userId) return;
    try {
      setSelectedParticipantUserId(userId);
      setLoadingReview(true);
      setActiveReviewQIndex(0);
      setReviewSubTab('QUESTIONS');
      const res = await axios.get(`/api/assignments/${id}/participants/${userId}/review`);
      setParticipantReview(res.data);
    } catch (err) {
      console.error("Failed to load participant review:", err);
      alert(err.response?.data?.message || "Failed to load candidate attempt details.");
      setSelectedParticipantUserId(null);
      setParticipantReview(null);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleOpenInviteModal = async () => {
    try {
      setShowInviteModal(true);
      const res = await axios.get('/api/users');
      setAllUsersCount((res.data || []).length);
    } catch (err) {
      setAllUsersCount(50);
    }
  };

  const handleConfirmInviteAll = async () => {
    try {
      setInviting(true);
      const res = await axios.post(`/api/assignments/${id}/invite-all`);
      setInviteSuccessMsg(res.data?.message || "Users invited successfully!");
      fetchDetail();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccessMsg('');
      }, 2000);
    } catch (err) {
      console.error("Failed to invite all users:", err);
      alert(err.response?.data?.message || "Failed to invite users.");
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleOpenAuditModal = async (attemptId) => {
    if (!attemptId) return;
    try {
      setSelectedAuditAttemptId(attemptId);
      setLoadingAudit(true);
      const res = await axios.get(`/api/assignments/${id}/attempts/${attemptId}/integrity`);
      setAuditReport(res.data);
    } catch (err) {
      console.error("Failed to load integrity report:", err);
      alert(err.response?.data?.message || "Failed to load attempt integrity report.");
      setSelectedAuditAttemptId(null);
    } finally {
      setLoadingAudit(false);
    }
  };

  const formatDate = (isoString) => {
    return formatDateTime(isoString, '--');
  };

  // Filtered and sorted participants list
  const filteredParticipants = useMemo(() => {
    if (!reportData || !reportData.participants) return [];
    let list = [...reportData.participants];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'FLAGGED') {
        list = list.filter(p => p.flaggedForReview || p.integrityViolationCount > 0);
      } else if (statusFilter === 'SUBMITTED') {
        list = list.filter(p => p.status === 'SUBMITTED' || p.completionStatus === 'COMPLETED');
      } else if (statusFilter === 'IN_PROGRESS') {
        list = list.filter(p => p.status === 'IN_PROGRESS');
      } else if (statusFilter === 'NOT_ATTEMPTED') {
        list = list.filter(p => p.status === 'NOT_ATTEMPTED' || p.status === 'OPENED' || !p.status);
      }
    }

    // Score Sort
    if (scoreSort === 'SCORE_DESC') {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (scoreSort === 'SCORE_ASC') {
      list.sort((a, b) => (a.score || 0) - (b.score || 0));
    }

    return list;
  }, [reportData, searchQuery, statusFilter, scoreSort]);

  // Flagged candidates list for Security tab
  const flaggedParticipants = useMemo(() => {
    if (!reportData || !reportData.participants) return [];
    return reportData.participants.filter(p => p.flaggedForReview || (p.integrityViolationCount && p.integrityViolationCount > 0));
  }, [reportData]);

  const alreadyInvitedCount = assignment?.participants?.length || reportData?.totalInvited || 0;
  const newInvitationsCount = Math.max(0, allUsersCount - alreadyInvitedCount);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => navigate('/assignments')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={14} /> Back to Assignments
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {assignment?.isCreator && (
            <button
              type="button"
              onClick={handleOpenInviteModal}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={14} color="var(--primary)" /> Invite All Users
            </button>
          )}

          {assignment?.secureMode && !assignment.isCreator && (
            <button
              onClick={() => navigate(`/assignments/enter/${assignment.id || assignment.assignmentId}`)}
              className="btn btn-primary btn-sm"
              style={{
                padding: '0.45rem 1.25rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0284c7'
              }}
            >
              <ShieldCheck size={16} /> Enter Secure Exam Mode
            </button>
          )}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading assignment details...</p>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && assignment && (
        <div className="kodify-workspace-2col">
          {/* Main Content Column */}
          <div className="kodify-center-pane">
            {/* HEADER CARD */}
            <div className="dashboard-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: assignment.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-hover)',
                      color: assignment.status === 'ACTIVE' ? '#16a34a' : 'var(--text-muted)'
                    }}>
                      {assignment.status}
                    </span>
                    {assignment.secureMode && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(2, 132, 199, 0.15)',
                        color: '#0284c7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <ShieldCheck size={12} /> SECURE PROCTORED EXAM
                      </span>
                    )}
                  </div>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text)' }}>
                    {assignment.title}
                  </h1>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Created by: <strong style={{ color: 'var(--text)' }}>{assignment.creatorName || assignment.creatorUsername || 'Host'}</strong> • Due: <strong>{formatDate(assignment.dueDate)}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem', paddingBottom: '0.25rem', overflowX: 'auto' }}>
              {isCreator ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`btn btn-sm ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <BarChart2 size={14} /> Overview & Analytics
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('PARTICIPANTS')}
                    className={`btn btn-sm ${activeTab === 'PARTICIPANTS' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Users size={14} /> Enrolled Candidates ({reportData?.totalInvited || assignment.participants?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SECURITY')}
                    className={`btn btn-sm ${activeTab === 'SECURITY' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: flaggedParticipants.length > 0 && activeTab !== 'SECURITY' ? '#dc2626' : undefined
                    }}
                  >
                    <ShieldAlert size={14} /> Security Reports {flaggedParticipants.length > 0 && `(${flaggedParticipants.length})`}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`btn btn-sm ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <BookOpen size={14} /> Assessment Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('REVIEW'); if (!myReview) fetchMyReview(); }}
                    className={`btn btn-sm ${activeTab === 'REVIEW' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', color: activeTab === 'REVIEW' ? undefined : '#059669' }}
                  >
                    <Award size={14} /> My Attempt & Response Review
                  </button>
                </>
              )}
            </div>

            {/* TAB CONTENT: CREATOR OVERVIEW */}
            {activeTab === 'OVERVIEW' && isCreator && (
              <div>
                {loadingReport ? (
                  <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading assessment overview...</p>
                ) : reportData ? (
                  <>
                    {/* AGGREGATE METRICS ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Invited</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{reportData.totalInvited}</div>
                      </div>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Attempted</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>{reportData.attemptedCount}</div>
                      </div>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid #16a34a' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Completed</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{reportData.submittedCount}</div>
                      </div>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid #d97706' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Score</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>{Math.round(reportData.averageScore || 0)} pts</div>
                      </div>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Completion %</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>{Math.round(reportData.completionPercentage || 0)}%</div>
                      </div>
                      <div className="dashboard-card" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid #dc2626' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Flagged</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (flaggedParticipants?.length || 0) > 0 ? '#dc2626' : 'var(--text)', marginTop: '2px' }}>
                          {flaggedParticipants?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* QUESTION PERFORMANCE BREAKDOWN */}
                    <div className="dashboard-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: '0 0 0.85rem 0', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={16} color="var(--primary)" /> Question Breakdown & Performance
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Question Title</th>
                              <th>Type</th>
                              <th>Difficulty</th>
                              <th>Points</th>
                              <th>Attempted</th>
                              <th>Correct</th>
                              <th>Wrong</th>
                              <th>Accuracy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(reportData.questionPerformance || []).map((qp, idx) => (
                              <tr key={qp.problemId || idx}>
                                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Q{idx + 1}</td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{qp.title}</td>
                                <td>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: qp.questionType === 'MCQ' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                    color: qp.questionType === 'MCQ' ? '#9333ea' : '#0284c7'
                                  }}>
                                    {qp.questionType || 'CODING'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: qp.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (qp.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                                    color: qp.difficulty === 'EASY' ? '#166534' : (qp.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                                  }}>
                                    {qp.difficulty}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700 }}>{qp.points}</td>
                                <td>{qp.attemptedCount}</td>
                                <td style={{ color: '#16a34a', fontWeight: 700 }}>{qp.correctCount}</td>
                                <td style={{ color: '#dc2626' }}>{qp.wrongCount}</td>
                                <td style={{ fontWeight: 700 }}>{Math.round(qp.accuracyPercentage || 0)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* TAB CONTENT: CREATOR PARTICIPANTS */}
            {activeTab === 'PARTICIPANTS' && isCreator && (
              <div className="dashboard-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="var(--primary)" /> Enrolled Candidates ({filteredParticipants.length})
                  </h3>

                  {/* Search and Filters */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search candidate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          padding: '0.3rem 0.6rem 0.3rem 1.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--card-bg)',
                          color: 'var(--text)',
                          fontSize: '0.8rem',
                          width: '160px'
                        }}
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--text)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">Completed / Submitted</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="NOT_ATTEMPTED">Not Attempted</option>
                      <option value="FLAGGED">Flagged for Review</option>
                    </select>

                    <select
                      value={scoreSort}
                      onChange={(e) => setScoreSort(e.target.value)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--text)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <option value="DEFAULT">Default Order</option>
                      <option value="SCORE_DESC">Score: High to Low</option>
                      <option value="SCORE_ASC">Score: Low to High</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Submitted</th>
                        <th>Questions</th>
                        <th>Score</th>
                        <th>Security Flag</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                            No candidates match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((part) => (
                          <tr key={part.userId}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{part.name || part.username}</div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{part.email}</div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: part.status === 'SUBMITTED' ? 'rgba(34, 197, 94, 0.15)' : (part.status === 'IN_PROGRESS' ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-hover)'),
                                color: part.status === 'SUBMITTED' ? '#16a34a' : (part.status === 'IN_PROGRESS' ? '#d97706' : 'var(--text-muted)')
                              }}>
                                {part.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(part.startedAt)}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(part.submittedAt)}</td>
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              {part.questionsAttempted} / {part.totalQuestions}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              {part.score} / {part.totalPossibleScore || part.totalPoints || 100} ({Math.round(part.percentage || 0)}%)
                            </td>
                            <td>
                              {part.flaggedForReview || (part.integrityViolationCount > 0) ? (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <AlertTriangle size={10} /> {part.integrityViolationCount} Flag{part.integrityViolationCount !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Clean</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleOpenParticipantReview(part.userId)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                              >
                                <Eye size={12} /> Review Attempt
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CREATOR SECURITY REPORTS */}
            {activeTab === 'SECURITY' && isCreator && (
              <div className="dashboard-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} color="#dc2626" /> Security & Integrity Incident Reports
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Permanent forensic audit record for Assignment #{assignment.id || assignment.assignmentId}
                  </span>
                </div>

                {flaggedParticipants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'var(--bg-hover)', borderRadius: '8px' }}>
                    <ShieldCheck size={36} color="#16a34a" style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)' }}>No Integrity Violations Detected</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      All participating developers adhered to proctoring rules without triggering security strikes.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {flaggedParticipants.map((fp) => (
                      <div
                        key={fp.userId}
                        style={{
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '1rem',
                          background: 'rgba(254, 242, 242, 0.4)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem' }}>
                              {fp.name || fp.username}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({fp.email})</span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: '#fee2e2',
                              color: '#991b1b'
                            }}>
                              {fp.integrityViolationCount} VIOLATIONS RECORDED
                            </span>
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Camera Status: <strong style={{ color: fp.cameraStatus === 'ACTIVE' ? '#16a34a' : '#ef4444' }}>{fp.cameraStatus || 'NOT_INITIALIZED'}</strong> • Attempt Status: <strong>{fp.status}</strong> • Score: <strong>{fp.score} pts</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenParticipantReview(fp.userId)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                          >
                            <Eye size={12} /> Review Attempt & Recording
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: NON-CREATOR OVERVIEW / QUESTIONS */}
            {activeTab === 'OVERVIEW' && !isCreator && (
              <div className="dashboard-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="var(--primary)" /> Included Assessment Problems
                  </h3>
                  {assignment.secureMode && (
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> Fullscreen Proctored Environment
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {(assignment.problems || []).map((p, idx) => (
                    <div
                      key={p.problemId || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: p.solved ? 'rgba(34, 197, 94, 0.04)' : 'var(--card-bg)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', width: '22px', fontFamily: 'var(--font-mono)' }}>
                          #{idx + 1}
                        </span>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
                              {p.title}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: p.questionType === 'MCQ' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                              color: p.questionType === 'MCQ' ? '#9333ea' : '#0284c7'
                            }}>
                              {p.questionType || 'CODING'}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: p.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (p.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                              color: p.difficulty === 'EASY' ? '#166534' : (qp => qp === 'MEDIUM' ? '#d97706' : '#dc2626')(p.difficulty)
                            }}>
                              {p.difficulty}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
                            Topic: {p.concept || 'Programming'} • {p.points || 100} Pts
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.solved ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={13} /> Unsolved
                          </span>
                        )}

                        {assignment.secureMode ? (
                          <button
                            onClick={() => navigate(`/assignments/enter/${assignment.id || assignment.assignmentId}`)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <ShieldCheck size={12} /> {p.solved ? 'Review in Exam' : 'Solve in Exam'}
                          </button>
                        ) : (
                          <Link
                            to={`/problems/${p.problemId}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <Play size={11} /> {p.solved ? 'Review Code' : 'Solve Problem'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PARTICIPANT SELF-REVIEW */}
            {activeTab === 'REVIEW' && !isCreator && (
              <div className="dashboard-card" style={{ padding: '1.25rem', border: '1px solid rgba(5, 150, 105, 0.3)', background: 'rgba(5, 150, 105, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> CANDIDATE ASSESSMENT ATTEMPT & RESPONSE REVIEW
                    </span>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
                      {assignment.title}
                    </h3>
                  </div>
                  {myReview && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Your Official Score</div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)' }}>
                        {myReview.score || 0} / {myReview.totalPoints || myReview.totalPossibleScore || 100} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({Math.round(myReview.percentage || 0)}%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {loadingMyReview ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                    <Activity size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary)' }} />
                    <p>Loading your submission responses and performance analysis...</p>
                  </div>
                ) : myReview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Performance Summary Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Time Taken</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14} color="var(--primary)" /> {myReview.formattedTime || '00:00'}
                        </div>
                      </div>

                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Started At</div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                          {formatDate(myReview.startedAt)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Submitted At</div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                          {formatDate(myReview.submittedAt)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Solved Questions</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> {myReview.correctCount || 0} / {(myReview.questions || myReview.questionResults || []).length}
                        </div>
                      </div>

                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Integrity Status</div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: (myReview.integrityViolationCount || 0) > 0 ? '#ef4444' : '#16a34a',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {(myReview.integrityViolationCount || 0) > 0 ? (
                            <>
                              <ShieldAlert size={14} /> {myReview.integrityViolationCount} Strikes Recorded
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> Verified Clean
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Flagged Alert Banner if Applicable */}
                    {(myReview.flaggedForReview || (myReview.integrityViolationCount && myReview.integrityViolationCount > 0)) && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <AlertTriangle size={20} color="#dc2626" />
                        <div>
                          <strong style={{ color: '#991b1b', fontSize: '0.85rem' }}>Integrity Review Flagged</strong>
                          <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Your exam session recorded {myReview.integrityViolationCount} proctoring warning strikes (e.g. tab switches or fullscreen exits) and is subject to standard audit review.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Question by Question Solutions & Responses */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={16} color="var(--primary)" /> Question Responses & Evaluation Breakdown
                      </h4>

                      {(myReview.questions || myReview.questionResults || []).length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          No question responses found for this assessment attempt.
                        </div>
                      ) : (
                        (myReview.questions || myReview.questionResults || []).map((qr, idx) => {
                          const isMCQ = qr.questionType === 'MCQ';
                          const isCorrect = qr.status === 'CORRECT';
                          const isWrong = qr.status === 'WRONG';

                          return (
                            <div key={qr.problemId || idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem', background: 'var(--card-bg)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.9rem' }}>
                                      Question {idx + 1}:
                                    </span>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      background: isMCQ ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                      color: isMCQ ? '#9333ea' : '#0284c7'
                                    }}>
                                      {qr.questionType || 'CODING'}
                                    </span>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      background: qr.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (qr.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                                      color: qr.difficulty === 'EASY' ? '#166534' : (qr.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                                    }}>
                                      {qr.difficulty}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                                    {qr.title}
                                  </h4>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '5px',
                                    background: isCorrect ? 'rgba(34, 197, 94, 0.15)' : (isWrong ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-hover)'),
                                    color: isCorrect ? '#16a34a' : (isWrong ? '#ef4444' : 'var(--text-muted)'),
                                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                                  }}>
                                    {isCorrect ? <CheckCircle size={13} /> : (isWrong ? <XCircle size={13} /> : <Clock size={13} />)}
                                    {isCorrect ? 'Correct' : (isWrong ? 'Incorrect' : 'Not Attempted')}
                                  </span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                                    {qr.earnedPoints || 0} / {qr.points || 100} pts
                                  </span>
                                </div>
                              </div>

                              {/* Problem statement description */}
                              {qr.description && (
                                <div style={{ fontSize: '0.825rem', color: 'var(--text)', margin: '0.5rem 0', whiteSpace: 'pre-wrap', lineHeight: 1.5, background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '6px' }}>
                                  {qr.description}
                                </div>
                              )}

                              {/* Image if present */}
                              {qr.imageUrl && (
                                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                                  <img
                                    src={qr.imageUrl}
                                    alt={qr.title}
                                    style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', border: '1px solid var(--border)', objectFit: 'contain', background: '#000' }}
                                  />
                                </div>
                              )}

                              {/* MCQ Evaluation */}
                              {isMCQ && (
                                <div style={{ marginTop: '0.65rem', background: 'var(--bg-hover)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Option Choices Evaluation:
                                  </div>
                                  {qr.options && qr.options.length > 0 && (
                                    <div style={{ display: 'grid', gap: '6px', marginBottom: '0.5rem' }}>
                                      {qr.options.map((opt, oIdx) => {
                                        const isSelected = qr.userResponse === opt;
                                        const isAnswer = qr.correctOption === opt;
                                        return (
                                          <div
                                            key={oIdx}
                                            style={{
                                              padding: '6px 10px',
                                              borderRadius: '5px',
                                              border: isAnswer ? '1px solid #16a34a' : (isSelected ? '1px solid #ef4444' : '1px solid var(--border)'),
                                              background: isAnswer ? 'rgba(34, 197, 94, 0.1)' : (isSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--card-bg)'),
                                              color: isAnswer ? '#166534' : (isSelected ? '#991b1b' : 'var(--text)'),
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}
                                          >
                                            <div>
                                              <strong style={{ fontFamily: 'var(--font-mono)', marginRight: '6px' }}>{String.fromCharCode(65 + oIdx)}.</strong>
                                              <span>{opt}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                              {isSelected && (
                                                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '3px', background: isAnswer ? '#dcfce7' : '#fee2e2', color: isAnswer ? '#166534' : '#991b1b' }}>
                                                  [Your Choice]
                                                </span>
                                              )}
                                              {isAnswer && (
                                                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '3px', background: '#dcfce7', color: '#166534' }}>
                                                  [Correct Key ✓]
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {qr.explanation && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', padding: '6px 8px', background: 'rgba(217, 119, 6, 0.08)', borderRadius: '4px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                                      <strong style={{ color: 'var(--primary)' }}>Editorial Rationale:</strong> {qr.explanation}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Coding Evaluation */}
                              {!isMCQ && (
                                <div style={{ marginTop: '0.65rem' }}>
                                  {qr.submittedCode ? (
                                    <>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedQuestionCode(prev => ({ ...prev, [qr.problemId]: !prev[qr.problemId] }))}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem', fontWeight: 700 }}
                                        >
                                          {expandedQuestionCode[qr.problemId] ? 'Hide Submitted Code' : 'View Submitted Code'}
                                        </button>

                                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                          Language: <strong>{qr.language || 'Code'}</strong> • Runtime: <strong>{qr.runtime ? `${qr.runtime}s` : 'N/A'}</strong> • Test Cases: <strong style={{ color: isCorrect ? '#16a34a' : 'inherit' }}>{qr.passedTestCases || 0}/{qr.totalTestCases || 0} Passed</strong>
                                        </div>
                                      </div>

                                      {expandedQuestionCode[qr.problemId] && (
                                        <div style={{ background: '#090d16', borderRadius: '6px', padding: '0.85rem', color: '#f8fafc', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', border: '1px solid #1e293b' }}>
                                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{qr.submittedCode}</pre>
                                          {qr.compilerOutput && (
                                            <div style={{ borderTop: '1px solid #1e293b', marginTop: '0.5rem', paddingTop: '0.5rem', color: '#cbd5e1', fontSize: '0.725rem' }}>
                                              <span style={{ color: '#94a3b8' }}>Compiler Output:</span>
                                              <pre style={{ margin: '2px 0 0 0', whiteSpace: 'pre-wrap' }}>{qr.compilerOutput}</pre>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div style={{ padding: '0.65rem', background: 'var(--bg-hover)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.775rem', fontStyle: 'italic' }}>
                                      No code was submitted for this question during the assessment.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                    <p>No assessment attempt record found yet. Once you submit your assessment, your answers and scores will be available here.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Rail: Widgets & Instructions */}
          <div className="kodify-right-rail">
            <AssignmentOverviewWidget assignment={assignment} />
            {assignment.secureMode && (
              <SecurityStatusWidget secureModeEnabled={true} />
            )}
            <ExpandableInstructionsWidget instructions={assignment.description} defaultOpen={true} />

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <KolamMotif size={36} opacity={0.25} color="var(--primary)" />
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE CREATOR PARTICIPANT ATTEMPT REVIEW MODAL */}
      {selectedParticipantUserId && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedParticipantUserId(null); setParticipantReview(null); } }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px',
            maxWidth: '1100px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-hover)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                }}>
                  <Award size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800 }}>
                      {participantReview ? (participantReview.name || participantReview.username) : 'Candidate Attempt Review'}
                    </h3>
                    {participantReview && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                        background: participantReview.status === 'COMPLETED' || participantReview.status === 'SUBMITTED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                        color: participantReview.status === 'COMPLETED' || participantReview.status === 'SUBMITTED' ? '#16a34a' : '#d97706'
                      }}>
                        {participantReview.status}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {participantReview ? `${participantReview.email} • ${assignment.title}` : 'Loading candidate session details...'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {participantReview && (
                  <div style={{ textAlign: 'right', marginRight: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Candidate Score</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {participantReview.score || 0} / {participantReview.totalPoints || participantReview.totalPossibleScore || 100} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({Math.round(participantReview.percentage || 0)}%)</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedParticipantUserId(null); setParticipantReview(null); }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {loadingReview ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Activity size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
                <p>Loading candidate answers, webcam recordings, and integrity telemetry...</p>
              </div>
            ) : participantReview ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Meta Highlights Bar */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1.5rem',
                  background: 'var(--card-bg)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Time Taken</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="var(--primary)" /> {participantReview.formattedTime || '00:00'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Questions Solved</div>
                    <div style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} /> {participantReview.correctCount} / {participantReview.questions?.length || 0} Correct
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Camera Stream</div>
                    <div style={{
                      fontWeight: 700,
                      color: participantReview.cameraStatus === 'ACTIVE' ? '#16a34a' : (participantReview.cameraStatus === 'DENIED' ? '#ef4444' : 'var(--text-muted)'),
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Video size={13} /> {participantReview.cameraStatus || 'NOT_INITIALIZED'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Integrity Incidents</div>
                    <div style={{
                      fontWeight: 800,
                      color: (participantReview.integrityViolationCount || 0) > 0 ? '#ef4444' : '#16a34a',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <ShieldAlert size={13} /> {participantReview.integrityViolationCount || 0} Strikes
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Submitted At</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                      {formatDate(participantReview.submittedAt)}
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs Selector */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-hover)'
                }}>
                  <button
                    type="button"
                    onClick={() => setReviewSubTab('QUESTIONS')}
                    className={`btn btn-sm ${reviewSubTab === 'QUESTIONS' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <BookOpen size={14} /> Questions & Solutions ({participantReview.questions?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewSubTab('RECORDING')}
                    className={`btn btn-sm ${reviewSubTab === 'RECORDING' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Video size={14} /> Session Video & Audio Recording {participantReview.recordings?.length > 0 && `(${participantReview.recordings.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewSubTab('INTEGRITY')}
                    className={`btn btn-sm ${reviewSubTab === 'INTEGRITY' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: (participantReview.integrityViolationCount || 0) > 0 && reviewSubTab !== 'INTEGRITY' ? '#dc2626' : undefined
                    }}
                  >
                    <ShieldAlert size={14} /> Integrity Audit Log {(participantReview.integrityViolationCount || 0) > 0 && `(${participantReview.integrityViolationCount})`}
                  </button>
                </div>

                {/* Sub-Tab Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                  {/* SUB-TAB 1: QUESTIONS & RESPONSES */}
                  {reviewSubTab === 'QUESTIONS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Question Stepper Buttons */}
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                        {(participantReview.questions || []).map((q, qIdx) => {
                          const isCurrent = qIdx === activeReviewQIndex;
                          const isCorrect = q.status === 'CORRECT';
                          const isWrong = q.status === 'WRONG';

                          return (
                            <button
                              key={q.problemId || qIdx}
                              type="button"
                              onClick={() => setActiveReviewQIndex(qIdx)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: isCurrent ? 'rgba(217, 119, 6, 0.12)' : 'var(--card-bg)',
                                color: isCurrent ? 'var(--primary)' : 'var(--text)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>Q{qIdx + 1}</span>
                              {isCorrect && <CheckCircle size={13} color="#16a34a" />}
                              {isWrong && <XCircle size={13} color="#ef4444" />}
                              {!isCorrect && !isWrong && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>–</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Question Detail */}
                      {participantReview.questions && participantReview.questions[activeReviewQIndex] ? (() => {
                        const currentQ = participantReview.questions[activeReviewQIndex];
                        const isMCQ = currentQ.questionType === 'MCQ';

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Question Header Card */}
                            <div style={{
                              padding: '1rem 1.25rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              background: 'var(--card-bg)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                                    Question {activeReviewQIndex + 1} of {participantReview.questions.length}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: isMCQ ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                    color: isMCQ ? '#9333ea' : '#0284c7'
                                  }}>
                                    {currentQ.questionType || 'CODING'}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: currentQ.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (currentQ.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                                    color: currentQ.difficulty === 'EASY' ? '#166534' : (currentQ.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                                  }}>
                                    {currentQ.difficulty}
                                  </span>
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                                  {currentQ.title}
                                </h4>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: currentQ.status === 'CORRECT' ? 'rgba(34, 197, 94, 0.15)' : (currentQ.status === 'WRONG' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-hover)'),
                                  color: currentQ.status === 'CORRECT' ? '#16a34a' : (currentQ.status === 'WRONG' ? '#ef4444' : 'var(--text-muted)'),
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {currentQ.status === 'CORRECT' ? <CheckCircle size={14} /> : (currentQ.status === 'WRONG' ? <XCircle size={14} /> : <Clock size={14} />)}
                                  {currentQ.status === 'CORRECT' ? 'Solved Correctly' : (currentQ.status === 'WRONG' ? 'Incorrect Submission' : 'Not Attempted')}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                                  {currentQ.earnedPoints || 0} / {currentQ.points} Pts
                                </span>
                              </div>
                            </div>

                            {/* Question Diagram / Image (if present) */}
                            {currentQ.imageUrl && (
                              <div style={{
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                background: 'var(--bg-hover)',
                                textAlign: 'center'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  <ImageIcon size={14} /> Question Reference Diagram
                                </div>
                                <img
                                  src={currentQ.imageUrl}
                                  alt={currentQ.title}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '340px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    objectFit: 'contain',
                                    background: '#000'
                                  }}
                                />
                              </div>
                            )}

                            {/* Question Description / Statement */}
                            {currentQ.description && (
                              <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--card-bg)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                color: 'var(--text)'
                              }}>
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Problem Statement
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{currentQ.description}</div>
                              </div>
                            )}

                            {/* MCQ Candidate Choice vs Correct Option */}
                            {isMCQ && (
                              <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--card-bg)'
                              }}>
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                                  Options Evaluation & Candidate Response
                                </div>

                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {(currentQ.options || []).map((opt, oIdx) => {
                                    const isCandidateSelection = currentQ.userResponse === opt;
                                    const isCorrect = currentQ.correctOption === opt;

                                    let borderColor = 'var(--border)';
                                    let bgColor = 'var(--bg-hover)';
                                    let tagText = null;
                                    let tagBg = null;
                                    let tagColor = null;

                                    if (isCorrect && isCandidateSelection) {
                                      borderColor = '#16a34a';
                                      bgColor = 'rgba(34, 197, 94, 0.08)';
                                      tagText = 'Candidate Selected ✓ (Correct)';
                                      tagBg = 'rgba(34, 197, 94, 0.2)';
                                      tagColor = '#166534';
                                    } else if (isCorrect) {
                                      borderColor = '#16a34a';
                                      bgColor = 'rgba(34, 197, 94, 0.05)';
                                      tagText = 'Correct Answer Key';
                                      tagBg = 'rgba(34, 197, 94, 0.15)';
                                      tagColor = '#166534';
                                    } else if (isCandidateSelection) {
                                      borderColor = '#ef4444';
                                      bgColor = 'rgba(239, 68, 68, 0.08)';
                                      tagText = 'Candidate Selected ✗ (Incorrect)';
                                      tagBg = 'rgba(239, 68, 68, 0.2)';
                                      tagColor = '#991b1b';
                                    }

                                    return (
                                      <div
                                        key={oIdx}
                                        style={{
                                          padding: '0.75rem 1rem',
                                          borderRadius: '6px',
                                          border: `1px solid ${borderColor}`,
                                          background: bgColor,
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: '0.75rem',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)', width: '20px' }}>
                                            {String.fromCharCode(65 + oIdx)}.
                                          </span>
                                          <span style={{ color: 'var(--text)', fontWeight: isCorrect || isCandidateSelection ? 700 : 400 }}>
                                            {opt}
                                          </span>
                                        </div>

                                        {tagText && (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: tagBg,
                                            color: tagColor,
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {tagText}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {currentQ.explanation && (
                                  <div style={{
                                    marginTop: '0.85rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '6px',
                                    background: 'rgba(217, 119, 6, 0.06)',
                                    border: '1px solid rgba(217, 119, 6, 0.2)',
                                    fontSize: '0.8rem',
                                    color: 'var(--text)'
                                  }}>
                                    <strong style={{ color: 'var(--primary)' }}>Answer Rationale / Editorial:</strong>
                                    <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>{currentQ.explanation}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Coding Submitted Code & Test Results */}
                            {!isMCQ && (
                              <div style={{
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: '#090d16',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  padding: '0.65rem 1rem',
                                  background: '#0f172a',
                                  borderBottom: '1px solid #1e293b',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.75rem',
                                  color: '#94a3b8'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Terminal size={14} color="var(--primary)" />
                                    <span>Submitted Solution ({currentQ.language || 'Code'})</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px' }}>
                                    <span>Runtime: <strong>{currentQ.runtime ? `${currentQ.runtime}s` : 'N/A'}</strong></span>
                                    <span>Test Cases: <strong>{currentQ.passedTestCases || 0} / {currentQ.totalTestCases || 0} Passed</strong></span>
                                  </div>
                                </div>

                                {currentQ.submittedCode ? (
                                  <div style={{ padding: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                                    <pre style={{
                                      margin: 0,
                                      color: '#f8fafc',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.825rem',
                                      lineHeight: 1.5,
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {currentQ.submittedCode}
                                    </pre>
                                  </div>
                                ) : (
                                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.825rem', fontStyle: 'italic' }}>
                                    No source code was submitted by candidate for this question.
                                  </div>
                                )}

                                {currentQ.compilerOutput && (
                                  <div style={{
                                    borderTop: '1px solid #1e293b',
                                    padding: '0.75rem 1rem',
                                    background: '#040711',
                                    fontSize: '0.75rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: '#cbd5e1'
                                  }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '2px' }}>Compiler & Execution Logs:</div>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentQ.compilerOutput}</pre>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Stepper Bottom Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                              <button
                                type="button"
                                disabled={activeReviewQIndex === 0}
                                onClick={() => setActiveReviewQIndex(prev => Math.max(0, prev - 1))}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ChevronLeft size={14} /> Previous Question
                              </button>

                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {activeReviewQIndex + 1} of {participantReview.questions.length}
                              </span>

                              <button
                                type="button"
                                disabled={activeReviewQIndex === participantReview.questions.length - 1}
                                onClick={() => setActiveReviewQIndex(prev => Math.min(participantReview.questions.length - 1, prev + 1))}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                Next Question <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })() : null}
                    </div>
                  )}

                  {/* SUB-TAB 2: PROCTORING VIDEO & AUDIO PLAYBACK */}
                  {reviewSubTab === 'RECORDING' && (
                    <div>
                      {participantReview.recordings && participantReview.recordings.length > 0 ? (
                        <ExamMediaRecordingPlayer
                          recordings={participantReview.recordings}
                          assignmentId={id}
                          integrityEvents={participantReview.integrityReport?.timeline || []}
                          attemptStartedAt={participantReview.startedAt}
                          candidateName={participantReview.name || participantReview.username}
                        />
                      ) : (
                        <div style={{
                          padding: '3rem 1.5rem',
                          textAlign: 'center',
                          background: 'var(--bg-hover)',
                          borderRadius: '8px',
                          border: '1px dashed var(--border)'
                        }}>
                          <Video size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                          <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)' }}>No Persistent Stream Recording Found</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
                            {assignment.secureMode
                              ? "The candidate's video recording was either not finalized or the camera permission was unavailable during this session."
                              : "This assessment was conducted in standard mode without persistent webcam proctoring."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 3: INTEGRITY & AUDIT REPORT */}
                  {reviewSubTab === 'INTEGRITY' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {participantReview.integrityReport ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fullscreen Exits</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                                {participantReview.integrityReport.fullscreenExits || 0}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tab Switches</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                                {participantReview.integrityReport.tabSwitches || 0}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Window Blurs</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                                {participantReview.integrityReport.windowBlurs || 0}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paste Attempts</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                                {participantReview.integrityReport.pasteAttempts || 0}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--card-bg)'
                          }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ShieldAlert size={16} color="#ef4444" /> Chronological Event Timeline
                            </h4>

                            {participantReview.integrityReport.timeline && participantReview.integrityReport.timeline.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                                {participantReview.integrityReport.timeline.map((evt, idx) => (
                                  <div
                                    key={evt.id || idx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.55rem 0.85rem',
                                      borderRadius: '6px',
                                      background: 'var(--bg-hover)',
                                      fontSize: '0.785rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        background: evt.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                                        color: evt.severity === 'CRITICAL' ? '#991b1b' : '#92400e'
                                      }}>
                                        {evt.eventType}
                                      </span>
                                      <span style={{ color: 'var(--text)' }}>{evt.metadata || 'Violation recorded'}</span>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>{formatDate(evt.timestamp)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                                No integrity violations were recorded for this attempt.
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No integrity audit records available for this candidate.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* QUICK INTEGRITY AUDIT MODAL */}
      {selectedAuditAttemptId && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedAuditAttemptId(null); setAuditReport(null); } }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px',
            maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#ef4444" /> Security & Integrity Audit Log
                </h3>
                {auditReport && (
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Candidate: <strong>{auditReport.name || auditReport.username}</strong> • Total Flags: <strong>{auditReport.totalViolations}</strong>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedAuditAttemptId(null); setAuditReport(null); }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            {loadingAudit ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading audit log...</p>
            ) : auditReport ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fullscreen Exits</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{auditReport.fullscreenExits}</div>
                  </div>
                  <div style={{ background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tab Switches</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{auditReport.tabSwitches}</div>
                  </div>
                  <div style={{ background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Window Blurs</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{auditReport.windowBlurs}</div>
                  </div>
                  <div style={{ background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paste Attempts</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{auditReport.pasteAttempts}</div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text)' }}>Event Timeline</h4>
                {auditReport.timeline && auditReport.timeline.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {auditReport.timeline.map((evt, idx) => (
                      <div key={evt.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', borderRadius: '4px', background: 'var(--bg-hover)', fontSize: '0.775rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 800,
                            background: evt.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                            color: evt.severity === 'CRITICAL' ? '#991b1b' : '#92400e'
                          }}>
                            {evt.eventType}
                          </span>
                          <span style={{ color: 'var(--text)' }}>{evt.metadata || 'Violation recorded'}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>{formatDate(evt.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No integrity violations were detected during this attempt.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* INVITE ALL CONFIRMATION MODAL */}
      {showInviteModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px',
            maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text)', fontWeight: 800 }}>
              Invite All Eligible Candidates?
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              This will automatically enroll all registered developers into this assessment and generate personalized secure access codes. Duplicate invitations will be prevented.
            </p>

            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Platform Users:</span>
                <strong>{allUsersCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Already Enrolled:</span>
                <strong>{alreadyInvitedCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border)', color: 'var(--primary)' }}>
                <span style={{ fontWeight: 700 }}>New Invitations to Send:</span>
                <strong style={{ fontSize: '1rem' }}>{newInvitationsCount}</strong>
              </div>
            </div>

            {inviteSuccessMsg && (
              <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {inviteSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                disabled={inviting}
                onClick={() => setShowInviteModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={inviting || newInvitationsCount === 0}
                onClick={handleConfirmInviteAll}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                {inviting ? 'Sending Invitations...' : 'Invite All Users'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentDetail;
