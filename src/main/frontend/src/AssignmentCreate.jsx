import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import {
  ClipboardList,
  Search,
  Check,
  Users,
  BookOpen,
  Calendar,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  UploadCloud,
  AlertTriangle,
  Clock3,
  XCircle,
  HelpCircle,
  Info,
  Sparkles,
  Plus,
  Code2,
  CheckSquare,
  Layers,
  Trash2,
  X
} from 'lucide-react';
import DateTimeQuickControl from './components/DateTimeQuickControl';
import BanyanProgressNav from './components/BanyanProgressNav';
import ContextualNote from './components/ContextualNote';
import { KolamMotif, WaveDivider } from './components/AmbientArt';
import QuestionImageUploader from './components/QuestionImageUploader';
import { ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { SUPPORTED_LANGUAGES, DEFAULT_ALLOWED_LANGUAGES } from './utils/languageRegistry';
import { toLocalIsoPayload, formatDateTime, formatDate } from './utils/dateUtils';

function AssignmentCreate() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Creator Verification State
  const [verificationStatus, setVerificationStatus] = useState(null); // 'NOT_VERIFIED', 'PENDING', 'OTP_PENDING', 'HOST_VERIFIED', 'REJECTED'
  const [verificationData, setVerificationData] = useState(null);
  const [verifyingCreator, setVerifyingCreator] = useState(true);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // OTP Verification State
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verification Form State
  const [applyForm, setApplyForm] = useState({
    username: user?.username || '',
    fullName: user?.name || '',
    email: user?.email || '',
    phoneNumber: '',
    organizationId: '',
    organizationName: '',
    organizationWebsite: ''
  });
  const [govId1File, setGovId1File] = useState(null);
  const [govId2File, setGovId2File] = useState(null);
  const [memberProofFile, setMemberProofFile] = useState(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Assignment Wizard States
  const [step, setStep] = useState(1); // 1: Details, 2: Questions, 3: Candidates, 4: Security, 5: Review
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [secureMode, setSecureMode] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [allowedAttempts, setAllowedAttempts] = useState(1);

  const [availableProblems, setAvailableProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]); // array of problem IDs
  const [problemSearch, setProblemSearch] = useState('');

  // Custom Question Creator Modal State (MCQ & Coding)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionModalTab, setQuestionModalTab] = useState('MCQ'); // 'MCQ' or 'CODING'
  const [newQuestionForm, setNewQuestionForm] = useState({
    title: '',
    concept: 'General',
    difficulty: 'Medium',
    description: '',
    constraints: 'Standard constraints apply.',
    points: 100,
    imageUrl: '',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctOption: 'Option A',
    explanation: '',
    starterCodeC: '#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    printf("Hello Kodify\\n");\n    return 0;\n}\n',
    starterCodePython: '# Write your Python solution here\ndef solution():\n    pass\n',
    starterCodeJava: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your Java solution here\n    }\n}\n',
    solutionC: '',
    solutionPython: '',
    solutionJava: '',
    solution: '',
    editorial: '',
    allowedLanguages: [...DEFAULT_ALLOWED_LANGUAGES],
    testCases: [{ input: '1\n', expectedOutput: '1\n', hidden: false }]
  });
  const [creatingCustomQuestion, setCreatingCustomQuestion] = useState(false);
  const [customQuestionError, setCustomQuestionError] = useState(null);
  const [customQuestionSuccess, setCustomQuestionSuccess] = useState(null);

  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user IDs
  const [userSearch, setUserSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const WIZARD_STEPS = [
    { id: 1, title: 'Details', subtitle: 'Title & Schedule' },
    { id: 2, title: `Questions (${selectedProblems.length})`, subtitle: 'Challenges & MCQs' },
    { id: 3, title: `Candidates (${selectedUsers.length})`, subtitle: 'Assigned Users' },
    { id: 4, title: 'Security', subtitle: 'Proctoring & Timers' },
    { id: 5, title: 'Review & Publish', subtitle: 'Final Summary' }
  ];

  useEffect(() => {
    checkCreatorStatus();
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const checkCreatorStatus = async () => {
    try {
      setVerifyingCreator(true);
      const res = await axios.get('/api/creator-verification/status');
      const st = res.data.status || 'NOT_VERIFIED';
      setVerificationStatus(st);
      setVerificationData(res.data);
      if (user?.role === 'ADMIN' || st === 'HOST_VERIFIED' || st === 'APPROVED' || res.data.approved || res.data.hostVerified) {
        setVerificationStatus('HOST_VERIFIED');
        loadResources();
      }
    } catch (err) {
      console.error("Host status check error:", err);
      if (user?.role === 'ADMIN') {
        setVerificationStatus('HOST_VERIFIED');
        loadResources();
      } else {
        setVerificationStatus('NOT_VERIFIED');
      }
    } finally {
      setVerifyingCreator(false);
    }
  };

  const handleApplyVerification = async (e) => {
    e.preventDefault();
    if (!applyForm.fullName || !applyForm.fullName.trim()) {
      setVerificationError("Full name is required.");
      return;
    }
    if (!applyForm.email || !applyForm.email.trim()) {
      setVerificationError("Contact email is required.");
      return;
    }
    if (!applyForm.phoneNumber || applyForm.phoneNumber.trim().length < 7) {
      setVerificationError("Please enter a valid phone number (7-20 digits).");
      return;
    }
    if (!applyForm.organizationName || !applyForm.organizationName.trim()) {
      setVerificationError("Organization name is required.");
      return;
    }
    if (!govId1File) {
      setVerificationError("Government ID Document 1 is required.");
      return;
    }
    if (!govId2File) {
      setVerificationError("Government ID Document 2 is required.");
      return;
    }
    if (!memberProofFile) {
      setVerificationError("Member proof is required.");
      return;
    }

    try {
      setSubmittingVerification(true);
      setVerificationError(null);
      const formData = new FormData();
      formData.append('username', user?.username || applyForm.username);
      formData.append('fullName', applyForm.fullName);
      formData.append('contactEmail', applyForm.email);
      formData.append('phoneNumber', applyForm.phoneNumber);
      formData.append('organizationName', applyForm.organizationName);
      if (applyForm.organizationId) formData.append('organizationId', applyForm.organizationId);
      if (applyForm.organizationWebsite) formData.append('organizationWebsite', applyForm.organizationWebsite);
      formData.append('governmentId1', govId1File);
      formData.append('governmentId2', govId2File);
      formData.append('memberProof', memberProofFile);

      const res = await axios.post('/api/creator-verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVerificationSuccess(true);
      setVerificationStatus(res.data.status || 'PENDING');
      setVerificationData(res.data);
      setIsResubmitting(false);
    } catch (err) {
      console.error("Verification submit error:", err);
      setVerificationError(err.response?.data?.message || err.response?.data || "Failed to submit host verification request.");
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP code.");
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError(null);
      const res = await axios.post('/api/host-verifications/verify-otp', {
        otpCode: otpInput.trim()
      });

      setVerificationStatus('HOST_VERIFIED');
      setVerificationData(res.data);
      setVerificationSuccess(true);
      loadResources();
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtpError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendingOtp(true);
      setOtpError(null);
      await axios.post('/api/host-verifications/resend-otp');
      setResendCooldown(60);
      alert("A new 6-digit OTP has been sent to your registered email address.");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendingOtp(false);
    }
  };

  const loadResources = async () => {
    try {
      setFetching(true);
      const [problemsRes, usersRes] = await Promise.allSettled([
        axios.get('/api/problems'),
        axios.get('/api/leaderboard')
      ]);

      if (problemsRes.status === 'fulfilled') {
        setAvailableProblems(problemsRes.value.data || []);
      }
      if (usersRes.status === 'fulfilled') {
        setAvailableUsers(usersRes.value.data || []);
      }
    } catch (err) {
      console.error("Error loading resources:", err);
    } finally {
      setFetching(false);
    }
  };

  const toggleProblem = (id) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const handleSaveCustomQuestion = async (e) => {
    if (e) e.preventDefault();
    if (!newQuestionForm.title.trim()) {
      setCustomQuestionError("Question title is required.");
      return;
    }
    if (!newQuestionForm.description.trim()) {
      setCustomQuestionError("Question statement / description is required.");
      return;
    }
    if (questionModalTab === 'MCQ') {
      const validOptions = newQuestionForm.options.filter(o => o && o.trim());
      if (validOptions.length < 2) {
        setCustomQuestionError("At least 2 non-empty options are required for MCQ.");
        return;
      }
      if (!newQuestionForm.correctOption || !newQuestionForm.correctOption.trim()) {
        setCustomQuestionError("Please specify the correct option.");
        return;
      }
    } else {
      if (!newQuestionForm.allowedLanguages || newQuestionForm.allowedLanguages.length === 0) {
        setCustomQuestionError("Select at least one programming language.");
        return;
      }
      const validTcs = newQuestionForm.testCases.filter(tc => tc.input && tc.input.trim() && tc.expectedOutput && tc.expectedOutput.trim());
      if (validTcs.length === 0) {
        setCustomQuestionError("Please add at least one testcase with valid input and expected output.");
        return;
      }
    }

    try {
      setCreatingCustomQuestion(true);
      setCustomQuestionError(null);
      const payload = {
        questionType: questionModalTab,
        title: newQuestionForm.title.trim(),
        concept: newQuestionForm.concept.trim() || 'General',
        difficulty: newQuestionForm.difficulty,
        description: newQuestionForm.description.trim(),
        constraints: newQuestionForm.constraints.trim(),
        points: Number(newQuestionForm.points) || 100,
        imageUrl: newQuestionForm.imageUrl ? newQuestionForm.imageUrl.trim() : null,
        options: questionModalTab === 'MCQ' ? newQuestionForm.options.map(o => o.trim()).filter(Boolean) : [],
        correctOption: questionModalTab === 'MCQ' ? newQuestionForm.correctOption.trim() : null,
        explanation: newQuestionForm.explanation.trim(),
        allowedLanguages: questionModalTab === 'CODING' ? newQuestionForm.allowedLanguages : [],
        starterCodeC: newQuestionForm.starterCodeC,
        starterCodePython: newQuestionForm.starterCodePython,
        starterCodeJava: newQuestionForm.starterCodeJava,
        starterCodeCpp: newQuestionForm.starterCodeCpp,
        starterCodeJs: newQuestionForm.starterCodeJs,
        starterCodeGo: newQuestionForm.starterCodeGo,
        starterCodeRust: newQuestionForm.starterCodeRust,
        solutionC: newQuestionForm.solutionC,
        solutionPython: newQuestionForm.solutionPython,
        solutionJava: newQuestionForm.solutionJava,
        solution: newQuestionForm.solution,
        editorial: newQuestionForm.editorial || newQuestionForm.explanation,
        testCasesList: questionModalTab === 'CODING' ? newQuestionForm.testCases.map(tc => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          hidden: !!tc.hidden
        })) : []
      };

      const res = await axios.post('/api/assignments/questions/custom', payload);
      const created = res.data;

      setAvailableProblems(prev => [created, ...prev]);
      setSelectedProblems(prev => Array.from(new Set([...prev, created.id])));
      setCustomQuestionSuccess("Question created and added to assignment!");
      setTimeout(() => {
        setShowQuestionModal(false);
        setCustomQuestionSuccess(null);
        setNewQuestionForm({
          title: '',
          concept: 'General',
          difficulty: 'Medium',
          description: '',
          constraints: 'Standard constraints apply.',
          points: 100,
          imageUrl: '',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOption: 'Option A',
          explanation: '',
          starterCodeC: '#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    printf("Hello Kodify\\n");\n    return 0;\n}\n',
          starterCodePython: '# Write your Python solution here\ndef solution():\n    pass\n',
          starterCodeJava: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your Java solution here\n    }\n}\n',
          solutionC: '',
          solutionPython: '',
          solutionJava: '',
          solution: '',
          editorial: '',
          allowedLanguages: [...DEFAULT_ALLOWED_LANGUAGES],
          testCases: [{ input: '1\n', expectedOutput: '1\n', hidden: false }]
        });
      }, 700);
    } catch (err) {
      console.error("Custom question create error:", err);
      setCustomQuestionError(err.response?.data?.message || "Failed to create question.");
    } finally {
      setCreatingCustomQuestion(false);
    }
  };

  const validateStep = () => {
    setError(null);
    if (step === 1 && !title.trim()) {
      setError("Please provide an assignment title.");
      return false;
    }
    if (step === 2 && selectedProblems.length === 0) {
      setError("Please select at least one coding problem.");
      return false;
    }
    if (step === 3 && selectedUsers.length === 0) {
      setError("Please select at least one candidate user.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }
    if (selectedProblems.length === 0) {
      setError("Please select at least one problem to include.");
      return;
    }
    if (selectedUsers.length === 0) {
      setError("Please select at least one user to assign.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        startTime: startTime ? toLocalIsoPayload(startTime) : null,
        dueDate: dueDate ? toLocalIsoPayload(dueDate) : null,
        problemIds: selectedProblems,
        problemPoints: selectedProblems.map(() => 100),
        userIds: selectedUsers,
        secureMode: !!secureMode,
        durationMinutes: Number(durationMinutes) || 60,
        allowedAttempts: Number(allowedAttempts) || 1,
        status: "ACTIVE"
      };

      await axios.post('/api/assignments', payload);
      navigate('/assignments');
    } catch (err) {
      console.error("Create assignment error:", err);
      setError(err.response?.data?.message || "Failed to create assignment.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = availableProblems.filter(p =>
    (p.title || '').toLowerCase().includes(problemSearch.toLowerCase()) ||
    (p.concept || '').toLowerCase().includes(problemSearch.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(u =>
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  // RENDER: Verifying initial creator status
  if (verifyingCreator) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        <p>Checking host authorization status...</p>
      </div>
    );
  }

  // RENDER: Host Verification Required View
  if (verificationStatus !== 'HOST_VERIFIED' && user?.role !== 'ADMIN') {
    return (
      <div className="kodify-workspace-2col">
        {/* Main Verification Card */}
        <div className="dashboard-card animate-fade-in" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 129, 167, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                Host Verification Application
              </h2>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Verify once to host proctored exams, create assignments, and evaluate candidates permanently.
              </p>
            </div>
          </div>

          <WaveDivider height={16} opacity={0.3} style={{ marginBottom: '1rem' }} />

          {/* STATUS: OTP_PENDING / ADMIN_APPROVED */}
          {(verificationStatus === 'OTP_PENDING' || verificationStatus === 'ADMIN_APPROVED' || verificationData?.otpPending) && !isResubmitting && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '1.75rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#16a34a' }}>
                <CheckCircle2 size={28} />
              </div>
              <span className="badge" style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Admin Approved &bull; Final Step
              </span>
              <h3 style={{ margin: '10px 0 6px 0', fontSize: '1.25rem', color: '#14532d', fontWeight: 800 }}>
                Enter 6-Digit Email OTP
              </h3>
              <p style={{ margin: '0 auto 1.25rem auto', maxWidth: '480px', fontSize: '0.85rem', color: '#166534', lineHeight: '1.5' }}>
                Your organization documents have been reviewed and approved! We sent a 6-digit verification OTP to <strong>{verificationData?.contactEmail || user?.email}</strong>. Enter it below to activate your Host privileges permanently.
              </p>

              {otpError && (
                <div className="error-msg" style={{ maxWidth: '400px', margin: '0 auto 1rem auto', textAlign: 'center' }}>
                  {otpError}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  style={{
                    width: '240px',
                    fontSize: '1.75rem',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid var(--primary)',
                    background: '#ffffff',
                    color: 'var(--text)'
                  }}
                  autoFocus
                  required
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="submit"
                    disabled={verifyingOtp || otpInput.length !== 6}
                    className="btn btn-primary"
                    style={{ fontWeight: 700, padding: '8px 20px', minWidth: '160px' }}
                  >
                    {verifyingOtp ? "Verifying..." : "Verify & Activate Host"}
                  </button>

                  <button
                    type="button"
                    disabled={resendingOtp || resendCooldown > 0}
                    onClick={handleResendOtp}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : (resendingOtp ? "Sending..." : "Resend OTP")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STATUS: PENDING */}
          {verificationStatus === 'PENDING' && !isResubmitting && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
              <Clock3 size={32} color="#d97706" style={{ margin: '0 auto 8px auto' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#92400e', fontWeight: 800 }}>Verification Request Under Review</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: '#78350f', lineHeight: '1.5' }}>
                Your host verification documents are currently being evaluated by the platform administrator. You will receive an email with an OTP once approved.
              </p>
              <button
                type="button"
                onClick={() => setIsResubmitting(true)}
                className="btn btn-secondary btn-sm"
              >
                Update Documents
              </button>
            </div>
          )}

          {/* STATUS: REJECTED */}
          {verificationStatus === 'REJECTED' && !isResubmitting && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
              <XCircle size={32} color="#dc2626" style={{ margin: '0 auto 8px auto' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#991b1b', fontWeight: 800 }}>Verification Rejected</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: '#7f1d1d', lineHeight: '1.5' }}>
                {verificationData?.adminComment || "The submitted identification documents did not meet verification criteria."}
              </p>
              <button
                type="button"
                onClick={() => setIsResubmitting(true)}
                className="btn btn-primary btn-sm"
              >
                Resubmit Application
              </button>
            </div>
          )}

          {/* FORM: NOT_VERIFIED or RESUBMITTING */}
          {(verificationStatus === 'NOT_VERIFIED' || verificationStatus === 'NOT_SUBMITTED' || !verificationStatus || isResubmitting) && (
            <form onSubmit={handleApplyVerification}>
              {verificationError && (
                <div className="error-msg" style={{ marginBottom: '1rem' }}>
                  {verificationError}
                </div>
              )}

              <div className="form-row-2col">
                <div className="form-group-compact">
                  <label>1. Username</label>
                  <input
                    type="text"
                    value={user?.username || applyForm.username}
                    disabled
                    style={{ background: 'var(--bg-hover)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                  />
                </div>

                <div className="form-group-compact">
                  <label>2. Full Name <span className="label-required">*</span></label>
                  <input
                    type="text"
                    value={applyForm.fullName}
                    onChange={e => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. K. Raman"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group-compact">
                  <label>3. Official Organization Email <span className="label-required">*</span></label>
                  <input
                    type="email"
                    value={applyForm.email}
                    onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                    placeholder="educator@university.edu"
                    required
                  />
                </div>

                <div className="form-group-compact">
                  <label>4. Phone Number <span className="label-required">*</span></label>
                  <input
                    type="tel"
                    value={applyForm.phoneNumber}
                    onChange={e => setApplyForm({ ...applyForm, phoneNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group-compact">
                  <label>5. Organization ID / Code</label>
                  <input
                    type="text"
                    value={applyForm.organizationId}
                    onChange={e => setApplyForm({ ...applyForm, organizationId: e.target.value })}
                    placeholder="e.g. ORG-2026-IITM"
                  />
                </div>

                <div className="form-group-compact">
                  <label>6. Organization Website</label>
                  <input
                    type="url"
                    value={applyForm.organizationWebsite}
                    onChange={e => setApplyForm({ ...applyForm, organizationWebsite: e.target.value })}
                    placeholder="https://www.institution.edu"
                  />
                </div>
              </div>

              <div className="form-group-compact">
                <label>7. Organization / University Name <span className="label-required">*</span></label>
                <input
                  type="text"
                  value={applyForm.organizationName}
                  onChange={e => setApplyForm({ ...applyForm, organizationName: e.target.value })}
                  placeholder="e.g. Anna University / National Institute of Technology"
                  required
                />
              </div>

              <div className="form-row-2col" style={{ marginTop: '0.5rem' }}>
                <div className="form-group-compact">
                  <label><UploadCloud size={14} color="var(--primary)" /> 6. Government ID 1 <span className="label-required">*</span></label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={e => setGovId1File(e.target.files?.[0] || null)}
                    required
                  />
                  <span className="form-hint-text">Passport, National ID, Voter ID, or PAN (PDF/PNG/JPG).</span>
                </div>

                <div className="form-group-compact">
                  <label><UploadCloud size={14} color="var(--primary)" /> 7. Government ID 2 <span className="label-required">*</span></label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={e => setGovId2File(e.target.files?.[0] || null)}
                    required
                  />
                  <span className="form-hint-text">Secondary Government ID or Driving License.</span>
                </div>
              </div>

              <div className="form-group-compact" style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                <label><UploadCloud size={14} color="var(--primary)" /> 8. Member / Organization Proof PDF <span className="label-required">*</span></label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={e => setMemberProofFile(e.target.files?.[0] || null)}
                  required
                />
                <span className="form-hint-text">Compulsory: Institutional ID card, faculty letter, or official affiliation proof in PDF format.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {isResubmitting && (
                  <button
                    type="button"
                    onClick={() => setIsResubmitting(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, padding: '0.55rem 1.25rem' }}
                >
                  {submittingVerification ? 'Submitting Application...' : 'Submit Host Verification Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side Guidance Panel */}
        <div className="kodify-right-rail">
          <ContextualNote type="security" title="One-Time Verification">
            Host verification provides permanent educator & creator privileges on KODIFY. Once verified, you can launch unlimited assignments.
          </ContextualNote>

          <ContextualNote type="info" title="Accepted Document Types">
            • Government ID 1 & 2: PDF, PNG, JPG, JPEG, WEBP (Max 10MB each)<br />
            • Member Proof: Strictly PDF format with valid institutional affiliation.
          </ContextualNote>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <KolamMotif size={48} opacity={0.3} color="var(--primary)" />
          </div>
        </div>
      </div>
    );
  }

  // RENDER: 3-Column Assignment Creation Wizard
  return (
    <div className="kodify-workspace-3col animate-fade-in">
      {/* =========================================================
          LEFT RAIL: BANYAN CULTURAL PROGRESSION PATH
      ========================================================= */}
      <div className="kodify-left-rail">
        <button
          onClick={() => navigate('/assignments')}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <ArrowLeft size={14} /> Back to Assignments
        </button>

        <BanyanProgressNav
          steps={WIZARD_STEPS}
          activeStep={step}
          onStepClick={(sId) => {
            if (sId < step || validateStep()) {
              setStep(sId);
            }
          }}
          completedSteps={Array.from({ length: step - 1 }, (_, i) => i + 1)}
        />

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <KolamMotif size={36} opacity={0.3} color="var(--primary)" />
        </div>
      </div>

      {/* =========================================================
          CENTER PANE: WIZARD FORM CONTENT
      ========================================================= */}
      <div className="kodify-center-pane">
        <div className="dashboard-card" style={{ padding: '1.5rem' }}>
          {error && (
            <div className="error-msg" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    Assignment Details & Schedule
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Define title, educational objectives, and assessment time windows.
                  </p>
                </div>
                <span className="verification-status-pill approved" style={{ fontSize: '0.7rem' }}>
                  <CheckCircle2 size={12} /> Host Verified
                </span>
              </div>

              <WaveDivider height={12} opacity={0.25} style={{ marginBottom: '1rem' }} />

              <div className="form-group-compact">
                <label>Assignment Title <span className="label-required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Algorithms Lab: Dynamic Programming & Graphs"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <span className="form-hint-text">Choose a descriptive title candidates will easily recognize.</span>
              </div>

              <div className="form-group-compact">
                <label>Description & Learning Objectives</label>
                <textarea
                  rows="3"
                  placeholder="Instructions, guidelines, or prerequisites for assignees..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row-2col" style={{ marginTop: '0.5rem' }}>
                <DateTimeQuickControl
                  label="Start Date & Time (Optional)"
                  value={startTime}
                  onChange={setStartTime}
                  helperText="Leave empty to make accessible immediately upon publishing."
                />

                <DateTimeQuickControl
                  label="Due Date & Time (Optional)"
                  value={dueDate}
                  onChange={setDueDate}
                  min={startTime || undefined}
                  helperText="Assignees will not be able to start attempts after the deadline."
                />
              </div>
            </div>
          )}

          {/* STEP 2: QUESTIONS */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    Assignment Questions & Challenges
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {selectedProblems.length} challenge{selectedProblems.length !== 1 ? 's' : ''} selected. Pick existing questions or author new MCQs / programming questions.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionModalTab('MCQ');
                      setShowQuestionModal(true);
                      setCustomQuestionError(null);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.775rem' }}
                  >
                    <Plus size={14} /> Create New Question
                  </button>

                  <div style={{ position: 'relative', width: '180px' }}>
                    <input
                      type="text"
                      placeholder="Filter challenges..."
                      value={problemSearch}
                      onChange={e => setProblemSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.35rem 0.6rem 0.35rem 1.6rem', fontSize: '0.775rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                    <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* Ordered Questions Tree (Banyan Branches) */}
              {selectedProblems.length > 0 && (
                <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} color="var(--primary)" /> Configured Question Sequence & Order
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Points: {selectedProblems.reduce((acc, pId) => {
                        const prob = availableProblems.find(p => p.id === pId);
                        return acc + 100;
                      }, 0)} pts
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    {selectedProblems.map((pId, idx) => {
                      const prob = availableProblems.find(p => p.id === pId);
                      if (!prob) return null;
                      const isMCQ = prob.questionType === 'MCQ';

                      return (
                        <div
                          key={pId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--bg-card, #1e1e24)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem' }}>
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              background: 'var(--primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: isMCQ ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 129, 167, 0.15)',
                              color: isMCQ ? '#8b5cf6' : '#0081a7'
                            }}>
                              {isMCQ ? 'MCQ' : 'CODING'}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {prob.title}
                            </span>
                            {prob.imageUrl && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: '#10b981' }}>
                                <ImageIcon size={12} /> Diagram
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                setSelectedProblems(prev => {
                                  const updated = [...prev];
                                  const temp = updated[idx - 1];
                                  updated[idx - 1] = updated[idx];
                                  updated[idx] = temp;
                                  return updated;
                                });
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                              title="Move Question Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedProblems.length - 1}
                              onClick={() => {
                                setSelectedProblems(prev => {
                                  const updated = [...prev];
                                  const temp = updated[idx + 1];
                                  updated[idx + 1] = updated[idx];
                                  updated[idx] = temp;
                                  return updated;
                                });
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                              title="Move Question Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleProblem(pId)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                              title="Remove Question"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
                All Available Problems & Question Pool ({filteredProblems.length})
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.35rem', background: 'var(--input-bg)' }}>
                {filteredProblems.map(p => {
                  const isSelected = selectedProblems.includes(p.id);
                  const isMCQ = p.questionType === 'MCQ';
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProblem(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        margin: '2px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 129, 167, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(0, 129, 167, 0.3)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: isMCQ ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 129, 167, 0.15)',
                          color: isMCQ ? '#8b5cf6' : '#0081a7',
                          border: isMCQ ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(0, 129, 167, 0.3)'
                        }}>
                          {isMCQ ? 'MCQ' : 'CODING'}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>#{p.id}. {p.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({p.concept || 'Algorithms'})</span>
                        {p.isPrivate && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', background: '#fef3c7', color: '#92400e' }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: p.difficulty === 'EASY' ? '#dcfce7' : (p.difficulty === 'MEDIUM' ? '#fef08a' : '#fee2e2'),
                        color: p.difficulty === 'EASY' ? '#166534' : (p.difficulty === 'MEDIUM' ? '#854d0e' : '#991b1b')
                      }}>
                        {p.difficulty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CANDIDATES */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    Assign Candidates & Recipients
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {selectedUsers.length} candidate{selectedUsers.length !== 1 ? 's' : ''} assigned. Each receives a unique entry access code.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUsers.length === availableUsers.length) {
                        setSelectedUsers([]);
                      } else {
                        setSelectedUsers(availableUsers.map(u => u.userId));
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                  >
                    {selectedUsers.length === availableUsers.length ? 'Deselect All' : `Select All (${availableUsers.length})`}
                  </button>

                  <div style={{ position: 'relative', width: '200px' }}>
                    <input
                      type="text"
                      placeholder="Search candidate..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.65rem 0.4rem 1.8rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                    <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.35rem', background: 'var(--input-bg)' }}>
                {filteredUsers.map(u => {
                  const isSelected = selectedUsers.includes(u.userId);
                  return (
                    <div
                      key={u.userId}
                      onClick={() => toggleUser(u.userId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        margin: '2px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 129, 167, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(0, 129, 167, 0.3)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>@{u.username}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({u.name})</span>
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Rank #{u.rank || '--'} • {u.points || 0} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SECURITY & ASSESSMENT SETTINGS */}
          {step === 4 && (
            <div>
              <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                Security & Integrity Settings
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                Configure browser proctoring, exam timer enforcement, and strike thresholds.
              </p>

              <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={16} color="#059669" /> Enable Secure Exam Mode
                    </div>
                    <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Enforces full-screen viewport, monitors tab-switches, and logs integrity violations.
                    </div>
                  </div>

                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={secureMode}
                      onChange={e => setSecureMode(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: secureMode ? '#059669' : 'var(--border)',
                      borderRadius: '24px', transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: secureMode ? '22px' : '3px', bottom: '3px',
                        background: 'white', borderRadius: '50%', transition: '0.2s'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group-compact">
                  <label>Assessment Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="360"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(e.target.value)}
                    placeholder="60"
                  />
                  <span className="form-hint-text">Standard time allocated per candidate attempt.</span>
                </div>

                <div className="form-group-compact">
                  <label>Allowed Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={allowedAttempts}
                    onChange={e => setAllowedAttempts(e.target.value)}
                    placeholder="1"
                  />
                  <span className="form-hint-text">Maximum attempts per candidate before lockout.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {step === 5 && (
            <div>
              <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                Review Assignment Summary
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                Confirm all configurations before publishing invitations to candidates.
              </p>

              <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', display: 'grid', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Title:</span>
                  <strong style={{ color: 'var(--text)' }}>{title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Selected Problems:</span>
                  <strong style={{ color: 'var(--primary)' }}>{selectedProblems.length} challenges</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Candidates:</span>
                  <strong>{selectedUsers.length} recipients</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Exam Environment:</span>
                  <span style={{ fontWeight: 700, color: secureMode ? '#059669' : 'var(--text)' }}>
                    {secureMode ? '🛡️ Secure Proctored Exam Mode' : 'Standard Coding Mode'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration & Attempts:</span>
                  <strong>{durationMinutes} min ({allowedAttempts} attempt)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
                  <span>{dueDate ? new Date(dueDate).toLocaleString() : 'No strict deadline'}</span>
                </div>
              </div>
            </div>
          )}

          {/* WIZARD ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary btn-sm"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700, padding: '0.55rem 1.5rem' }}
              >
                {loading ? 'Publishing...' : 'Publish Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT RAIL: CONTEXTUAL GUIDANCE & SUMMARY PREVIEW
      ========================================================= */}
      <div className="kodify-right-rail">
        {step === 1 && (
          <>
            <ContextualNote type="info" title="Schedule Flexibility">
              Leaving the start or due date empty allows candidates to access the assignment at any time.
            </ContextualNote>
            <ContextualNote type="tip" title="Quick Hour Controls">
              Use <strong>[+1 hr]</strong> or <strong>[-1 hr]</strong> buttons to rapidly shift deadlines while preserving time of day.
            </ContextualNote>
          </>
        )}

        {step === 2 && (
          <>
            <ContextualNote type="info" title="Problem Diversity">
              Select a balanced mix of Easy, Medium, and Hard challenges to test fundamental syntax and complex algorithmic logic.
            </ContextualNote>
            <div className="dashboard-card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>SELECTED SO FAR</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {selectedProblems.length} Problems
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <ContextualNote type="security" title="Automated Invite Codes">
              Upon publishing, each candidate receives an automated invitation email containing their private 6-digit access code.
            </ContextualNote>
            <div className="dashboard-card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>CANDIDATES ENROLLED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                {selectedUsers.length} Users
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <ContextualNote type="warning" title="Secure Proctored Mode">
            Secure Mode locks the browser viewport into fullscreen, tracks tab-switching, and logs 3-strike violations directly for your review.
          </ContextualNote>
        )}

        {step === 5 && (
          <ContextualNote type="success" title="Ready to Launch">
            Review the details in the center pane. Clicking <strong>Publish Assessment</strong> will dispatch invitation emails immediately.
          </ContextualNote>
        )}
      </div>

      {/* =========================================================
          QUESTION CREATOR MODAL (MCQ & CODING)
      ========================================================= */}
      {showQuestionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="dashboard-card animate-fade-in" style={{
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowQuestionModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(0, 129, 167, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Plus size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  Create Custom Question
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Author a private question scoped specifically to your assessments.
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setQuestionModalTab('MCQ')}
                className={`btn btn-sm ${questionModalTab === 'MCQ' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <CheckSquare size={14} /> Multiple Choice (MCQ)
              </button>
              <button
                type="button"
                onClick={() => setQuestionModalTab('CODING')}
                className={`btn btn-sm ${questionModalTab === 'CODING' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Code2 size={14} /> Programming Challenge
              </button>
            </div>

            {customQuestionError && (
              <div className="error-msg" style={{ marginBottom: '1rem' }}>
                {customQuestionError}
              </div>
            )}
            {customQuestionSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.65rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.825rem' }}>
                {customQuestionSuccess}
              </div>
            )}

            <form onSubmit={handleSaveCustomQuestion}>
              <div className="form-group-compact">
                <label>Question Title <span className="label-required">*</span></label>
                <input
                  type="text"
                  placeholder={questionModalTab === 'MCQ' ? "e.g., Time Complexity of Binary Search" : "e.g., Invert Binary Tree"}
                  value={newQuestionForm.title}
                  onChange={e => setNewQuestionForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group-compact">
                  <label>Topic / Concept</label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures, Recursion"
                    value={newQuestionForm.concept}
                    onChange={e => setNewQuestionForm(prev => ({ ...prev, concept: e.target.value }))}
                  />
                </div>
                <div className="form-group-compact">
                  <label>Difficulty</label>
                  <select
                    value={newQuestionForm.difficulty}
                    onChange={e => setNewQuestionForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group-compact">
                <label>Question Statement / Description <span className="label-required">*</span></label>
                <textarea
                  rows="3"
                  placeholder="Provide the question statement, problem requirements, or conceptual query..."
                  value={newQuestionForm.description}
                  onChange={e => setNewQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Question Diagram / Image Attachment */}
              <div className="form-group-compact">
                <QuestionImageUploader
                  imageUrl={newQuestionForm.imageUrl}
                  onImageChange={url => setNewQuestionForm(prev => ({ ...prev, imageUrl: url }))}
                />
              </div>

              {/* MCQ SPECIFIC FIELDS */}
              {questionModalTab === 'MCQ' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem', display: 'block' }}>
                    Options (Select the radio button for the correct answer) <span className="label-required">*</span>
                  </label>
                  {newQuestionForm.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={newQuestionForm.correctOption === opt && opt.trim() !== ''}
                        onChange={() => setNewQuestionForm(prev => ({ ...prev, correctOption: opt }))}
                        title="Mark as correct answer"
                        style={{ cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={e => {
                          const val = e.target.value;
                          const wasCorrect = newQuestionForm.correctOption === opt;
                          setNewQuestionForm(prev => {
                            const updated = [...prev.options];
                            updated[idx] = val;
                            return {
                              ...prev,
                              options: updated,
                              correctOption: wasCorrect ? val : prev.correctOption
                            };
                          });
                        }}
                        style={{ flex: 1, padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                        required
                      />
                      {newQuestionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewQuestionForm(prev => {
                              const updated = prev.options.filter((_, i) => i !== idx);
                              const newCorrect = prev.correctOption === opt ? updated[0] : prev.correctOption;
                              return { ...prev, options: updated, correctOption: newCorrect };
                            });
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem', color: '#ef4444' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {newQuestionForm.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewQuestionForm(prev => ({
                          ...prev,
                          options: [...prev.options, `Option ${String.fromCharCode(65 + prev.options.length)}`]
                        }));
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      + Add Option
                    </button>
                  )}

                  <div className="form-group-compact" style={{ marginTop: '0.75rem' }}>
                    <label>Explanation / Solution Notes (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="Explain why the selected option is correct..."
                      value={newQuestionForm.explanation}
                      onChange={e => setNewQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* CODING SPECIFIC FIELDS */}
              {questionModalTab === 'CODING' && (
                <div>
                  {/* ALLOWED PROGRAMMING LANGUAGES */}
                  <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'var(--table-th-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div>
                        <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Code2 size={15} color="var(--primary)" /> Allowed Programming Languages <span className="label-required">*</span>
                        </label>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Candidates will only be allowed to code and submit in the selected languages.
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setNewQuestionForm(prev => ({ ...prev, allowedLanguages: SUPPORTED_LANGUAGES.map(l => l.id) }))}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewQuestionForm(prev => ({ ...prev, allowedLanguages: [] }))}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                      {SUPPORTED_LANGUAGES.map(lang => {
                        const isSelected = newQuestionForm.allowedLanguages?.includes(lang.id);
                        return (
                          <div
                            key={lang.id}
                            onClick={() => {
                              setNewQuestionForm(prev => {
                                const current = prev.allowedLanguages || [];
                                const updated = current.includes(lang.id)
                                  ? current.filter(id => id !== lang.id)
                                  : [...current, lang.id];
                                return { ...prev, allowedLanguages: updated };
                              });
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              background: isSelected ? 'rgba(0, 129, 167, 0.12)' : 'var(--card-bg)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                              {lang.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group-compact">
                    <label>Constraints</label>
                    <input
                      type="text"
                      placeholder="e.g., 1 <= N <= 10^5, 0 <= nums[i] <= 1000"
                      value={newQuestionForm.constraints}
                      onChange={e => setNewQuestionForm(prev => ({ ...prev, constraints: e.target.value }))}
                    />
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem', display: 'block' }}>
                      Test Cases <span className="label-required">*</span>
                    </label>
                    {newQuestionForm.testCases.map((tc, idx) => (
                      <div key={idx} style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.65rem', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Test Case #{idx + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={tc.hidden}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setNewQuestionForm(prev => {
                                    const updated = [...prev.testCases];
                                    updated[idx] = { ...updated[idx], hidden: checked };
                                    return { ...prev, testCases: updated };
                                  });
                                }}
                              />
                              Hidden (Private test case)
                            </label>
                            {newQuestionForm.testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewQuestionForm(prev => ({
                                    ...prev,
                                    testCases: prev.testCases.filter((_, i) => i !== idx)
                                  }));
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="form-row-2col">
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Input:</span>
                            <textarea
                              rows="2"
                              value={tc.input}
                              onChange={e => {
                                const val = e.target.value;
                                setNewQuestionForm(prev => {
                                  const updated = [...prev.testCases];
                                  updated[idx] = { ...updated[idx], input: val };
                                  return { ...prev, testCases: updated };
                                });
                              }}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem' }}
                              required
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expected Output:</span>
                            <textarea
                              rows="2"
                              value={tc.expectedOutput}
                              onChange={e => {
                                const val = e.target.value;
                                setNewQuestionForm(prev => {
                                  const updated = [...prev.testCases];
                                  updated[idx] = { ...updated[idx], expectedOutput: val };
                                  return { ...prev, testCases: updated };
                                });
                              }}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem' }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setNewQuestionForm(prev => ({
                          ...prev,
                          testCases: [...prev.testCases, { input: '', expectedOutput: '', hidden: false }]
                        }));
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      + Add Test Case
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomQuestion}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {creatingCustomQuestion ? 'Saving...' : 'Save & Add to Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentCreate;
