import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Calendar,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Users,
  ChevronRight,
  ChevronLeft,
  Bell,
  Award,
  Layers,
  Search,
  Check,
  Building2,
  FileText,
  Sliders,
  Send
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Root', label: 'Basic Details', icon: FileText, desc: 'Title, organization, and description' },
  { id: 2, name: 'Trunk', label: 'Timing & Schedule', icon: Clock, desc: 'Dates, duration, and 30m registration cutoff' },
  { id: 3, name: 'Branches', label: 'Problems & Points', icon: BookOpen, desc: 'Curate problems and assign custom points' },
  { id: 4, name: 'Canopy', label: 'Participants & Invites', icon: Users, desc: 'Enrollment capacity and invite candidates' },
  { id: 5, name: 'Foliage', label: 'Scoring & Rules', icon: Award, desc: 'ACM/ICPC ranking and integrity terms' },
  { id: 6, name: 'Seed', label: 'Automated Reminders', icon: Bell, desc: '10-minute reminders and notifications' },
  { id: 7, name: 'Sprout', label: 'Review & Publish', icon: Sparkles, desc: 'Inspect parameters and publish round' }
];

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

function ContestCreate() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [availableProblems, setAvailableProblems] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // STEP 1: Root / Details
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('KODIFY');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // STEP 2: Trunk / Timing
  const [contestType, setContestType] = useState('SCHEDULED'); // SCHEDULED (Type A) or OPEN (Type B)
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [registrationStartTime, setRegistrationStartTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);

  // STEP 3: Branches / Problems
  const [selectedProblems, setSelectedProblems] = useState([
    { problemId: '', points: 100 }
  ]);

  // STEP 4: Canopy / Participants
  const [accessMode, setAccessMode] = useState('PUBLIC'); // PUBLIC or INVITED
  const [maxParticipants, setMaxParticipants] = useState(500);
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // STEP 5: Foliage / Scoring
  const [scoringMethod, setScoringMethod] = useState('ACM_ICPC'); // ACM_ICPC or ACCUMULATED_POINTS
  const [allowHints, setAllowHints] = useState(true);

  // STEP 6: Seed / Notifications
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [sendEmailOnRegister, setSendEmailOnRegister] = useState(true);
  const [sendLiveStartAlert, setSendLiveStartAlert] = useState(true);
  const [sendResultsAlert, setSendResultsAlert] = useState(true);

  // Form submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [probRes, userRes] = await Promise.allSettled([
        axios.get('/api/problems'),
        axios.get('/api/admin/users')
      ]);

      if (probRes.status === 'fulfilled') {
        setAvailableProblems(probRes.value.data || []);
      }
      if (userRes.status === 'fulfilled') {
        setAvailableUsers(userRes.value.data || []);
      }
    } catch (err) {
      console.error("Error loading contest builder data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Live Timing Calculations
  let calculatedDurationMinutes = 0;
  let calculatedDurationText = 'Select start and end times';
  let cutoffNoticeText = '';
  let effectiveDeadline = null;

  if (startTime && endTime) {
    const s = new Date(startTime);
    const e = new Date(endTime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffMs = e.getTime() - s.getTime();
      calculatedDurationMinutes = Math.max(0, Math.round(diffMs / 60000));
      if (calculatedDurationMinutes > 0) {
        const hours = Math.floor(calculatedDurationMinutes / 60);
        const mins = calculatedDurationMinutes % 60;
        calculatedDurationText = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''} (${calculatedDurationMinutes} total minutes)`;

        // Strict 30-minute Cutoff calculation
        const strictCutoff = new Date(s.getTime() - 30 * 60 * 1000);
        effectiveDeadline = strictCutoff;
        cutoffNoticeText = `Registration strictly closes on ${strictCutoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${strictCutoff.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (exactly 30 minutes prior to start).`;
      } else {
        calculatedDurationText = 'End time must be after start time';
      }
    }
  }

  // Problem management
  const handleAddProblemSlot = () => {
    setSelectedProblems(prev => [...prev, { problemId: '', points: 100 }]);
  };

  const handleRemoveProblemSlot = (index) => {
    setSelectedProblems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleProblemChange = (index, field, value) => {
    setSelectedProblems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Participant Invites toggle
  const toggleUserInvite = (userId) => {
    setInvitedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Step Validation
  const validateStep = (step) => {
    setError(null);
    if (step === 1) {
      if (!title.trim()) {
        setError("Contest title is required.");
        return false;
      }
    } else if (step === 2) {
      if (!startTime || !endTime) {
        setError("Start time and End time are required.");
        return false;
      }
      const s = new Date(startTime);
      const e = new Date(endTime);
      if (e <= s) {
        setError("End time must be strictly after start time.");
        return false;
      }
    } else if (step === 3) {
      const valid = selectedProblems.filter(p => p.problemId);
      if (valid.length === 0) {
        setError("Please select at least 1 problem for this contest.");
        return false;
      }
      const ids = valid.map(p => p.problemId);
      if (new Set(ids).size !== ids.length) {
        setError("Duplicate problems detected. Please ensure all assigned problems are distinct.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    try {
      setSubmitting(true);
      const validProblems = selectedProblems.filter(p => p.problemId);

      const localStartTime = toLocalISOString(startTime);
      const localEndTime = toLocalISOString(endTime);
      const localRegStartTime = registrationStartTime ? toLocalISOString(registrationStartTime) : null;
      
      // Auto deadline = 30 minutes before start time
      const autoDeadline = startTime ? toLocalISOString(new Date(new Date(startTime).getTime() - 30 * 60 * 1000)) : null;
      const localRegDeadline = registrationDeadline ? toLocalISOString(registrationDeadline) : (contestType === 'OPEN' ? localEndTime : autoDeadline);

      const payload = {
        title: title.trim(),
        organizationName: organizationName.trim() || 'KODIFY',
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || null,
        contestType,
        accessMode,
        startTime: localStartTime,
        endTime: localEndTime,
        registrationStartTime: localRegStartTime,
        registrationDeadline: localRegDeadline,
        durationMinutes: contestType === 'OPEN' ? parseInt(durationMinutes, 10) || 120 : calculatedDurationMinutes,
        maxParticipants: parseInt(maxParticipants, 10) || 500,
        status: 'PUBLISHED',
        problemIds: validProblems.map(p => Number(p.problemId)),
        problemPoints: validProblems.map(p => Number(p.points) || 100),
        invitedUserIds: accessMode === 'INVITED' ? invitedUserIds : [],
        reminderMinutes: parseInt(reminderMinutes, 10) || 10,
        scoringMethod
      };

      const res = await axios.post('/api/contests', payload);
      if (user?.role === 'ADMIN') {
        navigate('/admin/contests');
      } else {
        navigate(`/contests/${res.data.id || ''}`);
      }
    } catch (err) {
      console.error("Contest creation error:", err);
      setError(err.response?.data?.message || err.response?.data || "Error publishing contest round.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = availableUsers.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)' }}>
              🌳 BANYAN TREE CONTEST STUDIO
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <h1 style={{ margin: '0.3rem 0 0 0', fontWeight: 900, fontSize: '1.65rem', color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>
            Contest Architecture Builder
          </h1>
        </div>

        <Link to="/contests" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={15} /> Exit Studio
        </Link>
      </div>

      {/* BANYAN TREE 7-STEP ORGANIC STEPPER */}
      <div className="dashboard-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', minWidth: '700px', position: 'relative' }}>
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.id);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  flex: 1,
                  position: 'relative',
                  opacity: isCurrent ? 1 : (isDone ? 0.9 : 0.45),
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--primary)' : (isDone ? '#16a34a' : 'var(--bg-hover)'),
                  color: isCurrent || isDone ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  marginBottom: '4px',
                  border: isCurrent ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  boxShadow: isCurrent ? '0 0 10px rgba(0, 129, 167, 0.4)' : 'none'
                }}>
                  {isDone ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary)' : 'var(--text)', textAlign: 'center' }}>
                  {step.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="dashboard-card" style={{ padding: '1.75rem' }}>
        
        {/* ================================================================= */}
        {/* STEP 1: ROOT - DETAILS & BRANDING */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <FileText size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  1. Root & Identification
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Establish the identity, host organization, and narrative for the competitive round.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Contest Title *</label>
                <input
                  type="text"
                  placeholder="e.g. KODIFY National Algorithmic Sprint #14"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Organization / Host Name</label>
                <input
                  type="text"
                  placeholder="e.g. KODIFY Elite / Infosys"
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Banner Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description & Round Overview</label>
              <textarea
                placeholder="Provide contest format guidelines, scoring incentives, and competitor instructions..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: TRUNK - TIMING & SCHEDULE */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Clock size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  2. Trunk: Timing, Schedule & 30m Cutoff
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Configure synchronization modes and server-authoritative time windows.
                </p>
              </div>
            </div>

            {/* CONTEST MODE CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setContestType('SCHEDULED')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: contestType === 'SCHEDULED' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: contestType === 'SCHEDULED' ? 'rgba(0, 129, 167, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: contestType === 'SCHEDULED' ? 'var(--primary)' : 'var(--text)' }}>
                    Mode A: Synchronized Scheduled Round
                  </div>
                  {contestType === 'SCHEDULED' && <CheckCircle2 size={16} color="var(--primary)" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  All registered coders enter the waiting room together and compete simultaneously with synchronized live timers and instant rank fluctuations.
                </p>
              </div>

              <div
                onClick={() => setContestType('OPEN')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: contestType === 'OPEN' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: contestType === 'OPEN' ? 'rgba(0, 175, 185, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: contestType === 'OPEN' ? 'var(--secondary)' : 'var(--text)' }}>
                    Mode B: Open Flexible Window
                  </div>
                  {contestType === 'OPEN' && <CheckCircle2 size={16} color="var(--secondary)" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Contest remains open over a broad multi-day window. Each participant triggers their own fixed timer upon arena entrance.
                </p>
              </div>
            </div>

            {/* TIMING INPUTS */}
            <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Contest Start Time *</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Contest End Time *</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {contestType === 'OPEN' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Individual Attempt Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="600"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(e.target.value)}
                  />
                </div>
              )}

              {/* DURATION BADGE */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 129, 167, 0.12)',
                color: 'var(--primary)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: cutoffNoticeText ? '0.75rem' : 0
              }}>
                <Clock size={16} /> Window Duration: {calculatedDurationText}
              </div>

              {/* 2-DAY CUTOFF NOTIFICATION */}
              {cutoffNoticeText && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fef08a',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <ShieldAlert size={16} /> {cutoffNoticeText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: BRANCHES - PROBLEMS & POINTS */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    3. Branches: Problem Selection & Custom Points
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Select algorithmic problems from the KODIFY problem bank and assign point weights.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddProblemSlot}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
              >
                <Plus size={14} /> Add Problem Slot
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {selectedProblems.map((item, idx) => {
                const selectedProb = availableProblems.find(p => String(p.id) === String(item.problemId));

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 140px 40px',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: 'var(--bg-hover)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'center' }}>
                      Q{idx + 1}
                    </div>

                    <div>
                      <select
                        value={item.problemId}
                        onChange={e => handleProblemChange(idx, 'problemId', e.target.value)}
                        required
                        style={{ fontSize: '0.85rem', width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                      >
                        <option value="">-- Select Problem from Bank --</option>
                        {availableProblems.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.difficulty} • {p.concept || p.category || 'General'})
                          </option>
                        ))}
                      </select>
                      {selectedProb && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Difficulty: <strong>{selectedProb.difficulty}</strong> | Test cases: {selectedProb.testCasesList?.length || 'Configured'}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        placeholder="Points"
                        value={item.points}
                        onChange={e => handleProblemChange(idx, 'points', e.target.value)}
                        style={{ fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                        title="Points awarded for solving this problem"
                      />
                    </div>

                    <div>
                      {selectedProblems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProblemSlot(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove Question"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: CANOPY - PARTICIPANTS & ENROLLMENT */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Users size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  4. Canopy: Participant Enrollment & Invitations
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Control who can register or directly enroll candidates for this contest.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                onClick={() => setAccessMode('PUBLIC')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: accessMode === 'PUBLIC' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: accessMode === 'PUBLIC' ? 'rgba(0, 129, 167, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: accessMode === 'PUBLIC' ? 'var(--primary)' : 'var(--text)', marginBottom: '4px' }}>
                  Public Registration
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Open to all registered KODIFY platform users before the 30-minute registration cutoff.
                </p>
              </div>

              <div
                onClick={() => setAccessMode('INVITED')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: accessMode === 'INVITED' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: accessMode === 'INVITED' ? 'rgba(0, 175, 185, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: accessMode === 'INVITED' ? 'var(--secondary)' : 'var(--text)', marginBottom: '4px' }}>
                  Direct Invitation List
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Pre-enroll selected users directly with automated in-app invitations and emails.
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Participant Capacity Limit</label>
              <input
                type="number"
                min="10"
                max="5000"
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
              />
            </div>

            {/* USER INVITATION PICKER */}
            {accessMode === 'INVITED' && (
              <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                    Selected Candidates ({invitedUserIds.length})
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      style={{ padding: '0.35rem 0.65rem 0.35rem 1.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                    />
                    <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '4px' }}>
                  {filteredUsers.map(u => {
                    const isInvited = invitedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserInvite(u.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: isInvited ? 'rgba(0, 129, 167, 0.12)' : 'var(--card-bg)',
                          border: isInvited ? '1px solid var(--primary)' : '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text)' }}>{u.name || u.username}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>@{u.username} ({u.email})</span>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isInvited ? 'var(--primary)' : 'var(--tag-bg)',
                          color: isInvited ? '#ffffff' : 'var(--text-muted)'
                        }}>
                          {isInvited ? '✓ Invited' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 5: FOLIAGE - SCORING & RULES */}
        {/* ================================================================= */}
        {currentStep === 5 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Award size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  5. Foliage: Scoring Method & Integrity Terms
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Select the leaderboard ranking algorithm and honor code settings.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setScoringMethod('ACM_ICPC')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: scoringMethod === 'ACM_ICPC' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: scoringMethod === 'ACM_ICPC' ? 'rgba(0, 129, 167, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: scoringMethod === 'ACM_ICPC' ? 'var(--primary)' : 'var(--text)', marginBottom: '4px' }}>
                  Standard ACM / ICPC Algorithm
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Ranked by total problems solved DESC, then total points DESC, then lowest elapsed penalty time ASC.
                </p>
              </div>

              <div
                onClick={() => setScoringMethod('ACCUMULATED_POINTS')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: scoringMethod === 'ACCUMULATED_POINTS' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: scoringMethod === 'ACCUMULATED_POINTS' ? 'rgba(0, 175, 185, 0.08)' : 'var(--bg-hover)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: scoringMethod === 'ACCUMULATED_POINTS' ? 'var(--secondary)' : 'var(--text)', marginBottom: '4px' }}>
                  Cumulative Points Scoring
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Ranked primarily by points earned per question test case, supporting partial test case points.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                Competitive Integrity Standard
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>All submissions will be executed inside isolated Docker execution environments.</li>
                <li>Competitors must accept the academic honesty policy before entering the arena.</li>
                <li>Solutions are checked for plagiarism and multi-account violations.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6: SEED - AUTOMATED REMINDERS */}
        {/* ================================================================= */}
        {currentStep === 6 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Bell size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  6. Seed: Automated Reminder Engine
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Configure automatic in-app alerts and email notifications dispatched to competitors.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pre-Contest Reminder Lead Time (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={reminderMinutes}
                  onChange={e => setReminderMinutes(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
                <small style={{ color: 'var(--text-muted)' }}>Default: 10 minutes prior to round start time.</small>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={sendEmailOnRegister}
                    onChange={e => setSendEmailOnRegister(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Send registration confirmation email upon enrollment</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={sendLiveStartAlert}
                    onChange={e => setSendLiveStartAlert(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Send Live round unlock notification when contest begins</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={sendResultsAlert}
                    onChange={e => setSendResultsAlert(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Send final verified leaderboard & rank alert once round ends</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 7: SPROUT - REVIEW & PUBLISH */}
        {/* ================================================================= */}
        {currentStep === 7 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Sparkles size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  7. Sprout: Verification & Final Publish
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Review all architectural parameters before launching this competitive arena.
                </p>
              </div>
            </div>

            {/* SUMMARY CARD */}
            <div style={{ border: '1.5px solid var(--primary)', borderRadius: '10px', padding: '1.5rem', background: 'radial-gradient(ellipse at top, rgba(0, 129, 167, 0.05) 0%, var(--card-bg) 70%)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {organizationName || 'KODIFY'}
                  </span>
                  <h2 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
                    {title}
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)' }}>
                  {contestType === 'SCHEDULED' ? 'SCHEDULED ROUND' : 'OPEN ROUND'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', fontSize: '0.825rem', color: 'var(--text)' }}>
                <div><strong>Start:</strong> {startTime ? new Date(startTime).toLocaleString() : 'TBA'}</div>
                <div><strong>End:</strong> {endTime ? new Date(endTime).toLocaleString() : 'TBA'}</div>
                <div><strong>Duration:</strong> {contestType === 'OPEN' ? `${durationMinutes}m` : calculatedDurationText}</div>
                <div><strong>Problems:</strong> {selectedProblems.filter(p => p.problemId).length} questions</div>
                <div><strong>Capacity:</strong> {maxParticipants} participants</div>
                <div><strong>Scoring:</strong> {scoringMethod}</div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION CONTROLS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, padding: '0.6rem 1.5rem' }}
            >
              Next: {STEPS[currentStep].name} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 900,
                fontSize: '1rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #0081A7 0%, #00AFB9 100%)'
              }}
            >
              <Sparkles size={18} /> {submitting ? 'Publishing Round...' : 'Publish Contest Round 🚀'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default ContestCreate;
