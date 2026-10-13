import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, Eye, RefreshCw, UserCheck, Code2, XCircle, AlertTriangle } from 'lucide-react';

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/submissions');
      setSubmissions(res.data || []);
    } catch (err) {
      console.error("Error loading admin submissions:", err);
      setError('Unable to load platform submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const getDifficultyBadge = (diff) => {
    const norm = (diff || '').toUpperCase();
    if (norm === 'EASY') {
      return <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534' }}>Easy</span>;
    }
    if (norm === 'MEDIUM') {
      return <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', background: '#fef08a', color: '#854d0e' }}>Medium</span>;
    }
    return <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b' }}>Hard</span>;
  };

  const getStatusBadge = (status) => {
    const norm = (status || '').toUpperCase();
    if (norm === 'ACCEPTED' || norm === 'SOLVED') {
      return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={13} /> Accepted</span>;
    }
    if (norm === 'WRONG_ANSWER') {
      return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={13} /> Wrong Answer</span>;
    }
    if (norm === 'COMPILATION_ERROR') {
      return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={13} /> Compilation Error</span>;
    }
    if (norm === 'TIME_LIMIT_EXCEEDED') {
      return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#fffbeb', color: '#854d0e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> Time Limit Exceeded</span>;
    }
    if (norm === 'DOCKER_UNAVAILABLE') {
      return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> Docker Engine Unavailable</span>;
    }
    return <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={13} /> {status}</span>;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER CARD */}
      <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>Platform Submissions Analytics</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              View and inspect code submissions from all registered users.
            </p>
          </div>
          <button
            onClick={fetchAllSubmissions}
            style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Submissions
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="dashboard-card" style={{ padding: '1.25rem' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading platform submissions...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && submissions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No submissions recorded across the platform yet.
          </p>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>User</th>
                  <th>Problem Title</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Test Cases</th>
                  <th>Runtime</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{sub.id}</td>
                    
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{sub.name || sub.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{sub.username}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        #{sub.problemId}. {sub.problemTitle}
                      </div>
                    </td>

                    <td>{sub.concept}</td>
                    <td>{getDifficultyBadge(sub.difficulty)}</td>

                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        {sub.language}
                      </span>
                    </td>

                    <td>{getStatusBadge(sub.status)}</td>

                    <td style={{ fontWeight: 700 }}>
                      {sub.passedTestCases != null ? `${sub.passedTestCases} / ${sub.totalTestCases}` : 'N/A'}
                    </td>

                    <td style={{ fontFamily: 'monospace' }}>
                      {sub.runtime != null ? `${sub.runtime} ms` : 'N/A'}
                    </td>

                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        style={{ padding: '0.35rem 0.75rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> Inspect Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADMIN CODE INSPECTION MODAL */}
      {selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>
                  Submission #{selectedSubmission.id} – Admin Inspection
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Submitted by <strong>{selectedSubmission.name} (@{selectedSubmission.username})</strong> on {selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleString() : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ padding: '0.4rem 0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
              >
                Close ✕
              </button>
            </div>

            {/* METRICS */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div><strong>Problem:</strong> #{selectedSubmission.problemId}. {selectedSubmission.problemTitle}</div>
              <div><strong>Language:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedSubmission.language}</span></div>
              <div><strong>Status:</strong> {getStatusBadge(selectedSubmission.status)}</div>
              {selectedSubmission.passedTestCases != null && (
                <div><strong>Test Cases Passed:</strong> {selectedSubmission.passedTestCases} / {selectedSubmission.totalTestCases}</div>
              )}
              {selectedSubmission.runtime != null && (
                <div><strong>Runtime:</strong> {selectedSubmission.runtime} ms</div>
              )}
            </div>

            {/* SUBMITTED CODE */}
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Submitted User Code</h4>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1.25rem',
              borderRadius: '8px',
              overflowX: 'auto',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              maxHeight: '300px'
            }}>
              <code>{selectedSubmission.code}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminSubmissions;
