import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  Users,
  BookOpen,
  Calendar,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Admin Tab: 'ASSIGNMENTS' or 'CREATOR_VERIFICATIONS'
  const [adminTab, setAdminTab] = useState('ASSIGNMENTS');

  // Creator Verifications
  const [verifications, setVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Selected assignment for participant tracking drawer
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptRecordings, setAttemptRecordings] = useState([]);

  // Selected attempt for forensic integrity report modal
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const navigate = useNavigate();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error("Admin assignments error:", err);
      setError(err.response?.data?.message || "Failed to load platform assignments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const res = await axios.get('/api/creator-verification/admin/list');
      setVerifications(res.data || []);
    } catch (err) {
      console.error("Fetch verifications error:", err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchVerifications();
  }, []);

  const handleApproveVerification = async (vId) => {
    if (window.confirm("Approve this organization verification request? This will generate a secure 6-digit OTP and send it to the applicant's email to complete verification.")) {
      try {
        await axios.post(`/api/creator-verification/admin/${vId}/approve`);
        fetchVerifications();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to approve verification.");
      }
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await axios.post(`/api/creator-verification/admin/${rejectingId}/reject`, null, {
        params: { reason: rejectReason.trim() }
      });
      setRejectingId(null);
      setRejectReason('');
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject verification.");
    }
  };

  const handleViewDocument = async (vId, docType = 'member-proof') => {
    try {
      const res = await axios.get(`/api/creator-verification/admin/${vId}/document`, {
        params: { type: docType },
        responseType: 'blob'
      });
      const contentType = res.headers['content-type'] || (docType === 'member-proof' ? 'application/pdf' : 'image/jpeg');
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("View document error:", err);
      alert(err.response?.data?.message || "Failed to open document. It may not exist or authorization failed.");
    }
  };

  const openAttemptsDrawer = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      setLoadingAttempts(true);
      const [attRes, recRes] = await Promise.allSettled([
        axios.get(`/api/admin/assignments/${assignment.id}/attempts`),
        axios.get(`/api/assignments/${assignment.id}/recordings`)
      ]);
      if (attRes.status === 'fulfilled') setAttempts(attRes.value.data || []);
      if (recRes.status === 'fulfilled') setAttemptRecordings(recRes.value.data || []);
    } catch (err) {
      console.error("Failed to load attempts:", err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const openIntegrityReport = async (assignmentId, attemptId) => {
    setSelectedAttemptId(attemptId);
    try {
      setLoadingReport(true);
      const res = await axios.get(`/api/admin/assignments/${assignmentId}/attempts/${attemptId}/integrity`);
      setIntegrityReport(res.data);
    } catch (err) {
      console.error("Failed to load integrity report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this assignment and all attempts?")) {
      try {
        await axios.delete(`/api/assignments/${id}`);
        fetchAssignments();
        if (selectedAssignment?.id === id) {
          setSelectedAssignment(null);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete assignment.");
      }
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const totalAssigned = assignments.reduce((acc, a) => acc + (a.assignedUserCount || 0), 0);
  const totalViolations = assignments.reduce((acc, a) => acc + (a.violationCount || 0), 0);
  const totalFlagged = assignments.reduce((acc, a) => acc + (a.flaggedAttemptsCount || 0), 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--primary)" /> Assignment & Assessment Management
          </h2>
          <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Monitor classroom assessments, track proctored exam sessions, and inspect integrity audit timelines.
          </p>
        </div>

        <Link
          to="/assignments/create"
          className="btn btn-primary btn-sm"
        >
          <Plus size={14} /> Create Assessment
        </Link>
      </div>

      {/* METRICS ROW */}
      <div className="admin-stats-grid">
        <div className="stat-tile">
          <span className="stat-tile-label">Total Assignments</span>
          <div className="stat-tile-val">{assignments.length}</div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Assigned Candidates</span>
          <div className="stat-tile-val">{totalAssigned}</div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Integrity Violations</span>
          <div className="stat-tile-val" style={{ color: totalViolations > 0 ? '#d97706' : 'var(--text)' }}>
            {totalViolations}
          </div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Flagged for Review</span>
          <div className="stat-tile-val" style={{ color: totalFlagged > 0 ? '#dc2626' : '#059669' }}>
            {totalFlagged}
          </div>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
        <button
          type="button"
          onClick={() => setAdminTab('ASSIGNMENTS')}
          className={`btn ${adminTab === 'ASSIGNMENTS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ borderRadius: '4px' }}
        >
          Assignments & Exams ({assignments.length})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('CREATOR_VERIFICATIONS')}
          className={`btn ${adminTab === 'CREATOR_VERIFICATIONS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ borderRadius: '4px' }}
        >
          Host Verification Requests ({verifications.filter(v => v.status === 'PENDING').length} Pending)
        </button>
      </div>

      {adminTab === 'CREATOR_VERIFICATIONS' ? (
        <div className="dashboard-card" style={{ padding: '0.75rem 1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Host Verification Audit & Approval
          </h3>

          {loadingVerifications && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading host verification requests...</p>}

          {!loadingVerifications && verifications.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
              No host verification requests submitted.
            </p>
          )}

          {!loadingVerifications && verifications.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Organization Info</th>
                    <th>Phone</th>
                    <th>Gov ID 1</th>
                    <th>Gov ID 2</th>
                    <th>Member / Org Proof</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(v => {
                    const isHostVerified = v.status === 'HOST_VERIFIED' || v.status === 'APPROVED';
                    const isOtpPending = v.status === 'OTP_PENDING' || v.status === 'ADMIN_APPROVED';
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{v.fullName || v.username}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{v.contactEmail || v.email} (@{v.username})</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{v.organizationName}</div>
                          {v.organizationId && (
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              ID: {v.organizationId}
                            </div>
                          )}
                          {v.organizationWebsite && (
                            <div style={{ fontSize: '0.725rem' }}>
                              <a href={v.organizationWebsite.startsWith('http') ? v.organizationWebsite : `https://${v.organizationWebsite}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                {v.organizationWebsite}
                              </a>
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{v.phoneNumber || '--'}</td>
                        <td>
                          {v.hasGovernmentId1 !== false ? (
                            <button
                              type="button"
                              onClick={() => handleViewDocument(v.id, 'gov-id-1')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={12} /> View ID 1
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          {v.hasGovernmentId2 !== false ? (
                            <button
                              type="button"
                              onClick={() => handleViewDocument(v.id, 'gov-id-2')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={12} /> View ID 2
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(v.id, 'member-proof')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={12} /> View Proof
                          </button>
                        </td>
                        <td>
                          <span className={`verification-status-pill ${isHostVerified ? 'approved' : (isOtpPending ? 'pending' : (v.status || '').toLowerCase())}`} style={isOtpPending ? { background: '#fef3c7', color: '#b45309' } : {}}>
                            {isHostVerified ? 'VERIFIED HOST' : (isOtpPending ? 'OTP PENDING' : v.status)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : '--'}
                        </td>
                        <td>
                          {v.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleApproveVerification(v.id)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.725rem', fontWeight: 700 }}
                              >
                                Approve &amp; Send OTP
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectingId(v.id); setRejectReason(''); }}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.725rem' }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {isOtpPending ? 'Awaiting user OTP entry' : (v.adminComment || v.adminFeedback ? `Note: ${v.adminComment || v.adminFeedback}` : 'Decided')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
      /* MAIN DATA TABLE */
      <div className="dashboard-card" style={{ padding: '0.75rem 1rem' }}>
        {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading assignments...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && assignments.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
            No assignments recorded in database.
          </p>
        )}

        {!loading && !error && assignments.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Mode</th>
                  <th>Creator</th>
                  <th>Questions</th>
                  <th>Candidates</th>
                  <th>Violations</th>
                  <th>Flagged</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assignments/${a.id}`)}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description?.slice(0, 35)}...</div>
                    </td>
                    <td>
                      {a.secureMode ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: 'rgba(5, 150, 105, 0.15)', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Shield size={11} /> SECURE EXAM
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', background: 'var(--tag-bg)', color: 'var(--text-muted)' }}>
                          Standard
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        @{a.creatorUsername || 'User'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{a.problemCount} Qs</td>
                    <td style={{ fontWeight: 600 }}>{a.assignedUserCount}</td>
                    <td>
                      {a.violationCount > 0 ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={12} /> {a.violationCount}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td>
                      {a.flaggedAttemptsCount > 0 ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '3px', background: '#fee2e2', color: '#dc2626' }}>
                          {a.flaggedAttemptsCount} FLAGGED
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Clean</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{formatDate(a.dueDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem', fontWeight: 600 }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/assignments/${a.id}`); }}
                          title="Open Full Review & Performance Suite"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={(e) => handleDelete(a.id, e)}
                          title="Delete Assessment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* PARTICIPANT ATTEMPTS MODAL / DRAWER */}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedAssignment.title} — Candidates</h3>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {attempts.length} enrolled candidates &bull; Mode: {selectedAssignment.secureMode ? 'Secure Exam' : 'Standard'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingAttempts ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading candidate sessions...</p>
            ) : attempts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No enrolled candidates found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Status</th>
                    <th>Solved</th>
                    <th>Score</th>
                    <th>Violations</th>
                    <th>Integrity Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(att => (
                    <tr key={att.userId}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{att.name || att.username}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>@{att.username}</div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: att.status === 'COMPLETED' ? '#dcfce7' : (att.status === 'IN_PROGRESS' ? '#dbeafe' : 'var(--tag-bg)'),
                          color: att.status === 'COMPLETED' ? '#166534' : (att.status === 'IN_PROGRESS' ? '#1e40af' : 'var(--text-muted)')
                        }}>
                          {att.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {att.solvedCount} / {att.totalCount}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {att.score} Pts
                      </td>
                      <td>
                        {att.integrityViolationCount > 0 ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706' }}>
                            {att.integrityViolationCount} Strikes
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>0</span>
                        )}
                      </td>
                      <td>
                        {att.attemptId ? (
                          <button
                            type="button"
                            onClick={() => openIntegrityReport(selectedAssignment.id, att.attemptId)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <FileText size={12} /> {att.flaggedForReview ? '⚠️ View Audit (Flagged)' : 'View Audit'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Not Started</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* FORENSIC INTEGRITY REPORT MODAL */}
      {selectedAttemptId && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setSelectedAttemptId(null)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color={integrityReport?.flaggedForReview ? '#dc2626' : '#d97706'} />
                  Integrity Audit Report
                </h3>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Candidate: <strong>@{integrityReport?.username}</strong> ({integrityReport?.name}) &bull; Score: {integrityReport?.score} Pts
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttemptId(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingReport ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generating forensic timeline...</p>
            ) : !integrityReport ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No integrity report data available.</p>
            ) : (
              <div>
                {/* VIOLATION COUNTERS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fullscreen Exits</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: integrityReport.fullscreenExits > 0 ? '#dc2626' : 'var(--text)' }}>
                      {integrityReport.fullscreenExits}
                    </div>
                  </div>
                  <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tab Switches</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: integrityReport.tabSwitches > 0 ? '#d97706' : 'var(--text)' }}>
                      {integrityReport.tabSwitches}
                    </div>
                  </div>
                  <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paste Attempts</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: integrityReport.pasteAttempts > 0 ? '#d97706' : 'var(--text)' }}>
                      {integrityReport.pasteAttempts}
                    </div>
                  </div>
                  <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Strikes</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: integrityReport.totalViolations >= 3 ? '#dc2626' : 'var(--text)' }}>
                      {integrityReport.totalViolations}
                    </div>
                  </div>
                </div>

                {integrityReport.flaggedForReview && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} />
                    <span>Attempt is FLAGGED FOR REVIEW due to 3 or more recorded integrity violations.</span>
                  </div>
                )}

                {/* TIMELINE */}
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>Recorded Event Timeline</h4>
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.5rem', background: 'var(--input-bg)' }}>
                  {integrityReport.timeline?.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                      No integrity anomalies detected during this session.
                    </p>
                  ) : (
                    integrityReport.timeline.map(event => (
                      <div
                        key={event.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.4rem 0.6rem',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '0.785rem'
                        }}
                      >
                        <div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            marginRight: '8px',
                            background: event.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                            color: event.severity === 'CRITICAL' ? '#dc2626' : '#b45309'
                          }}>
                            {event.eventType}
                          </span>
                          <span style={{ color: 'var(--text)' }}>{event.metadata || 'Security event logged'}</span>
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '--'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* RECORDINGS REVIEW */}
                <h4 style={{ margin: '1.25rem 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="var(--primary)" /> Proctoring Streams & Recordings
                </h4>
                {attemptRecordings?.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No media chunks uploaded for this candidate.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {attemptRecordings.map(rec => (
                      <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.785rem' }}>
                        <div>
                          <strong>{rec.recordingType}</strong> &bull; {rec.durationSeconds}s &bull; {(rec.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <a
                          href={`/api/assignments/${selectedAssignment.id}/recordings/${rec.id}/stream`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.725rem' }}
                        >
                          Play Stream &rarr;
                        </a>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingId && (
        <div className="modal-overlay" style={{ zIndex: 12000 }} onClick={() => setRejectingId(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ margin: '0 0 0.5rem 0' }}>Reject Creator Request</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Provide constructive feedback explaining why the educator verification document was declined.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Uploaded document is illegible or not an official institutional ID."
              rows={4}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectVerification}
                className="btn btn-danger btn-sm"
                style={{ fontWeight: 700 }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminAssignments;
