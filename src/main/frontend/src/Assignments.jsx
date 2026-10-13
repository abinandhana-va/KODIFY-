import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Clock, CheckCircle2, AlertCircle, ChevronRight, Users, Trash2, Calendar, BookOpen, Shield, Play, Eye } from 'lucide-react';
import { formatDate } from './utils/dateUtils';

function Assignments() {
  const [tab, setTab] = useState('ASSIGNED'); // 'ASSIGNED' or 'CREATED'
  const [assignedList, setAssignedList] = useState([]);
  const [createdList, setCreatedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignedRes, createdRes] = await Promise.all([
        axios.get('/api/assignments/my-assigned'),
        axios.get('/api/assignments/my-created')
      ]);
      setAssignedList(assignedRes.data || []);
      setCreatedList(createdRes.data || []);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError(err.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await axios.delete(`/api/assignments/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete assignment.");
      }
    }
  };



  const currentList = tab === 'ASSIGNED' ? assignedList : createdList;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--primary)" /> Assignments & Assessments
          </h2>
          <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Manage classroom coding problem sets, review candidate submissions, and take secure proctored exams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              const assignId = prompt("Enter Assignment ID (from your invitation email):", "");
              if (assignId && assignId.trim()) {
                navigate(`/assignments/enter/${assignId.trim()}`);
              }
            }}
            className="btn btn-secondary btn-sm"
          >
            <Shield size={14} /> Enter Assignment
          </button>

          <Link
            to="/assignments/create"
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Create Assignment
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
        <button
          onClick={() => setTab('ASSIGNED')}
          className={`btn ${tab === 'ASSIGNED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ borderRadius: '4px' }}
        >
          Assigned to Me ({assignedList.length})
        </button>

        <button
          onClick={() => setTab('CREATED')}
          className={`btn ${tab === 'CREATED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ borderRadius: '4px' }}
        >
          Created by Me ({createdList.length})
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading assignments...</p>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && currentList.length === 0 && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <ClipboardList size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
            {tab === 'ASSIGNED' ? 'No assignments assigned to you.' : 'You have not created any assignments yet.'}
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            {tab === 'ASSIGNED' ? 'When teachers or peers assign problem sets to you, they will appear here.' : 'Create an assignment to assign challenges to students or peers.'}
          </p>
          {tab === 'CREATED' && (
            <Link to="/assignments/create" className="btn btn-primary btn-sm">
              Create an Assignment
            </Link>
          )}
        </div>
      )}

      {!loading && !error && currentList.length > 0 && (
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {currentList.map(item => (
            <div
              key={item.id}
              className="dashboard-card"
              style={{
                margin: 0,
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
              onClick={() => navigate(tab === 'ASSIGNED' ? (item.isCompleted ? `/assignments/${item.id}?tab=review` : (item.secureMode ? `/assignments/enter/${item.id}` : `/assignments/${item.id}`)) : `/assignments/${item.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.secureMode && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: 'rgba(5, 150, 105, 0.15)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Shield size={11} /> SECURE EXAM
                    </span>
                  )}

                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                    {item.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tab === 'ASSIGNED' && (
                    item.isCompleted ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/assignments/${item.id}?tab=review`); }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669' }}
                      >
                        <Eye size={12} color="#059669" /> Review Responses
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(item.secureMode ? `/assignments/enter/${item.id}` : `/assignments/${item.id}`); }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Play size={11} /> {item.solvedCount > 0 ? 'Resume Assessment' : 'Enter Assessment'}
                      </button>
                    )
                  )}

                  {tab === 'CREATED' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/assignments/${item.id}`); }}
                      >
                        <Eye size={12} /> Review & Manage
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.2rem 0.5rem' }}
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete Assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}

                  <ChevronRight size={15} color="var(--text-muted)" />
                </div>
              </div>

              {/* Metadata Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.775rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                {tab === 'ASSIGNED' ? (
                  <span>Creator: <strong style={{ color: 'var(--text)' }}>{item.creatorName || item.creatorUsername || 'User'}</strong></span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> Assigned: <strong style={{ color: 'var(--text)' }}>{item.assignedUserCount} candidates</strong>
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={13} /> {item.problemCount} Problems
                </span>
                {item.durationMinutes && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {item.durationMinutes} min limit
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> Due: {formatDate(item.dueDate)}
                </span>
                {tab === 'CREATED' && item.flaggedAttemptsCount > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    ⚠️ {item.flaggedAttemptsCount} FLAGGED FOR REVIEW
                  </span>
                )}
                {tab === 'CREATED' && item.completedAttemptsCount > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: '#dcfce7',
                    color: '#166534'
                  }}>
                    ✓ {item.completedAttemptsCount} Completed
                  </span>
                )}
              </div>

              {/* Progress Bar for Assigned Mode */}
              {tab === 'ASSIGNED' && (
                <div style={{ marginTop: '0.15rem' }}>
                  <div style={{ height: '4px', width: '100%', background: 'var(--tag-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.progressPercent || 0}%`,
                      background: item.isCompleted ? '#059669' : 'var(--primary)',
                      transition: 'width 0.2s ease'
                    }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Assignments;
