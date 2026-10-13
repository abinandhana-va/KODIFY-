import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import ContestCodeEditor from './ContestCodeEditor';
import { getAvailableLanguagesForProblem, getDefaultStarterCode, normalizeLanguageId, SUPPORTED_LANGUAGES } from './utils/languageRegistry';
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Send,
  ArrowLeft,
  Lock,
  Hourglass,
  Calendar,
  Award,
  Check,
  Edit3,
  FileCode,
  Terminal,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronRight,
  Maximize2,
  RefreshCw,
  X,
  Camera,
  Mic,
  Video,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

function ContestArena() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unregisteredError, setUnregisteredError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Security Check States (Camera, Mic, Fullscreen)
  const [securityChecked, setSecurityChecked] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [securityCheckError, setSecurityCheckError] = useState('');
  const [verifyingSecurity, setVerifyingSecurity] = useState(false);
  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Violation & Termination States
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [violationWarningMsg, setViolationWarningMsg] = useState('');
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  // Timer & countdown
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef(null);

  // Active question & editor states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [language, setLanguage] = useState('PYTHON');
  // Store code per problemId and language
  const [codeMap, setCodeMap] = useState({});

  // Execution & Verdict states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState('VERDICT'); // VERDICT, LEADERBOARD

  // Rules confirmation states
  const [agreedCheckbox, setAgreedCheckbox] = useState(false);
  const [confirmingRules, setConfirmingRules] = useState(false);

  // Live Leaderboard
  const [liveLeaderboard, setLiveLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Poll leaderboard interval
  useEffect(() => {
    fetchLiveLeaderboard();
    const pollInterval = setInterval(fetchLiveLeaderboard, 15000);
    return () => clearInterval(pollInterval);
  }, [id]);

  const fetchLiveLeaderboard = async () => {
    try {
      const res = await axios.get(`/api/contests/${id}/leaderboard`);
      setLiveLeaderboard(res.data || []);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
  };

  const fetchArenaState = async () => {
    try {
      setLoading(true);
      setUnregisteredError(null);
      setGeneralError(null);

      const res = await axios.post(`/api/contests/${id}/enter-arena`);
      const data = res.data;
      setContest(data);
      setRemainingSeconds(data.remainingSeconds || 0);

      if (data.participantStatus === 'DISQUALIFIED' || data.fullscreenViolations >= 3) {
        setIsTerminated(true);
        setTerminationReason(data.terminationReason || 'Contest session was terminated due to security violations.');
      }
      if (data.fullscreenViolations) {
        setFullscreenViolations(data.fullscreenViolations);
      }
      if (data.cameraPermissionGranted && data.micPermissionGranted) {
        setCameraAllowed(true);
        setMicAllowed(true);
        setSecurityChecked(true);
      }

      // Initialize code templates
      const questions = data.questions || [];
      if (questions.length > 0) {
        initDefaultCodes(questions);
      }
    } catch (err) {
      console.error("Enter arena error:", err);
      const errMsg = err.response?.data?.message || err.response?.data || "";
      if (errMsg.toLowerCase().includes("register")) {
        setUnregisteredError("You must register for this contest first.");
      } else {
        setGeneralError(errMsg || "Unable to access contest arena.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArenaState();
  }, [id]);

  // Synchronized countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Trigger refresh to transition from waiting room to arena or finish round
          fetchArenaState();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contest?.waitingRoom, contest?.isArenaUnlocked]);

  // Handle media & security checks
  const handleTestCamera = async () => {
    try {
      setSecurityCheckError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCameraAllowed(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setSecurityCheckError('Camera permission was denied. Please allow camera access in your browser settings to continue.');
    }
  };

  const handleTestMic = async () => {
    try {
      setSecurityCheckError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      console.error("Microphone access error:", err);
      setSecurityCheckError('Microphone permission was denied. Please allow microphone access in your browser settings to continue.');
    }
  };

  const handleTestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenActive(true);
    } catch (err) {
      console.error("Fullscreen error:", err);
      setSecurityCheckError('Unable to enter fullscreen mode. Please press F11 or check browser permissions.');
    }
  };

  const handleCompleteSecurityCheck = async () => {
    if (!cameraAllowed || !micAllowed) {
      setSecurityCheckError('You must grant both Camera and Microphone permissions before entering the contest.');
      return;
    }
    try {
      setVerifyingSecurity(true);
      await axios.post(`/api/contests/${id}/security/check`, {
        cameraGranted: true,
        micGranted: true
      });
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {
          console.warn("Fullscreen request error:", e);
        }
      }
      setSecurityChecked(true);
    } catch (err) {
      console.error("Security check submission failed:", err);
      setSecurityCheckError(err.response?.data?.message || 'Failed to record security verification on server.');
    } finally {
      setVerifyingSecurity(false);
    }
  };

  const handleReEnterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setViolationModalOpen(false);
    } catch (e) {
      console.warn("Fullscreen request error:", e);
      setViolationModalOpen(false);
    }
  };

  // Fullscreen violation listener during active arena
  useEffect(() => {
    const isContestEndedNow = contest?.hasEnded || remainingSeconds <= 0;
    const isArenaActive = contest?.isArenaUnlocked && !contest?.waitingRoom && contest?.agreedToRules && securityChecked && !isContestEndedNow && !isTerminated;
    if (!isArenaActive) return;

    const handleFullscreenChange = async () => {
      const isFs = !!document.fullscreenElement;
      setFullscreenActive(isFs);

      if (!isFs && !isTerminated) {
        try {
          const res = await axios.post(`/api/contests/${id}/security/event`, {
            eventType: 'FULLSCREEN_EXIT',
            details: 'Participant exited fullscreen during active contest'
          });

          const currentViolations = res.data?.violations || 1;
          const terminated = res.data?.terminated || currentViolations >= 3;
          setFullscreenViolations(currentViolations);

          if (terminated) {
            setIsTerminated(true);
            setTerminationReason(res.data?.message || 'Contest attempt terminated due to 3 fullscreen exit security violations.');
            setViolationModalOpen(false);
          } else {
            setViolationModalOpen(true);
            if (currentViolations === 1) {
              setViolationWarningMsg('Warning 1/3: You exited fullscreen mode. Exiting fullscreen is a proctoring violation. Please return to fullscreen immediately.');
            } else if (currentViolations === 2) {
              setViolationWarningMsg('Warning 2/3 (FINAL WARNING): You have exited fullscreen twice. One more exit will immediately TERMINATE your contest session and disqualify your submissions!');
            }
          }
        } catch (err) {
          console.error("Failed to record security event:", err);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [id, contest?.isArenaUnlocked, contest?.waitingRoom, contest?.agreedToRules, securityChecked, remainingSeconds, isTerminated]);

  const initDefaultCodes = (questions) => {
    const newCodeMap = { ...codeMap };
    questions.forEach(q => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        const key = `${q.problemId}_${lang.id}`;
        if (!newCodeMap[key]) {
          if (lang.id === 'PYTHON') newCodeMap[key] = q.starterCodePython || getDefaultStarterCode('PYTHON');
          else if (lang.id === 'JAVA') newCodeMap[key] = q.starterCodeJava || getDefaultStarterCode('JAVA');
          else if (lang.id === 'C') newCodeMap[key] = q.starterCodeC || getDefaultStarterCode('C');
          else if (lang.id === 'CPP') newCodeMap[key] = q.starterCodeCpp || getDefaultStarterCode('CPP');
          else if (lang.id === 'JAVASCRIPT') newCodeMap[key] = q.starterCodeJs || getDefaultStarterCode('JAVASCRIPT');
          else if (lang.id === 'GO') newCodeMap[key] = q.starterCodeGo || getDefaultStarterCode('GO');
          else if (lang.id === 'RUST') newCodeMap[key] = q.starterCodeRust || getDefaultStarterCode('RUST');
          else newCodeMap[key] = getDefaultStarterCode(lang.id);
        }
      });
    });
    setCodeMap(newCodeMap);
  };

  const currentProblem = contest?.questions?.[activeQuestionIdx];
  const availableLangs = getAvailableLanguagesForProblem(currentProblem);

  // Sync active language with current problem's allowed languages
  useEffect(() => {
    if (availableLangs && availableLangs.length > 0) {
      const isCurrentAllowed = availableLangs.some(l => l.id === language || l.name === language);
      if (!isCurrentAllowed) {
        setLanguage(availableLangs[0].id);
      }
    }
  }, [activeQuestionIdx, currentProblem?.problemId]);

  const currentCodeKey = currentProblem ? `${currentProblem.problemId}_${language}` : '';
  const currentCode = codeMap[currentCodeKey] || '';

  const handleCodeChange = (newCode) => {
    if (!currentProblem) return;
    setCodeMap(prev => ({
      ...prev,
      [currentCodeKey]: newCode
    }));
  };

  const handleResetCode = () => {
    if (!currentProblem) return;
    let defaultCode = '';
    const normLang = normalizeLanguageId(language);
    if (normLang === 'PYTHON') defaultCode = currentProblem.starterCodePython || getDefaultStarterCode('PYTHON');
    else if (normLang === 'JAVA') defaultCode = currentProblem.starterCodeJava || getDefaultStarterCode('JAVA');
    else if (normLang === 'C') defaultCode = currentProblem.starterCodeC || getDefaultStarterCode('C');
    else if (normLang === 'CPP') defaultCode = currentProblem.starterCodeCpp || getDefaultStarterCode('CPP');
    else if (normLang === 'JAVASCRIPT') defaultCode = currentProblem.starterCodeJs || getDefaultStarterCode('JAVASCRIPT');
    else if (normLang === 'GO') defaultCode = currentProblem.starterCodeGo || getDefaultStarterCode('GO');
    else if (normLang === 'RUST') defaultCode = currentProblem.starterCodeRust || getDefaultStarterCode('RUST');
    else defaultCode = getDefaultStarterCode(normLang);

    setCodeMap(prev => ({
      ...prev,
      [currentCodeKey]: defaultCode
    }));
  };

  const handleSelectQuestion = (idx) => {
    setActiveQuestionIdx(idx);
    setRunResult(null);
    setSubmissionResult(null);
  };

  const handleConfirmRules = async () => {
    if (!agreedCheckbox) return;
    try {
      setConfirmingRules(true);
      await axios.post(`/api/contests/${id}/confirm-rules`);
      setContest(prev => ({ ...prev, agreedToRules: true }));
    } catch (err) {
      console.error("Rule confirmation failed:", err);
    } finally {
      setConfirmingRules(false);
    }
  };

  const handleRunSample = async () => {
    if (!currentProblem || !currentCode.trim()) return;
    try {
      setRunning(true);
      setRunResult(null);
      setSubmissionResult(null);
      setActiveBottomTab('VERDICT');

      const res = await axios.post(`/api/contests/${id}/problems/${currentProblem.problemId}/run`, {
        code: currentCode,
        language
      });
      setRunResult(res.data);
    } catch (err) {
      console.error("Run error:", err);
      setRunResult({
        status: 'ERROR',
        message: err.response?.data?.message || 'Error executing test cases.'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!currentProblem || !currentCode.trim()) return;
    try {
      setSubmitting(true);
      setRunResult(null);
      setSubmissionResult(null);
      setActiveBottomTab('VERDICT');

      const res = await axios.post(`/api/contests/${id}/problems/${currentProblem.problemId}/submit`, {
        code: currentCode,
        language
      });
      setSubmissionResult(res.data);

      // Refresh contest details to update solved checkmarks and live score
      fetchArenaState();
      fetchLiveLeaderboard();
    } catch (err) {
      console.error("Submit error:", err);
      setSubmissionResult({
        status: 'ERROR',
        message: err.response?.data?.message || 'Error submitting contest solution.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  // =========================================================================
  // VIEW: UNREGISTERED / ERROR STATE
  // =========================================================================
  if (unregisteredError || generalError) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '2rem auto' }}>
        <div
          className="dashboard-card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            background: 'radial-gradient(ellipse at top, rgba(239, 68, 68, 0.08) 0%, var(--card-bg) 80%)'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <Lock size={26} />
          </div>

          <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--text)' }}>
            Arena Access Restricted
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {unregisteredError || generalError}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to={`/contests/${id}`} className="btn btn-primary" style={{ fontWeight: 800, padding: '0.65rem 1.5rem' }}>
              Go to Contest Details & Register →
            </Link>
            <Link to="/contests" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
              View All Contests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <Hourglass size={32} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '0.75rem' }} />
        <h3 style={{ margin: 0, color: 'var(--text)' }}>Entering KODIFY Contest Arena...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Connecting to isolated execution cluster</p>
      </div>
    );
  }

  if (!contest) return null;

  // =========================================================================
  // VIEW: TERMINATED / DISQUALIFIED SECURITY RESULT SCREEN
  // =========================================================================
  if (isTerminated || contest.participantStatus === 'DISQUALIFIED') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '2rem auto' }}>
        <div
          className="dashboard-card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            border: '2px solid #dc2626',
            background: 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.1) 0%, var(--card-bg) 80%)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.15)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', background: '#fee2e2', color: '#dc2626', padding: '3px 12px', borderRadius: '12px' }}>
            SECURITY VIOLATION TERMINATION
          </span>

          <h2 style={{ margin: '1rem 0 0.5rem 0', fontWeight: 800, color: 'var(--text)', fontSize: '1.6rem' }}>
            Contest Session Disqualified
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            {terminationReason || 'Your contest session has been permanently terminated due to repeated fullscreen integrity violations (3 strikes threshold reached). Submissions and execution access are revoked.'}
          </p>

          <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1rem 1.5rem', maxWidth: '500px', margin: '0 auto 2rem auto', border: '1px solid var(--border)', textAlign: 'left', fontSize: '0.85rem', display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Disqualification Reason:</span>
              <strong style={{ color: '#dc2626' }}>Exceeded Max Fullscreen Exits (3/3)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <strong style={{ color: '#dc2626' }}>DISQUALIFIED</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Recorded Score:</span>
              <strong>{contest.userScore || 0} pts</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to={`/contests/${id}`} className="btn btn-secondary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>
              ← Return to Contest Summary
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: PARTICIPANT RULES CONFIRMATION MODAL
  // =========================================================================
  if (contest.registered && !contest.agreedToRules && !contest.hasEnded) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/contests/${id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Contest Details
          </Link>
        </div>

        <div
          className="dashboard-card"
          style={{
            padding: '2rem',
            border: '1.5px solid var(--primary)',
            background: 'radial-gradient(ellipse at top, rgba(0, 129, 167, 0.08) 0%, var(--card-bg) 75%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 129, 167, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                  Participant Verification & Arena Entry
                </h2>
                <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  Please confirm your credentials and agree to the contest guidelines before entering.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>
              ✓ REGISTERED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-hover)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Participant Details
              </div>
              <div style={{ fontSize: '0.875rem', display: 'grid', gap: '4px', color: 'var(--text)' }}>
                <div><strong>Name:</strong> {user?.name || user?.username}</div>
                <div><strong>Username:</strong> @{user?.username}</div>
                <div><strong>Email:</strong> {user?.email}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Round Details
              </div>
              <div style={{ fontSize: '0.875rem', display: 'grid', gap: '4px', color: 'var(--text)' }}>
                <div><strong>Contest:</strong> {contest.title}</div>
                <div><strong>Start Time:</strong> {formatDateTime(contest.startTime)}</div>
                <div><strong>Duration:</strong> {contest.durationMinutes ? `${contest.durationMinutes} Minutes` : '2 Hours'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--primary)" /> Contest Rules
            </h4>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, display: 'grid', gap: '6px' }}>
              <li><strong>Authoritative Timer:</strong> The server timer governs problem availability. Late submissions will be rejected.</li>
              <li><strong>Original Work:</strong> All submitted solutions must be written by you. AI generation is audited post-contest.</li>
              <li><strong>Public vs Full Cases:</strong> 'RUN' tests against sample test cases only without penalty. 'SUBMIT' triggers full evaluation for points.</li>
              <li><strong>Leaderboard:</strong> Total points awarded &gt; Earliest accepted elapsed penalty time.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={agreedCheckbox}
                onChange={e => setAgreedCheckbox(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>I understand the contest rules and agree to participate under academic honesty.</span>
            </label>

            <button
              type="button"
              onClick={handleConfirmRules}
              disabled={!agreedCheckbox || confirmingRules}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                background: agreedCheckbox ? 'var(--primary)' : 'var(--tag-bg)',
                color: agreedCheckbox ? '#ffffff' : 'var(--text-muted)',
                cursor: agreedCheckbox ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {confirmingRules ? 'Entering...' : 'ENTER CONTEST ARENA →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: PRE-CONTEST SECURITY & DEVICE CHECK SCREEN
  // =========================================================================
  if (contest.registered && contest.agreedToRules && !securityChecked && !contest.waitingRoom && !contest.hasEnded) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/contests/${id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Contest
          </Link>
        </div>

        <div
          className="dashboard-card"
          style={{
            padding: '2rem',
            border: '1.5px solid var(--primary)',
            background: 'radial-gradient(ellipse at top, rgba(0, 129, 167, 0.08) 0%, var(--card-bg) 75%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 129, 167, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                  Contest Security &amp; Device Check
                </h2>
                <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  Verify your camera, microphone, and fullscreen environment before entering the arena.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)' }}>
              SECURITY CHECK
            </span>
          </div>

          {securityCheckError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{securityCheckError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Camera Check */}
            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1.25rem', border: `1.5px solid ${cameraAllowed ? '#16a34a' : 'var(--border)'}`, textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: cameraAllowed ? 'rgba(34, 197, 94, 0.15)' : 'var(--card-bg)', color: cameraAllowed ? '#16a34a' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Camera size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '0.95rem' }}>Camera Permission</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Required for proctoring verification</p>
              
              <video ref={videoPreviewRef} autoPlay playsInline muted style={{ width: '100%', height: cameraAllowed ? '110px' : '0px', borderRadius: '6px', background: '#000', objectFit: 'cover', display: cameraAllowed ? 'block' : 'none', marginBottom: '0.75rem' }} />

              <button
                type="button"
                onClick={handleTestCamera}
                className={`btn btn-sm ${cameraAllowed ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%', fontWeight: 700, fontSize: '0.8rem' }}
              >
                {cameraAllowed ? '✓ Camera Permitted' : 'Allow Camera'}
              </button>
            </div>

            {/* Mic Check */}
            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1.25rem', border: `1.5px solid ${micAllowed ? '#16a34a' : 'var(--border)'}`, textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: micAllowed ? 'rgba(34, 197, 94, 0.15)' : 'var(--card-bg)', color: micAllowed ? '#16a34a' : 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Mic size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '0.95rem' }}>Microphone Permission</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Required for audio environment integrity</p>

              <button
                type="button"
                onClick={handleTestMic}
                className={`btn btn-sm ${micAllowed ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%', fontWeight: 700, fontSize: '0.8rem', marginTop: cameraAllowed ? '118px' : '0' }}
              >
                {micAllowed ? '✓ Microphone Permitted' : 'Allow Microphone'}
              </button>
            </div>

            {/* Fullscreen Check */}
            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: fullscreenActive ? 'rgba(34, 197, 94, 0.15)' : 'var(--card-bg)', color: fullscreenActive ? '#16a34a' : '#f07167', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Maximize2 size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '0.95rem' }}>Fullscreen Proctoring</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Max 3 fullscreen exits permitted</p>

              <button
                type="button"
                onClick={handleTestFullscreen}
                className={`btn btn-sm ${fullscreenActive ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%', fontWeight: 700, fontSize: '0.8rem', marginTop: cameraAllowed ? '118px' : '0' }}
              >
                {fullscreenActive ? '✓ Fullscreen Active' : 'Enter Fullscreen'}
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Enforced policy: <strong>Max 3 Fullscreen Exits</strong>. 3rd exit permanently terminates contest session.
            </div>

            <button
              type="button"
              onClick={handleCompleteSecurityCheck}
              disabled={!cameraAllowed || !micAllowed || verifyingSecurity}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                opacity: (!cameraAllowed || !micAllowed) ? 0.6 : 1,
                cursor: (!cameraAllowed || !micAllowed) ? 'not-allowed' : 'pointer'
              }}
            >
              {verifyingSecurity ? 'Verifying...' : 'START CONTEST ARENA →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: WAITING ROOM COUNTDOWN (IF BEFORE START TIME)
  // =========================================================================
  if (contest.waitingRoom) {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return (
      <div className="animate-fade-in" style={{ maxWidth: '950px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/contests" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Contests
          </Link>
        </div>

        <div
          className="dashboard-card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            border: '1.5px solid var(--primary)',
            background: 'radial-gradient(ellipse at top, rgba(0, 129, 167, 0.1) 0%, var(--card-bg) 75%)'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem' }}>
            <Hourglass size={14} /> CONTEST WAITING ROOM
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            {contest.title}
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            {contest.description || 'The contest arena will unlock automatically when the countdown reaches zero. Prepare your development environment.'}
          </p>

          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
            CONTEST STARTS IN
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.5rem', minWidth: '95px' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{String(hours).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours</div>
            </div>
            <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.5rem', minWidth: '95px' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>{String(minutes).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Minutes</div>
            </div>
            <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.5rem', minWidth: '95px' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f07167', fontFamily: 'var(--font-mono)' }}>{String(seconds).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seconds</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-hover)', borderRadius: '10px', padding: '1.25rem 1.5rem', textAlign: 'left', maxWidth: '700px', margin: '0 auto', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.85rem', color: 'var(--text)' }}>
              <div><strong>Start Time:</strong> {formatDateTime(contest.startTime)}</div>
              <div><strong>Duration:</strong> {contest.durationMinutes} Minutes</div>
              <div><strong>Problems:</strong> {contest.questionCount || contest.questions?.length || 0} Questions</div>
              <div><strong>Scoring:</strong> {contest.scoringMethod || 'ACM/ICPC'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: CONTEST ENDED BANNER (WHEN TIME EXPIRES)
  // =========================================================================
  const isContestEnded = contest.hasEnded || remainingSeconds <= 0;

  // =========================================================================
  // VIEW: 3-PANE DEDICATED CONTEST ARENA WORKSPACE
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '1600px', margin: '0 auto', minHeight: '85vh' }}>
      
      {/* 1. TOP STATUS BAR: KODIFY CONTEST | TIME LEFT | SCORE | RANK */}
      <div
        className="dashboard-card"
        style={{
          padding: '0.75rem 1.25rem',
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '2px solid var(--primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/contests" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Back to Contests">
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
                {contest.title}
              </span>
              {isContestEnded ? (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', background: '#64748b', padding: '2px 8px', borderRadius: '4px' }}>
                  CONTEST ENDED
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', background: '#ef4444', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} /> LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {contest.organizationName || 'KODIFY'} &bull; {contest.contestType === 'OPEN' ? 'Flexible Start' : 'Synchronized Round'}
            </div>
          </div>
        </div>

        {/* METRICS: TIME LEFT | SCORE | RANK */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* TIME LEFT */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              background: remainingSeconds < 300 && !isContestEnded ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-hover)',
              border: `1px solid ${remainingSeconds < 300 && !isContestEnded ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
              color: remainingSeconds < 300 && !isContestEnded ? '#ef4444' : 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.05rem'
            }}
          >
            <Clock size={15} color={remainingSeconds < 300 && !isContestEnded ? '#ef4444' : 'var(--primary)'} />
            <span>{isContestEnded ? '00:00:00' : formatTimer(remainingSeconds)}</span>
          </div>

          {/* SCORE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.85rem', borderRadius: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SCORE</span>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>{contest.userScore || 0} pts</span>
          </div>

          {/* RANK */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.85rem', borderRadius: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOLVED</span>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#16a34a' }}>{contest.userProblemsSolved || 0}/{contest.questions?.length || 0}</span>
          </div>

          {isContestEnded ? (
            <Link to={`/contests/${id}`} className="btn btn-primary btn-sm" style={{ fontWeight: 800, padding: '0.45rem 1rem' }}>
              VIEW RESULTS →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setActiveBottomTab(prev => prev === 'LEADERBOARD' ? 'VERDICT' : 'LEADERBOARD')}
              className={`btn btn-sm ${activeBottomTab === 'LEADERBOARD' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Trophy size={14} /> {activeBottomTab === 'LEADERBOARD' ? 'Hide Rankings' : 'Live Standings'}
            </button>
          )}
        </div>
      </div>

      {isContestEnded && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              This contest has concluded. Submissions and sample executions are now closed.
            </span>
          </div>
          <Link to={`/contests/${id}`} className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
            VIEW FINAL RESULTS & LEADERBOARD →
          </Link>
        </div>
      )}

      {/* 2. MAIN 3-PANE WORKSPACE: PROBLEMS | PROBLEM STATEMENT | CONTEST CODE EDITOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1.2fr', gap: '0.75rem', alignItems: 'stretch', flex: 1 }}>
        
        {/* PANE 1: PROBLEMS LIST */}
        <div className="dashboard-card" style={{ padding: '0.85rem', margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            Problems ({contest.questions?.length || 0})
          </div>

          <div style={{ display: 'grid', gap: '0.45rem', overflowY: 'auto' }}>
            {(contest.questions || []).map((q, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const isSolved = q.solved;
              const letter = String.fromCharCode(65 + idx); // A, B, C, D...

              return (
                <div
                  key={q.problemId}
                  onClick={() => handleSelectQuestion(idx)}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 129, 167, 0.1)' : 'var(--card-bg)',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span
                      style={{
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        color: isSolved ? '#16a34a' : (isSelected ? 'var(--primary)' : 'var(--text)')
                      }}
                    >
                      {letter} {isSolved && '✓'}
                    </span>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.8rem', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {q.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {q.points || 100} pts &bull; {q.difficulty}
                      </div>
                    </div>
                  </div>

                  {isSolved && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a' }}>
                      +{q.points}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PANE 2: PROBLEM STATEMENT + CONSTRAINTS + SAMPLES */}
        <div className="dashboard-card" style={{ padding: '1.25rem', margin: 0, overflowY: 'auto', maxHeight: '700px' }}>
          {currentProblem ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: currentProblem.difficulty === 'EASY' ? 'rgba(34, 197, 94, 0.15)' : (currentProblem.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                    color: currentProblem.difficulty === 'EASY' ? '#166534' : (currentProblem.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                  }}
                >
                  {currentProblem.difficulty}
                </span>

                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                  {currentProblem.points || 100} Points
                </span>
              </div>

              <h2 style={{ margin: '0 0 0.85rem 0', fontWeight: 800, color: 'var(--text)', fontSize: '1.2rem' }}>
                {String.fromCharCode(65 + activeQuestionIdx)}. {currentProblem.title}
              </h2>

              <div style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                {currentProblem.description}
              </div>

              {currentProblem.constraints && (
                <div style={{ marginBottom: '1rem', background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Constraints</div>
                  <pre style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>{currentProblem.constraints}</pre>
                </div>
              )}

              {/* Sample Test Cases */}
              {currentProblem.testCasesList && currentProblem.testCasesList.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Public Sample Test Cases</div>
                  {currentProblem.testCasesList.map((tc, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-hover)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>Sample Input {idx + 1}:</div>
                      <pre style={{ margin: '0 0 6px 0', background: 'var(--card-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>{tc.input}</pre>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>Expected Output {idx + 1}:</div>
                      <pre style={{ margin: 0, background: 'var(--card-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>{tc.expectedOutput}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select a problem from the left panel.</p>
          )}
        </div>

        {/* PANE 3: DEDICATED CONTEST CODE EDITOR */}
        <div style={{ height: '100%', minHeight: '520px' }}>
          <ContestCodeEditor
            language={language}
            onLanguageChange={setLanguage}
            code={currentCode}
            onCodeChange={handleCodeChange}
            onResetCode={handleResetCode}
            onRun={handleRunSample}
            onSubmit={handleSubmitSolution}
            running={running}
            submitting={submitting}
            disabled={isContestEnded}
            availableLanguages={availableLangs}
          />
        </div>
      </div>

      {/* 3. BOTTOM PANEL: VERDICTS & RESULTS or LIVE LEADERBOARD */}
      <div className="dashboard-card" style={{ padding: '1rem', margin: 0 }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setActiveBottomTab('VERDICT')}
            style={{
              background: activeBottomTab === 'VERDICT' ? 'var(--primary)' : 'var(--tag-bg)',
              color: activeBottomTab === 'VERDICT' ? '#ffffff' : 'var(--text)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Execution Verdict
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('LEADERBOARD')}
            style={{
              background: activeBottomTab === 'LEADERBOARD' ? 'var(--primary)' : 'var(--tag-bg)',
              color: activeBottomTab === 'LEADERBOARD' ? '#ffffff' : 'var(--text)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trophy size={13} /> Live Ranking ({liveLeaderboard.length})
          </button>
        </div>

        {/* TAB 1: VERDICTS */}
        {activeBottomTab === 'VERDICT' && (
          <div>
            {!runResult && !submissionResult && !running && !submitting && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                Run sample test cases or submit your solution to inspect real-time evaluation results.
              </div>
            )}

            {(running || submitting) && (
              <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Hourglass size={18} style={{ animation: 'spin 2s linear infinite', verticalAlign: 'middle', marginRight: '6px' }} />
                {submitting ? 'Executing official test cases in sandbox...' : 'Testing sample cases...'}
              </div>
            )}

            {(runResult || submissionResult) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)' }}>
                    {submissionResult ? 'Official Submission Verdict' : 'Sample Run Verdict'}
                  </span>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: (submissionResult?.status === 'ACCEPTED' || runResult?.status === 'ACCEPTED') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: (submissionResult?.status === 'ACCEPTED' || runResult?.status === 'ACCEPTED') ? '#16a34a' : '#ef4444'
                    }}
                  >
                    {submissionResult?.status || runResult?.status}
                    {submissionResult?.solved ? ` (+${currentProblem?.points || 100} pts)` : ''}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  {submissionResult?.message || runResult?.message || 'Execution completed.'}
                  {(submissionResult?.runtime || runResult?.runtime) && ` • Runtime: ${submissionResult?.runtime || runResult?.runtime}s`}
                </div>

                {/* TEST CASE PILLS */}
                {(submissionResult?.testCaseResults || runResult?.testCaseResults) && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(submissionResult?.testCaseResults || runResult?.testCaseResults).map((tc, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: tc.passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: tc.passed ? '#16a34a' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {tc.passed ? <Check size={11} strokeWidth={3} /> : '✗'} Test Case {idx + 1} ({tc.runtime ? `${tc.runtime}s` : '0ms'})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE LEADERBOARD */}
        {activeBottomTab === 'LEADERBOARD' && (
          <div style={{ overflowX: 'auto' }}>
            {liveLeaderboard.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No competitor submissions recorded yet.
              </div>
            ) : (
              <table className="admin-table" style={{ width: '100%', fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Participant</th>
                    <th>Score</th>
                    <th>Solved</th>
                    <th>Penalty Time</th>
                  </tr>
                </thead>
                <tbody>
                  {liveLeaderboard.map((entry) => (
                    <tr key={entry.userId} style={{ background: entry.userId === user?.id ? 'rgba(0, 129, 167, 0.08)' : 'transparent' }}>
                      <td style={{ fontWeight: 800, color: entry.rank === 1 ? '#eab308' : (entry.rank === 2 ? '#94a3b8' : (entry.rank === 3 ? '#b45309' : 'var(--text)')) }}>
                        {entry.rank === 1 ? '🥇 1' : (entry.rank === 2 ? '🥈 2' : (entry.rank === 3 ? '🥉 3' : `#${entry.rank}`))}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {entry.name || entry.username} {entry.userId === user?.id && <span style={{ color: 'var(--primary)', fontWeight: 800 }}>(You)</span>}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{entry.score} pts</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>{entry.problemsSolved}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{entry.formattedTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* FULLSCREEN VIOLATION WARNING MODAL */}
      {violationModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 15000, background: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '520px', border: '2px solid #dc2626', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={30} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#dc2626', fontSize: '1.25rem' }}>
              SECURITY INTEGRITY WARNING ({fullscreenViolations} / 3 Strikes)
            </h3>

            <p style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {violationWarningMsg}
            </p>

            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Note: Fullscreen exits are logged server-side with timestamps. Refreshing or switching windows will not reset strikes.
            </div>

            <button
              type="button"
              onClick={handleReEnterFullscreen}
              className="btn btn-danger"
              style={{ width: '100%', padding: '0.75rem', fontWeight: 800, fontSize: '0.9rem' }}
            >
              RE-ENTER FULLSCREEN NOW →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContestArena;
