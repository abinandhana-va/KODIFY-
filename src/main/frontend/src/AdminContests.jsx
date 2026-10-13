import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Plus, Edit, Trash2, Users, Clock, Calendar, CheckCircle2, Eye, Building2, UserPlus, X, Award, Sparkles } from 'lucide-react';

function AdminContests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available problems for contest creation/editing
  const [availableProblems, setAvailableProblems] = useState([]);

  // Create / Edit Contest Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContestId, setEditingContestId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    organizationName: 'KODIFY',
    description: '',
    startTime: '',
    endTime: '',
    registrationStartTime: '',
    registrationDeadline: '',
    durationMinutes: 120,
    maxParticipants: 500,
    status: 'PUBLISHED',
    problemIds: [],
    problemPoints: []
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Participant Management Modal State
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedContestForParticipants, setSelectedContestForParticipants] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [newParticipantUsername, setNewParticipantUsername] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/contests');
      setContests(res.data || []);
    } catch (err) {
      console.error("Error loading admin contests:", err);
      setError("Unable to load contests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await axios.get('/api/problems');
      setAvailableProblems(res.data || []);
    } catch (err) {
      console.error("Error fetching problems:", err);
    }
  };

  useEffect(() => {
    fetchContests();
    fetchProblems();
  }, []);

  const openCreateModal = () => {
    setEditingContestId(null);
    setFormData({
      title: '',
      organizationName: 'KODIFY',
      description: '',
      startTime: '',
      endTime: '',
      registrationStartTime: '',
      registrationDeadline: '',
      durationMinutes: 120,
      maxParticipants: 500,
      status: 'PUBLISHED',
      problemIds: [],
      problemPoints: []
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (c) => {
    setEditingContestId(c.id);
    setFormData({
      title: c.title || '',
      organizationName: c.organizationName || 'KODIFY',
      description: c.description || '',
      startTime: c.startTime ? c.startTime.substring(0, 16) : '',
      endTime: c.endTime ? c.endTime.substring(0, 16) : '',
      registrationStartTime: c.registrationStartTime ? c.registrationStartTime.substring(0, 16) : '',
      registrationDeadline: c.registrationDeadline ? c.registrationDeadline.substring(0, 16) : '',
      durationMinutes: c.durationMinutes || 120,
      maxParticipants: c.maxParticipants || 500,
      status: c.status || 'PUBLISHED',
      problemIds: [],
      problemPoints: []
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const toggleProblemSelection = (pId) => {
    setFormData(prev => {
      const exists = prev.problemIds.includes(pId);
      let newIds = exists ? prev.problemIds.filter(id => id !== pId) : [...prev.problemIds, pId];
      let newPoints = newIds.map(() => 100);
      return { ...prev, problemIds: newIds, problemPoints: newPoints };
    });
  };

// Helper to convert input datetime to local ISO format without UTC shift
const toLocalISOString = (dt) => {
  if (!dt) return null;
  if (typeof dt === 'string') {
    if (dt.includes('T')) {
      const clean = dt.replace('Z', '').split('.')[0];
      return clean.length === 16 ? `${clean}:00` : clean;
    }
  }
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Contest title is required.");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setFormError("Start and End time are required.");
      return;
    }

    try {
      setFormSaving(true);
      setFormError(null);

      const localStartTime = toLocalISOString(formData.startTime);
      const localEndTime = toLocalISOString(formData.endTime);
      const localRegStartTime = formData.registrationStartTime ? toLocalISOString(formData.registrationStartTime) : null;
      
      const autoDeadline = formData.startTime ? toLocalISOString(new Date(new Date(formData.startTime).getTime() - 30 * 60 * 1000)) : null;
      const localRegDeadline = formData.registrationDeadline ? toLocalISOString(formData.registrationDeadline) : autoDeadline;

      const payload = {
        title: formData.title.trim(),
        organizationName: formData.organizationName.trim(),
        description: formData.description.trim(),
        startTime: localStartTime,
        endTime: localEndTime,
        registrationStartTime: localRegStartTime,
        registrationDeadline: localRegDeadline,
        durationMinutes: parseInt(formData.durationMinutes, 10) || 120,
        maxParticipants: parseInt(formData.maxParticipants, 10) || 500,
        status: formData.status,
        problemIds: formData.problemIds,
        problemPoints: formData.problemPoints
      };

      if (editingContestId) {
        await axios.put(`/api/admin/contests/${editingContestId}`, payload);
      } else {
        await axios.post('/api/admin/contests', payload);
      }

      setShowFormModal(false);
      fetchContests();
    } catch (err) {
      console.error("Save contest error:", err);
      setFormError(err.response?.data?.message || "Failed to save contest.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (contestId) => {
    if (window.confirm("Are you sure you want to permanently delete this contest? All participant and submission records will be deleted.")) {
      try {
        await axios.delete(`/api/admin/contests/${contestId}`);
        fetchContests();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete contest.");
      }
    }
  };

  // Participant Management
  const openParticipantModal = async (contest) => {
    setSelectedContestForParticipants(contest);
    setShowParticipantModal(true);
    setNewParticipantUsername('');
    fetchParticipants(contest.id);
  };

  const fetchParticipants = async (contestId) => {
    try {
      setLoadingParticipants(true);
      const res = await axios.get(`/api/admin/contests/${contestId}/participants`);
      setParticipantsList(res.data || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipantUsername.trim() || !selectedContestForParticipants) return;

    try {
      setAddingParticipant(true);
      await axios.post(`/api/admin/contests/${selectedContestForParticipants.id}/participants`, {
        username: newParticipantUsername.trim()
      });
      setNewParticipantUsername('');
      fetchParticipants(selectedContestForParticipants.id);
      fetchContests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add participant.");
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    if (window.confirm("Remove this user from the contest?")) {
      try {
        await axios.delete(`/api/admin/contests/${selectedContestForParticipants.id}/participants/${userId}`);
        fetchParticipants(selectedContestForParticipants.id);
        fetchContests();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to remove participant.");
      }
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

  // Metric stats
  const totalContests = contests.length;
  const upcomingCount = contests.filter(c => c.status === 'UPCOMING').length;
  const ongoingCount = contests.filter(c => c.status === 'ONGOING').length;
  const completedCount = contests.filter(c => c.status === 'COMPLETED').length;
  const totalParticipants = contests.reduce((sum, c) => sum + (c.participantCount || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* STATS OVERVIEW */}
      <div className="admin-stats-grid">
        <div className="dashboard-card" style={{ borderTop: '3px solid var(--primary)', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Contests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{totalContests}</div>
        </div>
        <div className="dashboard-card" style={{ borderTop: '3px solid #38bdf8', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>{upcomingCount}</div>
        </div>
        <div className="dashboard-card" style={{ borderTop: '3px solid #ef4444', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active / Ongoing</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{ongoingCount}</div>
        </div>
        <div className="dashboard-card" style={{ borderTop: '3px solid #16a34a', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{completedCount}</div>
        </div>
        <div className="dashboard-card" style={{ borderTop: '3px solid var(--secondary)', margin: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Participants</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>{totalParticipants}</div>
        </div>
      </div>

      <div className="dashboard-card">
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={22} color="var(--primary)" /> Official Contest Management
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Host, configure, and manage official coding challenges and participants.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/contests/create')}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '0.55rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
            >
              <Sparkles size={16} /> Create Contest (Banyan Tree Studio)
            </button>
            <button
              onClick={openCreateModal}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.55rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Quick Modal
            </button>
          </div>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading contest records...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && contests.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No contests created yet. Click "Host Official Contest" to create one.
          </p>
        )}

        {!loading && !error && contests.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization & Title</th>
                  <th>Schedule</th>
                  <th>Reg. Cutoff</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th>Participants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} color="var(--primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {c.organizationName || 'KODIFY'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{c.title}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div><strong>Start:</strong> {formatDateTime(c.startTime)}</div>
                      <div style={{ color: 'var(--text-muted)' }}><strong>End:</strong> {formatDateTime(c.endTime)}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(c.registrationDeadline)}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {c.durationMinutes ? `${Math.round(c.durationMinutes / 60 * 10) / 10}h` : '--'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: c.status === 'ONGOING' ? 'rgba(239, 68, 68, 0.15)' : (c.status === 'UPCOMING' ? 'rgba(2, 132, 199, 0.15)' : 'var(--tag-bg)'),
                        color: c.status === 'ONGOING' ? '#dc2626' : (c.status === 'UPCOMING' ? '#0284c7' : 'var(--text-muted)')
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {c.questionCount || 0} Qs
                    </td>
                    <td>
                      <button
                        onClick={() => openParticipantModal(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--secondary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                        title="Manage Participants"
                      >
                        <Users size={14} /> {c.participantCount || 0} users
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="admin-btn"
                          style={{ padding: '0.35rem 0.55rem', background: 'var(--primary)' }}
                          onClick={() => openEditModal(c)}
                          title="Edit Contest"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="admin-btn"
                          style={{ padding: '0.35rem 0.55rem', background: 'var(--secondary)' }}
                          onClick={() => openParticipantModal(c)}
                          title="Manage Participants"
                        >
                          <Users size={13} />
                        </button>
                        <Link
                          to={`/contests/${c.id}/leaderboard`}
                          className="admin-btn"
                          style={{ padding: '0.35rem 0.55rem', background: '#d97706' }}
                          title="View Contest Leaderboard"
                        >
                          <Trophy size={13} />
                        </Link>
                        <button
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '0.35rem 0.55rem' }}
                          onClick={() => handleDelete(c.id)}
                          title="Delete Contest"
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

      {/* CREATE / EDIT CONTEST MODAL (STEPPER WIZARD) */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  CONTEST BUILDER WIZARD
                </div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)' }}>
                  {editingContestId ? 'Edit Official Contest' : 'Host Official Contest'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTEST MODAL STEPPER */}
            <div className="wizard-stepper" style={{ marginBottom: '1.25rem' }}>
              {[
                { num: 1, label: 'Details & Org' },
                { num: 2, label: 'Schedule & Limits' },
                { num: 3, label: 'Questions & Points' },
                { num: 4, label: 'Review & Publish' }
              ].map(st => (
                <div
                  key={st.num}
                  className={`wizard-step-node ${(formData.wizardStep || 1) === st.num ? 'active' : ((formData.wizardStep || 1) > st.num ? 'completed' : '')}`}
                  onClick={() => setFormData(prev => ({ ...prev, wizardStep: st.num }))}
                >
                  <span className="step-badge">{(formData.wizardStep || 1) > st.num ? '✓' : st.num}</span>
                  <span className="step-label">{st.label}</span>
                </div>
              ))}
            </div>

            {formError && <div className="error-msg" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              {/* STEP 1: DETAILS & ORG */}
              {(!formData.wizardStep || formData.wizardStep === 1) && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Contest Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., KODIFY Grand Algorithmic Challenge"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Organized By *</label>
                      <input
                        type="text"
                        placeholder="e.g., ABC Technologies"
                        value={formData.organizationName}
                        onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description & Eligibility</label>
                    <textarea
                      rows="3"
                      placeholder="Official contest guidelines, candidate eligibility, and scoring rules..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Initial Contest Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="PUBLISHED">PUBLISHED (Visible to Platform)</option>
                      <option value="DRAFT">DRAFT (Hidden)</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: SCHEDULE & LIMITS */}
              {formData.wizardStep === 2 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Contest Start Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Contest End Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Registration Opening Time</label>
                      <input
                        type="datetime-local"
                        value={formData.registrationStartTime}
                        onChange={e => setFormData({ ...formData, registrationStartTime: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Registration Deadline (Cutoff)</label>
                      <input
                        type="datetime-local"
                        value={formData.registrationDeadline}
                        onChange={e => setFormData({ ...formData, registrationDeadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Duration (Minutes)</label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Max Candidate Capacity</label>
                      <input
                        type="number"
                        value={formData.maxParticipants}
                        onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: QUESTIONS & POINTS */}
              {formData.wizardStep === 3 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>
                      Select Contest Assessment Problems ({formData.problemIds.length} Selected)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Pool: {availableProblems.length} problems
                    </span>
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem', background: 'var(--input-bg)' }}>
                    {availableProblems.map(p => {
                      const isSelected = formData.problemIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProblemSelection(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                            fontSize: '0.825rem',
                            marginBottom: '2px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: 'auto' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>#{p.id}. {p.title}</span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: p.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (p.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                            color: p.difficulty === 'EASY' ? '#16a34a' : (p.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                          }}>
                            {p.difficulty}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & PUBLISH */}
              {formData.wizardStep === 4 && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)', display: 'grid', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Contest Title</div>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.title || '--'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Organization</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formData.organizationName || '--'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Selected Questions</div>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.problemIds.length} Questions</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Duration / Capacity</div>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.durationMinutes}m / {formData.maxParticipants} users</div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div><strong>Starts:</strong> {formatDateTime(formData.startTime)}</div>
                      <div><strong>Ends:</strong> {formatDateTime(formData.endTime)}</div>
                      {formData.registrationDeadline && <div><strong>Reg Deadline:</strong> {formatDateTime(formData.registrationDeadline)}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL WIZARD CONTROLS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!formData.wizardStep || formData.wizardStep === 1}
                  onClick={() => setFormData(prev => ({ ...prev, wizardStep: Math.max((prev.wizardStep || 1) - 1, 1) }))}
                  style={{ opacity: (!formData.wizardStep || formData.wizardStep === 1) ? 0.5 : 1, padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Previous
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowFormModal(false)}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>

                  {(!formData.wizardStep || formData.wizardStep < 4) ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setFormData(prev => ({ ...prev, wizardStep: Math.min((prev.wizardStep || 1) + 1, 4) }))}
                      style={{ padding: '0.4rem 1.1rem', fontSize: '0.8rem' }}
                    >
                      Next Step &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formSaving}
                      style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, background: '#16a34a' }}
                    >
                      {formSaving ? 'Saving...' : (editingContestId ? 'Update Contest' : 'Publish Contest')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS MANAGEMENT MODAL */}
      {showParticipantModal && selectedContestForParticipants && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={20} color="var(--primary)" /> Manage Contest Participants
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Contest: <strong>{selectedContestForParticipants.title}</strong>
                </span>
              </div>
              <button
                onClick={() => setShowParticipantModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ADD PARTICIPANT FORM */}
            <form onSubmit={handleAddParticipant} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Enter username to enroll into contest..."
                value={newParticipantUsername}
                onChange={e => setNewParticipantUsername(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text)' }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                disabled={addingParticipant}
              >
                <UserPlus size={15} /> Add User
              </button>
            </form>

            {loadingParticipants ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading participants...</p>
            ) : participantsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No users currently registered for this contest.</p>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Registered At</th>
                      <th>Problems Solved</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantsList.map(p => (
                      <tr key={p.userId}>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>@{p.username}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({p.name})</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(p.registeredAt)}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {p.problemsSolved || 0} Qs
                        </td>
                        <td style={{ fontWeight: 700, color: '#d97706' }}>
                          {p.score || 0} pts
                        </td>
                        <td>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleRemoveParticipant(p.userId)}
                            title="Remove from contest"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContests;
