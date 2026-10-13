import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import BanyanProgressNav from './components/BanyanProgressNav';
import ContextualNote from './components/ContextualNote';
import { AssignmentOverviewWidget, SecurityStatusWidget } from './components/AssignmentWidgets';
import { KolamMotif, WaveDivider } from './components/AmbientArt';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Lock,
  Maximize,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Terminal,
  FileCode,
  RefreshCw,
  Check,
  AlertCircle,
  Key,
  User,
  Camera,
  Video,
  Sparkles,
  LogIn
} from 'lucide-react';
import { getAvailableLanguagesForProblem, getMonacoLanguage, getDefaultStarterCode, normalizeLanguageId, SUPPORTED_LANGUAGES } from './utils/languageRegistry';

const formatTimer = (totalSeconds) => {
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function SecureExamMode() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, login, loginWithGoogle } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Phases: CODE_STEP, AUTH_REQUIRED_STEP, IDENTITY_STEP, CONSENT_STEP, MEDIA_STEP, ACTIVE_EXAM, SUBMITTED
  const [phase, setPhase] = useState('CODE_STEP');
  const [assignment, setAssignment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Step 1: Access code
  const [accessCode, setAccessCode] = useState(searchParams.get('code') || searchParams.get('token') || '');
  const [verifiedCandidateInfo, setVerifiedCandidateInfo] = useState(null);

  // Inline Auth Form
  const [inlineAuthMode, setInlineAuthMode] = useState('GOOGLE_OR_LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

  // Step 2: Identity
  const [identityForm, setIdentityForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    gender: 'MALE'
  });

  // Step 3: Consent
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Step 4: Media
  const [cameraStream, setCameraStream] = useState(null);
  const [mediaWarning, setMediaWarning] = useState(null);
  const [cameraMinimized, setCameraMinimized] = useState(false);
  const videoPreviewRef = useRef(null);
  const activeExamVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Step 5: Active question & code editor
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [language, setLanguage] = useState('Python');
  const [codeDrafts, setCodeDrafts] = useState({});

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeTestTab, setActiveTestTab] = useState(0);

  // Timer & Integrity
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [violationsCount, setViolationsCount] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [securityToast, setSecurityToast] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Update identity form when user logs in
  useEffect(() => {
    if (user) {
      setIdentityForm(prev => ({
        ...prev,
        username: user.username || prev.username,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // Fetch OAuth configuration
  useEffect(() => {
    axios.get('/api/auth/config')
      .then(res => {
        if (res.data?.googleClientId) {
          setGoogleClientId(res.data.googleClientId);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch initial assignment details and check existing attempt
  useEffect(() => {
    fetchAssignmentAndAttempt();
  }, [id, user]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    };
  }, [cameraStream]);

  const fetchAssignmentAndAttempt = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch public invitation info or full detail if authenticated
      let assignData = null;
      try {
        const assignRes = await axios.get(`/api/assignments/${id}/invitation-info`);
        assignData = assignRes.data;
      } catch (e) {
        try {
          const fallbackRes = await axios.get(`/api/assignments/${id}`);
          assignData = fallbackRes.data;
        } catch (ignored) {}
      }

      if (assignData) {
        setAssignment(assignData);
      }

      // If user is authenticated, check for active attempt
      if (user) {
        try {
          const attemptRes = await axios.get(`/api/assignments/${id}/attempts/current`);
          if (attemptRes.data) {
            const att = attemptRes.data;
            setAttempt(att);
            setViolationsCount(att.integrityViolationCount || 0);
            setIsFlagged(att.flaggedForReview || false);
            setRemainingSeconds(att.remainingSeconds || 0);

            if (att.status === 'COMPLETED' || att.status === 'TIME_EXPIRED') {
              setPhase('SUBMITTED');
            } else if (att.status === 'IN_PROGRESS') {
              setPhase('ACTIVE_EXAM');
              initDrafts(att.problems || []);
              startMediaCaptureBackground();
            }
          }
        } catch (attemptErr) {
          // No current attempt found, remains in initial verification flow
        }
      }
    } catch (err) {
      console.error("Error loading secure assessment:", err);
      setError("Unable to load assessment environment.");
    } finally {
      setLoading(false);
    }
  };

  const initDrafts = (problems) => {
    const drafts = {};
    (problems || []).forEach(p => {
      drafts[p.problemId] = {
        PYTHON: p.starterCodePython || getDefaultStarterCode('PYTHON'),
        JAVA: p.starterCodeJava || getDefaultStarterCode('JAVA'),
        C: p.starterCodeC || getDefaultStarterCode('C'),
        CPP: p.starterCodeCpp || getDefaultStarterCode('CPP'),
        JAVASCRIPT: p.starterCodeJs || getDefaultStarterCode('JAVASCRIPT'),
        GO: p.starterCodeGo || getDefaultStarterCode('GO'),
        RUST: p.starterCodeRust || getDefaultStarterCode('RUST'),
        TYPESCRIPT: getDefaultStarterCode('TYPESCRIPT')
      };
    });
    setCodeDrafts(drafts);
  };

  const verifyAccessCode = async (codeToVerify) => {
    const code = codeToVerify || accessCode;
    if (!code || !code.trim()) {
      setError("Please enter your 6-digit verification code.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`/api/assignments/${id}/exam/verify-code`, { code: code.trim() });
      if (res.data && res.data.valid) {
        setVerifiedCandidateInfo(res.data);
        if (res.data.email) {
          setAuthEmail(res.data.email.includes('*') ? '' : res.data.email);
        }

        // If candidate is already authenticated, advance directly to identity confirmation
        if (user) {
          setPhase('IDENTITY_STEP');
        } else {
          // Prompt candidate to authenticate to link session with verified invitation
          setPhase('AUTH_REQUIRED_STEP');
        }
      } else {
        setError(res.data?.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code for this assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleInlinePasswordLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const loggedUser = await login(authEmail, authPassword);
      if (loggedUser) {
        setPhase('IDENTITY_STEP');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed. Please verify your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    const activeClientId = googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!activeClientId) {
      setAuthError("Google OAuth is not configured. Please login with email/password.");
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (res) => {
            if (res?.credential) {
              try {
                setAuthLoading(true);
                const loggedUser = await loginWithGoogle(res.credential);
                if (loggedUser) {
                  setPhase('IDENTITY_STEP');
                }
              } catch (err) {
                setAuthError(err.response?.data?.message || "Google authentication failed.");
              } finally {
                setAuthLoading(false);
              }
            }
          },
          auto_select: false,
          prompt_parent_id: 'g_id_onload'
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log("GIS prompt notification:", notification.getNotDisplayedReason?.());
          }
        });
      } catch (e) {
        console.warn("GIS prompt initialization error:", e);
        setAuthError("Google Sign-In initialization failed: " + (e.message || e));
      }
    } else {
      setAuthError("Google Identity Services script is not loaded. Please use email/password login.");
    }
  };

  const verifyIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`/api/assignments/${id}/exam/verify-identity`, {
        username: identityForm.username.trim(),
        email: identityForm.email.trim(),
        gender: identityForm.gender
      });
      if (res.data && res.data.verified) {
        setPhase('CONSENT_STEP');
      } else {
        setError(res.data?.message || "Participant identity verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identity verification failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const requestMediaPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      setMediaWarning(null);

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (stream) {
            setCameraStream(stream);
            if (videoPreviewRef.current) {
              videoPreviewRef.current.srcObject = stream;
            }
          }
        } catch (mediaErr) {
          console.warn("Webcam access optional or denied:", mediaErr);
          setMediaWarning("Webcam access was not granted. You may proceed, but this attempt may be subject to review.");
        }
      } else {
        setMediaWarning("Webcam device not supported on this browser.");
      }
      setPhase('MEDIA_STEP');
    } catch (err) {
      console.warn("Media permission step error:", err);
      setPhase('MEDIA_STEP');
    } finally {
      setLoading(false);
    }
  };

  const startMediaCaptureBackground = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
        if (stream) {
          setCameraStream(stream);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
          startRecordingStream(stream);
        }
      }
    } catch (ignored) {}
  };

  const startRecordingStream = (stream) => {
    try {
      if (!window.MediaRecorder || !stream) return;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(3000); // 3-second slices
    } catch (err) {
      console.warn("Recording stream init:", err);
    }
  };

  const uploadFinalRecording = async () => {
    if (!id || !attempt?.id || recordedChunksRef.current.length === 0) return;
    try {
      const fullBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('file', fullBlob, `attempt_${attempt.id}_session.webm`);
      formData.append('type', 'VIDEO_WEBCAM');
      await axios.post(`/api/assignments/${id}/attempts/${attempt.id}/recordings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.warn("Upload final recording error:", err);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (phase !== 'ACTIVE_EXAM') return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, attempt?.id]);

  // Security Event Handlers (Fullscreen, Tab Switch, Copy/Paste)
  useEffect(() => {
    if (phase !== 'ACTIVE_EXAM') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenWarning(true);
        recordIntegrityEvent('FULLSCREEN_EXIT', 'Exited browser full-screen mode', 'WARNING');
      } else {
        setFullscreenWarning(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        showSecurityToast('Tab switch detected. This event has been recorded.', 'WARNING');
        recordIntegrityEvent('TAB_SWITCH', 'Switched away from assessment tab', 'WARNING');
      }
    };

    const handleWindowBlur = () => {
      showSecurityToast('Assessment window lost focus.', 'WARNING');
      recordIntegrityEvent('WINDOW_BLUR', 'Window lost active focus', 'INFO');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      showSecurityToast('Paste is blocked during secure assessments.', 'WARNING');
      recordIntegrityEvent('PASTE_ATTEMPT', 'Attempted to paste external content', 'WARNING');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      showSecurityToast('Copy is disabled during secure assessments.', 'INFO');
      recordIntegrityEvent('COPY_ATTEMPT', 'Attempted to copy assessment content', 'INFO');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [phase, attempt?.id]);

  const recordIntegrityEvent = async (eventType, metadata, severity) => {
    if (!attempt?.id) return;
    try {
      const res = await axios.post(`/api/assignments/${id}/attempts/${attempt.id}/events`, {
        eventType,
        metadata,
        severity
      });
      if (res.data) {
        setViolationsCount(res.data.integrityViolationCount || 0);
        setIsFlagged(res.data.flaggedForReview || false);
      }
    } catch (err) {
      console.error("Failed to log integrity event:", err);
    }
  };

  const showSecurityToast = (msg, type) => {
    setSecurityToast({ msg, type });
    setTimeout(() => setSecurityToast(null), 3500);
  };

  const requestFullscreenAndStart = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`/api/assignments/${id}/attempts`);
      const att = res.data;
      setAttempt(att);
      setRemainingSeconds(att.remainingSeconds || (assignment?.durationMinutes ? assignment.durationMinutes * 60 : 3600));
      setViolationsCount(att.integrityViolationCount || 0);
      setIsFlagged(att.flaggedForReview || false);
      initDrafts(att.problems || []);
      setPhase('ACTIVE_EXAM');

      if (cameraStream) {
        startRecordingStream(cameraStream);
      }
    } catch (err) {
      console.error("Failed to start assessment attempt:", err);
      setError(err.response?.data?.message || "Failed to initiate assessment session.");
    } finally {
      setLoading(false);
    }
  };

  const reEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenWarning(false);
    } catch (err) {
      console.warn("Fullscreen retry error:", err);
    }
  };

  const handleAutoSubmitTimeExpired = async () => {
    if (!attempt?.id) return;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
        await new Promise(r => setTimeout(r, 400));
        await uploadFinalRecording();
      }
      const res = await axios.post(`/api/assignments/${id}/attempts/${attempt.id}/submit`);
      setAttempt(res.data);
      setPhase('SUBMITTED');
    } catch (err) {
      console.error("Auto-submit failed:", err);
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt?.id) return;
    try {
      setSubmitting(true);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
        await new Promise(r => setTimeout(r, 400));
        await uploadFinalRecording();
      }
      const res = await axios.post(`/api/assignments/${id}/attempts/${attempt.id}/submit`);
      setAttempt(res.data);
      setShowSubmitConfirm(false);
      setPhase('SUBMITTED');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      console.error("Submit attempt failed:", err);
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Active question and code helper accessors
  const currentProblem = attempt?.problems?.[activeQuestionIdx] || null;
  const availableLangs = getAvailableLanguagesForProblem(currentProblem);

  // Sync active language with allowed languages of current problem
  useEffect(() => {
    if (availableLangs && availableLangs.length > 0) {
      const normLang = normalizeLanguageId(language);
      const isAllowed = availableLangs.some(l => l.id === normLang);
      if (!isAllowed) {
        setLanguage(availableLangs[0].id);
      }
    }
  }, [activeQuestionIdx, currentProblem?.problemId]);

  const normActiveLang = normalizeLanguageId(language);
  const currentCode = (currentProblem && (codeDrafts[currentProblem.problemId]?.[normActiveLang] || codeDrafts[currentProblem.problemId]?.[language])) || '';

  const handleCodeChange = (newCode) => {
    if (!currentProblem) return;
    setCodeDrafts(prev => ({
      ...prev,
      [currentProblem.problemId]: {
        ...(prev[currentProblem.problemId] || {}),
        [normActiveLang]: newCode ?? '',
        [language]: newCode ?? ''
      }
    }));
  };

  const handleRunSampleCode = async () => {
    if (!currentProblem) return;
    if (!currentCode || currentCode.trim() === '') {
      alert('Please enter your code before running.');
      return;
    }
    try {
      setRunning(true);
      setRunResult(null);
      setSubmissionResult(null);
      const res = await axios.post(`/api/problems/${currentProblem.problemId}/run`, {
        language: normActiveLang,
        code: currentCode
      });
      setRunResult(res.data);
      setActiveTestTab(0);
    } catch (err) {
      console.error("Run error:", err);
      setRunResult({
        status: 'ERROR',
        message: err.response?.data?.message || err.response?.data || 'Error executing sample tests.'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitProblemCode = async () => {
    if (!currentProblem) return;
    if (!currentCode || currentCode.trim() === '') {
      alert('Please write code before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setRunResult(null);
      setSubmissionResult(null);
      const res = await axios.post(`/api/problems/${currentProblem.problemId}/submit`, {
        language: normActiveLang,
        code: currentCode
      });
      setSubmissionResult(res.data);
      if (res.data?.status === 'ACCEPTED' || res.data?.solved) {
        setAttempt(prev => {
          if (!prev) return prev;
          const updatedProblems = (prev.problems || []).map(p =>
            p.problemId === currentProblem.problemId ? { ...p, solved: true } : p
          );
          return {
            ...prev,
            problems: updatedProblems,
            completedQuestions: (prev.completedQuestions || 0) + (currentProblem.solved ? 0 : 1)
          };
        });
        showSecurityToast(`Problem "${currentProblem.title}" solved!`, 'INFO');
      }
    } catch (err) {
      console.error("Submission error:", err);
      setSubmissionResult({
        status: 'ERROR',
        message: err.response?.data?.message || err.response?.data || 'Error submitting solution.',
        solved: false
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // PRE-EXAM GATEWAY CONFIG & COMMON SHELL
  // =========================================================
  const GATEWAY_STEPS = [
    { id: 1, title: 'Access Code', subtitle: 'Invitation key verification' },
    { id: 2, title: 'Authentication', subtitle: 'Candidate account verification' },
    { id: 3, title: 'Candidate Profile', subtitle: 'Confirm identity details' },
    { id: 4, title: 'Integrity Rules', subtitle: 'Review & accept rules' },
    { id: 5, title: 'Device Check', subtitle: 'Camera & proctoring preview' }
  ];

  const getActiveStepNumber = () => {
    switch (phase) {
      case 'CODE_STEP': return 1;
      case 'AUTH_REQUIRED_STEP': return 2;
      case 'IDENTITY_STEP': return 3;
      case 'CONSENT_STEP': return 4;
      case 'MEDIA_STEP': return 5;
      default: return 1;
    }
  };

  const getCompletedSteps = () => {
    const completed = [];
    if (verifiedCandidateInfo || phase !== 'CODE_STEP') {
      completed.push(1);
    }
    if (user && (phase === 'IDENTITY_STEP' || phase === 'CONSENT_STEP' || phase === 'MEDIA_STEP' || phase === 'ACTIVE_EXAM' || phase === 'SUBMITTED')) {
      completed.push(2);
    }
    if (phase === 'CONSENT_STEP' || phase === 'MEDIA_STEP' || phase === 'ACTIVE_EXAM' || phase === 'SUBMITTED') {
      completed.push(3);
    }
    if (phase === 'MEDIA_STEP' || phase === 'ACTIVE_EXAM' || phase === 'SUBMITTED') {
      completed.push(4);
    }
    if (phase === 'ACTIVE_EXAM' || phase === 'SUBMITTED') {
      completed.push(5);
    }
    return completed;
  };

  const renderPreExamShell = (stepTitle, stepSubtitle, children, rightExtra = null) => {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: 'var(--bg)', color: 'var(--text)', padding: '2rem 1.5rem', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', textDecoration: 'none', letterSpacing: '0.04em' }}>
              KODIFY
            </Link>
            <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--primary)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: '12px', fontWeight: 700 }}>
              SECURE ASSESSMENT GATEWAY
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Participant:</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{user?.username || verifiedCandidateInfo?.email || 'Candidate'}</strong>
          </div>
        </div>

        <div className="kodify-workspace-3col" style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {/* Left Rail: Progress Nav & Ambient Art */}
          <div className="kodify-left-rail">
            <BanyanProgressNav
              steps={GATEWAY_STEPS}
              activeStep={getActiveStepNumber()}
              completedSteps={getCompletedSteps()}
            />
            <div className="ambient-art-container" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-bg)' }}>
              <KolamMotif size={44} opacity={0.6} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                KODIFY Proctoring Protection
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Full-screen lock & integrity monitoring
              </div>
            </div>
          </div>

          {/* Center Pane: Phase Card */}
          <div className="kodify-center-pane">
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text)' }}>
                  {stepTitle}
                </h2>
                {stepSubtitle && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                    {stepSubtitle}
                  </p>
                )}
              </div>
              {children}
            </div>
          </div>

          {/* Right Rail: Overview Widget & Guidance */}
          <div className="kodify-right-rail">
            <AssignmentOverviewWidget assignment={assignment} />
            <SecurityStatusWidget violationsCount={violationsCount} isFlagged={isFlagged} cameraActive={!!cameraStream} />
            {rightExtra}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // STEP 1: ASSIGNMENT ENTRY & VERIFICATION CODE SCREEN
  // =========================================================
  if (phase === 'CODE_STEP') {
    return renderPreExamShell(
      assignment?.title || 'Enter Assessment Code',
      'Please enter your 6-digit access code provided in your email invitation.',
      <div>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group-compact" style={{ marginBottom: '1.5rem' }}>
          <label className="label-required" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
            Unique 6-Digit Verification Code
          </label>
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.toUpperCase())}
            placeholder="e.g. 583214"
            maxLength={8}
            autoFocus
            style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '6px', textAlign: 'center', textTransform: 'uppercase', borderRadius: '6px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
          />
          <span className="form-hint-text" style={{ textAlign: 'center', marginTop: '6px' }}>
            Check your Gmail invitation for your dedicated one-time candidate verification code.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => verifyAccessCode(accessCode)}
            disabled={loading || accessCode.trim().length < 6}
            className="btn btn-primary"
            style={{ flex: 2, fontWeight: 700, padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
          >
            {loading ? 'Verifying Code...' : 'ENTER ASSIGNMENT'} &rarr;
          </button>
        </div>
      </div>,
      <ContextualNote
        type="info"
        title="Candidate Guidance"
        message="Keep your invitation email handy. The code is tied to your registered candidate email address."
      />
    );
  }

  // =========================================================
  // STEP 1.5: INLINE AUTHENTICATION PROMPT (When unauthenticated)
  // =========================================================
  if (phase === 'AUTH_REQUIRED_STEP') {
    return renderPreExamShell(
      'Sign In to Attend Assessment',
      `This invitation was issued to ${verifiedCandidateInfo?.email || 'your registered email'}. Authenticate to link your attempt.`,
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>
            Invitation Code Verified for {verifiedCandidateInfo?.email || 'candidate'}
          </span>
        </div>

        {authError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.825rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>{authError}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div id="g_id_onload" style={{ width: '100%' }}></div>
        <button
          type="button"
          className="google-auth-btn"
          disabled={authLoading}
          onClick={handleGoogleAuth}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>or sign in with password</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleInlinePasswordLogin} style={{ display: 'grid', gap: '0.85rem' }}>
          <div className="form-group-compact">
            <label className="label-required">Email</label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="name@domain.com"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>

          <div className="form-group-compact">
            <label className="label-required">Password</label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setPhase('CODE_STEP')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-primary"
              style={{ flex: 2, fontWeight: 700 }}
            >
              {authLoading ? 'Signing in...' : 'Sign In & Proceed'} &rarr;
            </button>
          </div>
        </form>
      </div>,
      <ContextualNote
        type="security"
        title="Account Linking"
        message="Logging in securely bonds your submission to your KODIFY profile and ensures verified score recording."
      />
    );
  }

  // =========================================================
  // STEP 2: IDENTITY SCREEN
  // =========================================================
  if (phase === 'IDENTITY_STEP') {
    return renderPreExamShell(
      'Confirm Candidate Profile',
      'Verify your candidate credentials before entering the proctored assessment session.',
      <div>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group-compact">
            <label className="label-required">Username / Display Name</label>
            <input
              type="text"
              value={identityForm.username}
              onChange={e => setIdentityForm({ ...identityForm, username: e.target.value })}
              placeholder="Your username"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>

          <div className="form-group-compact">
            <label className="label-required">Registered Candidate Email</label>
            <input
              type="email"
              value={identityForm.email}
              onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
              placeholder="name@domain.com"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>

          <div className="form-group-compact">
            <label>Gender / Honorific</label>
            <select
              value={identityForm.gender}
              onChange={e => setIdentityForm({ ...identityForm, gender: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setPhase('CODE_STEP')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={verifyIdentity}
            disabled={loading || !identityForm.username.trim() || !identityForm.email.trim()}
            className="btn btn-primary"
            style={{ flex: 2, fontWeight: 700 }}
          >
            {loading ? 'Verifying...' : 'Verify & Proceed'} &rarr;
          </button>
        </div>
      </div>,
      <ContextualNote
        type="tip"
        title="Verification Note"
        message="Your name and registered email will appear on the final scorecard and evaluation report sent to the creator."
      />
    );
  }

  // =========================================================
  // STEP 3: RULES & CONSENT SCREEN
  // =========================================================
  if (phase === 'CONSENT_STEP') {
    return renderPreExamShell(
      'Integrity Rules & Agreement',
      'Review mandatory examination guidelines before enabling proctoring devices.',
      <div>
        <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
            <ShieldAlert size={16} color="#d97706" /> Mandatory Proctored Guidelines
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li><strong>Full-screen mode:</strong> Required throughout the entire session. Exiting will generate an integrity flag.</li>
            <li><strong>Tab & Focus switching:</strong> Leaving the examination window is automatically monitored and logged.</li>
            <li><strong>Editor Protection:</strong> Clipboard copy/paste operations and right-click context menus are restricted.</li>
            <li><strong>Violations Threshold:</strong> 3 or more logged integrity violations flag your submission for manual review.</li>
            <li><strong>Authoritative Timer:</strong> Assessment countdown is server-enforced and cannot be paused.</li>
          </ul>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={agreedToRules}
            onChange={e => setAgreedToRules(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <span>I understand and agree to adhere to all assessment integrity rules.</span>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setPhase('IDENTITY_STEP')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={requestMediaPermissions}
            disabled={!agreedToRules || loading}
            className="btn btn-primary"
            style={{ flex: 2, fontWeight: 700 }}
          >
            {loading ? 'Checking devices...' : 'Setup Proctoring Devices'} &rarr;
          </button>
        </div>
      </div>,
      <ContextualNote
        type="warning"
        title="Zero Tolerance Policy"
        message="Unauthorized tabs, developer tools, and external assistance will be captured in the integrity audit log."
      />
    );
  }

  // =========================================================
  // STEP 4: MEDIA PREVIEW SCREEN
  // =========================================================
  if (phase === 'MEDIA_STEP') {
    return renderPreExamShell(
      'Webcam & Device Check',
      'Verify video preview and system readiness before entering full-screen exam mode.',
      <div>
        {mediaWarning && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>{mediaWarning}</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#000', borderRadius: '6px', overflow: 'hidden', height: '170px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="recording-indicator-dot" /> {cameraStream ? 'Webcam Active' : 'Webcam Offline'}
            </div>
          </div>

          <div style={{ background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', fontWeight: 600, color: '#059669' }}>
              <CheckCircle2 size={16} /> Access Code Validated
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', fontWeight: 600, color: '#059669' }}>
              <CheckCircle2 size={16} /> Identity Confirmed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', fontWeight: 600, color: '#059669' }}>
              <CheckCircle2 size={16} /> Exam Rules Acknowledged
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', fontWeight: 600, color: cameraStream ? '#059669' : '#d97706' }}>
              {cameraStream ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {cameraStream ? 'Camera Stream Ready' : 'Camera Optional / Check'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setPhase('CONSENT_STEP')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={requestFullscreenAndStart}
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 2, fontWeight: 700, padding: '0.75rem 1.25rem' }}
          >
            {loading ? 'Launching Exam...' : 'Enter Fullscreen Assessment'} &rarr;
          </button>
        </div>
      </div>,
      <ContextualNote
        type="success"
        title="Ready to Begin"
        message="Clicking Enter Fullscreen will lock your assessment view and start the official timer."
      />
    );
  }

  // =========================================================
  // STEP 6: SUBMITTED / RESULTS
  // =========================================================
  if (phase === 'SUBMITTED') {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ maxWidth: '560px', width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2.25rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Assessment Completed
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
            Your assessment submission for <strong>{assignment?.title}</strong> has been received and verified.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--table-th-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Solved Questions</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
                {attempt?.completedQuestions || 0} / {attempt?.totalQuestions || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Score</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                {attempt?.score || 0} Pts
              </div>
            </div>
          </div>

          {attempt?.flaggedForReview && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', fontSize: '0.825rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>Note: This session recorded multiple integrity warnings and is flagged for standard review.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate(`/assignments/${id || attempt?.assignmentId}?tab=review`)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} /> Review My Responses & Performance
            </button>
            <button
              type="button"
              onClick={() => navigate('/assignments')}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER PHASE 5: ACTIVE SECURE EXAM WORKSPACE
  // =========================================================
  return (
    <div className="secure-exam-container">
      
      {/* TOP STATUS BAR */}
      <header className="secure-exam-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
            KODIFY
          </span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            {assignment?.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Integrity Indicator */}
          <div className={`secure-integrity-badge ${isFlagged ? 'flagged' : (violationsCount > 0 ? 'warning' : 'normal')}`}>
            <Shield size={12} />
            {isFlagged ? 'FLAGGED FOR REVIEW' : (violationsCount > 0 ? `WARNING (${violationsCount} STRIKES)` : 'SECURE MODE ACTIVE')}
          </div>

          {/* Server-Synced Timer */}
          <div className={`exam-timer-box ${remainingSeconds < 300 ? 'urgent' : ''}`}>
            <Clock size={14} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            Finish Exam
          </button>
        </div>
      </header>

      {/* FULLSCREEN VIOLATION WARNING BANNER */}
      {fullscreenWarning && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '0.6rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontWeight: 600, borderBottom: '1px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>Fullscreen mode was exited. An integrity violation has been logged.</span>
          </div>
          <button
            type="button"
            onClick={reEnterFullscreen}
            style={{ background: '#fecaca', color: '#7f1d1d', border: 'none', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
          >
            Re-Enter Fullscreen
          </button>
        </div>
      )}

      {/* SECURITY TOAST NOTIFICATION */}
      {securityToast && (
        <div style={{ position: 'fixed', top: '60px', right: '20px', zIndex: 10000, background: '#1e293b', color: '#f8fafc', border: '1px solid #dc2626', borderRadius: '6px', padding: '0.6rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <AlertTriangle size={15} color="#f87171" />
          <span>{securityToast.msg}</span>
        </div>
      )}

      {/* WORKSPACE BODY: QUESTION SELECTOR + PROBLEM DESCRIPTION + MONACO CODE IDE */}
      {(!attempt?.problems || attempt.problems.length === 0) ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={44} color="#f59e0b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>This assignment has no questions.</h3>
          <p style={{ maxWidth: '420px', fontSize: '0.875rem', margin: '0 0 1.5rem 0', color: '#64748b' }}>
            No algorithmic challenges have been assigned to this exam. Please contact your instructor or administrator.
          </p>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              navigate('/assignments');
            }}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            Back to Assignments
          </button>
        </div>
      ) : (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 1.35fr', overflow: 'hidden', background: '#0b0f19' }}>
        
        {/* QUESTION TABS LIST & LIVE CAMERA FEED */}
        <div style={{ background: '#090d16', borderRight: '1px solid #1e293b', padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* LIVE CAMERA PREVIEW CARD (NON-BLOCKING) */}
          <div style={{
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            marginBottom: '0.85rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              background: '#0f172a',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <span className="recording-indicator-dot" style={{ background: cameraStream ? '#10b981' : '#f59e0b' }} />
                {cameraStream ? 'Live Camera' : 'Camera Disconnected'}
              </span>
              <button
                type="button"
                onClick={() => setCameraMinimized(!cameraMinimized)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.65rem' }}
              >
                {cameraMinimized ? 'Expand' : 'Minimize'}
              </button>
            </div>

            {!cameraMinimized && (
              <div style={{ height: '115px', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cameraStream ? (
                  <video
                    ref={el => {
                      activeExamVideoRef.current = el;
                      if (el && cameraStream && el.srcObject !== cameraStream) {
                        el.srcObject = cameraStream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                    Camera Offline
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#22c55e', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px' }}>
                  PROCTORED
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            Questions ({attempt?.problems?.length || 0})
          </div>

          <div style={{ display: 'grid', gap: '4px' }}>
            {attempt?.problems?.map((p, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const isSolved = p.solved;
              const hasDraft = !!codeDrafts[p.problemId]?.[language];

              return (
                <div
                  key={p.problemId}
                  onClick={() => { setActiveQuestionIdx(idx); setRunResult(null); setSubmissionResult(null); }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: isSelected ? '#1e293b' : 'transparent',
                    border: isSelected ? '1px solid var(--secondary)' : '1px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--secondary)' : '#e2e8f0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Q{idx + 1}. {p.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {p.difficulty} &bull; {p.points} pts
                    </div>
                  </div>

                  {isSolved ? (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasDraft ? 'var(--coral)' : '#334155' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PROBLEM STATEMENT & CONSTRAINTS */}
        <div className="secure-exam-problem-desc" style={{ padding: '1.25rem', overflowY: 'auto', borderRight: '1px solid #1e293b', background: '#0f172a', color: '#f8fafc' }}>
          {currentProblem ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: currentProblem.difficulty === 'EASY' ? '#065f46' : (currentProblem.difficulty === 'MEDIUM' ? '#854d0e' : '#991b1b'), color: '#f8fafc' }}>
                  {currentProblem.difficulty}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  {currentProblem.points} Points
                </span>
              </div>

              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Q{activeQuestionIdx + 1}. {currentProblem.title}
              </h3>

              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#cbd5e1', marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                {currentProblem.description}
              </div>

              {/* Question Diagram / Image if attached */}
              {currentProblem.imageUrl && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Question Diagram</div>
                  <img
                    src={currentProblem.imageUrl}
                    alt="Question Diagram"
                    style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #1e293b', background: '#090d16' }}
                  />
                </div>
              )}

              {currentProblem.constraints && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Constraints</div>
                  <pre className="notranslate" translate="no" style={{ background: '#090d16', padding: '0.65rem', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '0.8rem', color: '#e2e8f0', margin: 0, fontFamily: 'var(--font-mono)' }}>
                    {currentProblem.constraints}
                  </pre>
                </div>
              )}

              {/* Sample Testcases */}
              {currentProblem.testCasesList?.slice(0, 2).map((tc, idx) => (
                <div key={idx} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>Example {idx + 1}</div>
                  <div className="notranslate" translate="no" style={{ background: '#090d16', padding: '0.6rem', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '0.785rem', fontFamily: 'var(--font-mono)' }}>
                    <div><strong style={{ color: '#64748b' }}>Input:</strong> {tc.input}</div>
                    <div><strong style={{ color: '#64748b' }}>Output:</strong> {tc.expectedOutput}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b' }}>Select a question to begin.</p>
          )}
        </div>

        {/* CODE EDITOR OR MCQ OPTION SELECTOR */}
        {currentProblem?.questionType === 'MCQ' ? (
          <div style={{ display: 'flex', flexDirection: 'column', background: '#090d16', overflowY: 'auto', padding: '1.25rem' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Multiple Choice Question
              </span>
              <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#f8fafc' }}>
                Select the correct answer from the choices below:
              </h4>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(currentProblem.options || []).map((optText, optIdx) => {
                const optLetter = String.fromCharCode(65 + optIdx);
                const isSelected = (currentCode === optText) || (currentCode === optLetter) || (currentCode?.startsWith(optLetter + '.'));

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleCodeChange(optText)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                      border: isSelected ? '2px solid var(--secondary, #3b82f6)' : '1px solid #1e293b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--secondary, #3b82f6)' : '#1e293b',
                        color: isSelected ? '#fff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      {optLetter}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: isSelected ? '#f8fafc' : '#cbd5e1', fontWeight: isSelected ? 600 : 400 }}>
                      {optText}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitProblemCode}
                disabled={submitting || !currentCode}
                style={{ padding: '8px 20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Submit MCQ Answer
              </button>
              {currentProblem.solved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Answer Saved & Submitted
                </span>
              )}
            </div>

            {submissionResult && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '6px',
                  background: submissionResult.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${submissionResult.status === 'ACCEPTED' ? '#10b981' : '#ef4444'}`,
                  color: submissionResult.status === 'ACCEPTED' ? '#34d399' : '#f87171',
                  fontSize: '0.85rem'
                }}
              >
                {submissionResult.message || (submissionResult.status === 'ACCEPTED' ? 'Your response was recorded.' : 'Response recorded.')}
              </div>
            )}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', background: '#090d16', overflow: 'hidden' }}>
          
          {/* Editor Header */}
          <div className="notranslate" translate="no" style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0c111d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={15} color="var(--secondary)" />
              <select
                value={normActiveLang}
                onChange={e => setLanguage(e.target.value)}
                style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '3px 8px', fontSize: '0.775rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                {availableLangs.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
              Auto-saved in exam draft
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="notranslate" translate="no" style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
            <Editor
              height="100%"
              language={getMonacoLanguage(normActiveLang)}
              value={currentCode}
              onChange={handleCodeChange}
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 4
              }}
            />
          </div>

          {/* Evaluation Results Drawer */}
          {(runResult || submissionResult) && (
            <div className="notranslate" translate="no" style={{ padding: '0.75rem 1rem', background: '#0c111d', borderTop: '1px solid #1e293b', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                  {submissionResult ? 'Submission Evaluation Result' : 'Sample Run Execution'}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: (submissionResult?.status === 'ACCEPTED' || runResult?.status === 'SUCCESS' || runResult?.status === 'ACCEPTED') ? '#065f46' : '#991b1b',
                  color: 'white',
                  letterSpacing: '0.04em'
                }}>
                  {submissionResult?.status || runResult?.status}
                </span>
              </div>

              {/* Run Testcases List */}
              {runResult?.testCaseResults && runResult.testCaseResults.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto' }}>
                    {runResult.testCaseResults.map((tc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTestTab(idx)}
                        style={{
                          background: activeTestTab === idx ? '#1e293b' : '#090d16',
                          border: activeTestTab === idx ? '1px solid var(--secondary)' : '1px solid #1e293b',
                          color: tc.passed ? '#34d399' : '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {tc.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {runResult.testCaseResults[activeTestTab] && (
                    <div style={{ background: '#090d16', padding: '0.6rem', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '0.775rem', fontFamily: 'var(--font-mono)' }}>
                      <div><strong style={{ color: '#64748b' }}>Input:</strong> {runResult.testCaseResults[activeTestTab].input}</div>
                      <div><strong style={{ color: '#64748b' }}>Expected:</strong> {runResult.testCaseResults[activeTestTab].expectedOutput}</div>
                      <div><strong style={{ color: '#64748b' }}>Actual:</strong> {runResult.testCaseResults[activeTestTab].actualOutput}</div>
                      <div style={{ color: '#64748b', marginTop: '2px' }}>Runtime: {runResult.testCaseResults[activeTestTab].runtime}s</div>
                    </div>
                  )}
                </div>
              )}

              {/* Message / Compiler output */}
              {(submissionResult?.message || runResult?.message || runResult?.compilerOutput) && (
                <div style={{ fontSize: '0.785rem', color: '#cbd5e1', marginTop: '4px' }}>
                  {submissionResult?.message || runResult?.message}
                  {runResult?.compilerOutput && (
                    <pre style={{ background: '#090d16', padding: '6px', borderRadius: '4px', marginTop: '4px', color: '#f87171', fontSize: '0.75rem', overflowX: 'auto' }}>
                      {runResult.compilerOutput}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editor Action Controls */}
          <div className="notranslate" translate="no" style={{ padding: '0.65rem 1rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0c111d' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={activeQuestionIdx === 0}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionIdx(prev => Math.min((attempt?.problems?.length || 1) - 1, prev + 1))}
                disabled={activeQuestionIdx === (attempt?.problems?.length || 1) - 1}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRunSampleCode}
                disabled={running || submitting}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Play size={13} /> {running ? 'Testing...' : 'Run Samples'}
              </button>

              <button
                type="button"
                onClick={handleSubmitProblemCode}
                disabled={running || submitting}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <Send size={13} /> {submitting ? 'Evaluating...' : 'Submit Question'}
              </button>
            </div>
          </div>

        </div>
        )}

      </div>
      )}

      {/* CONFIRMATION SUBMIT MODAL */}
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', background: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
              Finish Assessment?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Are you sure you want to submit your assessment? Once finalized, no further code modifications will be permitted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="btn btn-secondary btn-sm"
              >
                Continue Coding
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SecureExamMode;
