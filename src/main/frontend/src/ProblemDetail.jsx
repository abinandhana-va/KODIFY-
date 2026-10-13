import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Send, AlertCircle, Code2, Terminal, CheckCircle2, XCircle, Clock, AlertTriangle, Info, Eye, Lock, Copy, Check, Lightbulb, BookOpen, ChevronRight } from 'lucide-react';
import { getAvailableLanguagesForProblem, getMonacoLanguage, getDefaultStarterCode, normalizeLanguageId, SUPPORTED_LANGUAGES } from './utils/languageRegistry';

function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [language, setLanguage] = useState('Python');

  // Per-language in-memory code state (preserves typed code across language switches)
  const [codeState, setCodeState] = useState({
    C: getDefaultStarterCode('C'),
    Python: getDefaultStarterCode('PYTHON'),
    Java: getDefaultStarterCode('JAVA'),
    'C++': getDefaultStarterCode('CPP'),
    CPP: getDefaultStarterCode('CPP'),
    JavaScript: getDefaultStarterCode('JAVASCRIPT'),
    JAVASCRIPT: getDefaultStarterCode('JAVASCRIPT'),
    Go: getDefaultStarterCode('GO'),
    GO: getDefaultStarterCode('GO'),
    Rust: getDefaultStarterCode('RUST'),
    RUST: getDefaultStarterCode('RUST'),
    TypeScript: getDefaultStarterCode('TYPESCRIPT'),
    TYPESCRIPT: getDefaultStarterCode('TYPESCRIPT')
  });

  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Progressive Hints State
  const [revealedHintCount, setRevealedHintCount] = useState(0);

  // Editorial Viewing State
  const [hasAttempted, setHasAttempted] = useState(false);
  const [editorialModalOpen, setEditorialModalOpen] = useState(false);
  const [editorialLoading, setEditorialLoading] = useState(false);
  const [editorialData, setEditorialData] = useState(null);

  // Reference Solution Viewing State
  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionData, setSolutionData] = useState(null);
  const [solutionTab, setSolutionTab] = useState('Python');
  const [copied, setCopied] = useState(false);

  const checkUserAttempt = async () => {
    try {
      const res = await axios.get('/api/submissions/my');
      const userSubs = res.data || [];
      const attempted = userSubs.some(s => String(s.problemId) === String(id));
      setHasAttempted(attempted);
    } catch (err) {
      console.error("Error checking user submissions:", err);
    }
  };

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/problems/' + id);
        const p = res.data;
        setProblem(p);

        // Populate initial starter code for each language from API response or defaults
        setCodeState({
          C: p.starterCodeC || getDefaultStarterCode('C'),
          Python: p.starterCodePython || getDefaultStarterCode('PYTHON'),
          Java: p.starterCodeJava || getDefaultStarterCode('JAVA'),
          'C++': p.starterCodeCpp || getDefaultStarterCode('CPP'),
          CPP: p.starterCodeCpp || getDefaultStarterCode('CPP'),
          JavaScript: p.starterCodeJs || getDefaultStarterCode('JAVASCRIPT'),
          JAVASCRIPT: p.starterCodeJs || getDefaultStarterCode('JAVASCRIPT'),
          Go: p.starterCodeGo || getDefaultStarterCode('GO'),
          GO: p.starterCodeGo || getDefaultStarterCode('GO'),
          Rust: p.starterCodeRust || getDefaultStarterCode('RUST'),
          RUST: p.starterCodeRust || getDefaultStarterCode('RUST'),
          TypeScript: getDefaultStarterCode('TYPESCRIPT'),
          TYPESCRIPT: getDefaultStarterCode('TYPESCRIPT')
        });

        const avail = getAvailableLanguagesForProblem(p);
        if (avail && avail.length > 0) {
          setLanguage(avail[0].id);
        }

        await checkUserAttempt();
      } catch (err) {
        console.error("Error fetching problem details:", err);
        setError('Failed to load problem workspace.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setSubmissionResult(null);
    setRunResult(null);
  };

  const handleCodeChange = (value) => {
    setCodeState(prev => ({
      ...prev,
      [language]: value || ''
    }));
  };

  const currentCode = codeState[language] || '';

  const handleRunCode = async () => {
    if (!currentCode || currentCode.trim() === '') {
      alert('Please enter your code before running.');
      return;
    }

    try {
      setRunning(true);
      setSubmissionResult(null);
      setRunResult(null);

      const res = await axios.post(`/api/problems/${id}/run`, {
        language: normalizeLanguageId(language),
        code: currentCode
      });
      setRunResult(res.data);
    } catch (err) {
      console.error("Run error:", err);
      setRunResult({
        status: 'ERROR',
        message: err.response?.data?.message || err.response?.data || 'Error running code against visible test cases.'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitClick = () => {
    if (!currentCode || currentCode.trim() === '') {
      alert('Please write code before submitting.');
      return;
    }
    setShowSubmitModal(true);
  };

  const handleProceedSubmit = async () => {
    try {
      setSubmitting(true);
      setRunResult(null);
      setSubmissionResult(null);

      const res = await axios.post(`/api/problems/${id}/submit`, {
        language: normalizeLanguageId(language),
        code: currentCode
      });
      setSubmissionResult(res.data);
      setHasAttempted(true);
      setShowSubmitModal(false);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmissionResult({
        status: 'ERROR',
        message: err.response?.data?.message || err.response?.data || 'Error submitting solution.',
        solved: false
      });
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditorialModal = async () => {
    try {
      setEditorialLoading(true);
      const res = await axios.get(`/api/problems/${id}/editorial`);
      setEditorialData(res.data);
      setEditorialModalOpen(true);
    } catch (err) {
      alert(err.response?.data || 'Editorial is locked. Make at least one submission attempt first.');
    } finally {
      setEditorialLoading(false);
    }
  };

  const handleOpenSolutionModal = async () => {
    try {
      setSolutionLoading(true);
      const res = await axios.get(`/api/problems/${id}/solution`);
      const sol = res.data;
      setSolutionData(sol);
      
      // Auto-select first available language tab
      if (sol.hasSolutionPython) setSolutionTab('Python');
      else if (sol.hasSolutionC) setSolutionTab('C');
      else if (sol.hasSolutionJava) setSolutionTab('Java');

      setSolutionModalOpen(true);
    } catch (err) {
      alert(err.response?.data || 'Solution is locked. Submit at least one attempt first.');
    } finally {
      setSolutionLoading(false);
    }
  };

  const handleCopySolution = (codeToCopy) => {
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyBadge = (diff) => {
    const norm = (diff || '').toUpperCase();
    if (norm === 'EASY') {
      return <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontWeight: 'bold' }}>Easy</span>;
    }
    if (norm === 'MEDIUM') {
      return <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem', borderRadius: '12px', background: '#fef08a', color: '#854d0e', fontWeight: 'bold' }}>Medium</span>;
    }
    return <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }}>Hard</span>;
  };

  const renderRunResultPanel = () => {
    if (!runResult) return null;

    const status = (runResult.status || '').toUpperCase();

    let bannerBg = '#f8fafc';
    let bannerBorder = '#cbd5e1';
    let bannerColor = '#334155';
    let icon = <Terminal size={22} color="#0284c7" />;
    let titleText = 'Run Result (Public Test Cases Only)';

    if (status === 'ACCEPTED' || status === 'PASSED') {
      bannerBg = '#f0fdf4';
      bannerBorder = '#bbf7d0';
      bannerColor = '#166534';
      icon = <CheckCircle2 size={24} color="#16a34a" />;
      titleText = '✓ Run Success – All Public Test Cases Passed';
    } else if (status === 'WRONG_ANSWER' || status === 'FAILED') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <XCircle size={24} color="#dc2626" />;
      titleText = '✗ Run Result – Some Public Test Cases Failed';
    } else if (status === 'COMPILATION_ERROR') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <AlertTriangle size={24} color="#dc2626" />;
      titleText = '✗ Compilation Error';
    } else if (status === 'TIME_LIMIT_EXCEEDED') {
      bannerBg = '#fffbeb';
      bannerBorder = '#fde047';
      bannerColor = '#854d0e';
      icon = <Clock size={24} color="#d97706" />;
      titleText = '⏱ Time Limit Exceeded (> 5s)';
    } else if (status === 'RUNTIME_ERROR') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <AlertCircle size={24} color="#dc2626" />;
      titleText = '⚠ Runtime Error';
    } else if (status === 'DOCKER_UNAVAILABLE') {
      bannerBg = '#eff6ff';
      bannerBorder = '#bfdbfe';
      bannerColor = '#1e40af';
      icon = <Info size={24} color="#2563eb" />;
      titleText = 'ℹ Sandbox Execution Service Unavailable';
    }

    const publicPassed = runResult.publicPassedCount ?? runResult.passedTestCases ?? 0;
    const publicTotal = runResult.publicTotalCount ?? runResult.totalTestCases ?? (runResult.testCaseResults ? runResult.testCaseResults.length : 0);
    const avgExecTime = runResult.averageExecutionTimeMs != null
      ? runResult.averageExecutionTimeMs.toFixed(1)
      : (runResult.aggregateRuntime != null ? (runResult.aggregateRuntime / Math.max(1, publicTotal)).toFixed(1) : '0');
    const compTime = runResult.compilationTimeMs != null ? runResult.compilationTimeMs.toFixed(1) : null;

    return (
      <div style={{
        marginTop: '1.25rem',
        padding: '1.25rem',
        background: bannerBg,
        border: `1.5px solid ${bannerBorder}`,
        borderRadius: '10px',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* HEADER & METRICS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: bannerColor, fontWeight: 800, fontSize: '1.1rem' }}>
            {icon}
            <span>{titleText}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: bannerColor }}>
              {publicPassed} / {publicTotal} Public Tests Passed
            </span>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: bannerColor }}>
              Execution Time: Average: {avgExecTime} ms
            </span>

            {compTime != null && (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-muted)' }}>
                Compilation: {compTime} ms
              </span>
            )}
          </div>
        </div>

        {/* MESSAGE */}
        {runResult.message && (
          <div style={{ color: bannerColor, fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
            {runResult.message}
          </div>
        )}

        {/* COMPILER ERROR / OUTPUT */}
        {runResult.compilerOutput && (
          <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.4rem 0', color: bannerColor, fontWeight: 700 }}>
              {status === 'COMPILATION_ERROR' ? 'Compilation Error' : 'Compiler Output'}
            </h5>
            <pre style={{
              background: '#1e1e1e',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {runResult.compilerOutput}
            </pre>
          </div>
        )}

        {/* PUBLIC TEST CASES BREAKDOWN */}
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <h5 style={{ margin: '0 0 0.6rem 0', color: bannerColor, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
            Public Test Cases
          </h5>
          {runResult.testCaseResults && runResult.testCaseResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {runResult.testCaseResults.map((tc, idx) => {
                const caseNum = tc.testCaseNumber || idx + 1;
                const isPass = tc.passed;
                return (
                  <div key={idx} style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: isPass ? '#ffffff' : '#fff5f5',
                    border: isPass ? '1px solid #cbd5e1' : '1.5px solid #fca5a5',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 800, color: isPass ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isPass ? <CheckCircle2 size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}
                        <span>Test Case {caseNum}</span>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isPass ? '#dcfce7' : '#fee2e2',
                          color: isPass ? '#166534' : '#991b1b',
                          marginLeft: '6px'
                        }}>
                          {isPass ? 'PASS' : (tc.status || 'FAIL')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Time: {tc.runtime != null ? `${tc.runtime} ms` : '--'}
                      </div>
                    </div>

                    <div style={{ fontFamily: 'monospace', color: 'var(--text)', fontSize: '0.825rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Input:</strong> <span style={{ color: 'var(--text)' }}>{tc.input != null ? tc.input : '<none>'}</span></div>
                      <div><strong>Expected:</strong> <span style={{ color: 'var(--text)' }}>{tc.expectedOutput != null ? tc.expectedOutput : '<none>'}</span></div>
                      <div><strong>Actual:</strong> <span style={{ color: isPass ? '#15803d' : '#dc2626', fontWeight: 600 }}>{tc.actualOutput != null ? tc.actualOutput : '<none>'}</span></div>
                      {tc.errorMessage && (
                        <div style={{ color: '#dc2626', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          <strong>Runtime Error:</strong> {tc.errorMessage}
                        </div>
                      )}
                      {tc.compilationError && (
                        <div style={{ color: '#dc2626', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          <strong>Compilation Error:</strong> {tc.compilationError}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No public test case executions available.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubmissionResultPanel = () => {
    if (!submissionResult) return null;

    const status = (submissionResult.status || '').toUpperCase();

    let bannerBg = '#f8fafc';
    let bannerBorder = '#cbd5e1';
    let bannerColor = '#334155';
    let icon = <Info size={22} color="#0081A7" />;
    let titleText = submissionResult.status;

    if (status === 'ACCEPTED') {
      bannerBg = '#f0fdf4';
      bannerBorder = '#bbf7d0';
      bannerColor = '#166534';
      icon = <CheckCircle2 size={24} color="#16a34a" />;
      titleText = '✓ Accepted';
    } else if (status === 'WRONG_ANSWER') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <XCircle size={24} color="#dc2626" />;
      titleText = '✗ Wrong Answer';
    } else if (status === 'COMPILATION_ERROR') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <AlertTriangle size={24} color="#dc2626" />;
      titleText = '✗ Compilation Error';
    } else if (status === 'TIME_LIMIT_EXCEEDED') {
      bannerBg = '#fffbeb';
      bannerBorder = '#fde047';
      bannerColor = '#854d0e';
      icon = <Clock size={24} color="#d97706" />;
      titleText = '⏱ Time Limit Exceeded (> 5s)';
    } else if (status === 'RUNTIME_ERROR') {
      bannerBg = '#fef2f2';
      bannerBorder = '#fca5a5';
      bannerColor = '#991b1b';
      icon = <AlertCircle size={24} color="#dc2626" />;
      titleText = '⚠ Runtime Error';
    } else if (status === 'DOCKER_UNAVAILABLE') {
      bannerBg = '#eff6ff';
      bannerBorder = '#bfdbfe';
      bannerColor = '#1e40af';
      icon = <Info size={24} color="#2563eb" />;
      titleText = 'ℹ Sandbox Execution Service Unavailable';
    }

    const publicPassed = submissionResult.publicPassedCount ?? 0;
    const publicTotal = submissionResult.publicTotalCount ?? (submissionResult.testCaseResults ? submissionResult.testCaseResults.length : 0);
    const privatePassed = submissionResult.privatePassedCount ?? 0;
    const privateTotal = submissionResult.privateTotalCount ?? 0;
    const privateFailed = Math.max(0, privateTotal - privatePassed);

    const avgExecTime = submissionResult.averageExecutionTimeMs != null
      ? submissionResult.averageExecutionTimeMs.toFixed(1)
      : (submissionResult.runtime != null ? submissionResult.runtime.toFixed(1) : '0');
    const compTime = submissionResult.compilationTimeMs != null ? submissionResult.compilationTimeMs.toFixed(1) : null;
    const privAvgExecTime = submissionResult.privateAverageExecutionTimeMs != null
      ? submissionResult.privateAverageExecutionTimeMs.toFixed(1)
      : avgExecTime;
    const privAvgCompTime = submissionResult.privateAverageCompilationTimeMs != null
      ? submissionResult.privateAverageCompilationTimeMs.toFixed(1)
      : (compTime || '0');

    return (
      <div style={{
        marginTop: '1.25rem',
        padding: '1.25rem',
        background: bannerBg,
        border: `1.5px solid ${bannerBorder}`,
        borderRadius: '10px',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* HEADER & METRICS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: bannerColor, fontWeight: 800, fontSize: '1.2rem' }}>
            {icon}
            <span>{titleText}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {submissionResult.passedTestCases != null && (
              <span style={{ fontSize: '0.9rem', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: bannerColor }}>
                Total: {submissionResult.passedTestCases} / {submissionResult.totalTestCases} Tests Passed
              </span>
            )}

            <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: bannerColor }}>
              Execution Time: {avgExecTime} ms
            </span>

            {compTime != null && (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-muted)' }}>
                Compilation: {compTime} ms
              </span>
            )}
          </div>
        </div>

        {/* MESSAGE */}
        {submissionResult.message && (
          <div style={{ color: bannerColor, fontSize: '0.925rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
            {submissionResult.message}
          </div>
        )}

        {/* COMPILER OUTPUT */}
        {submissionResult.compilerOutput && (
          <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.4rem 0', color: bannerColor, fontWeight: 700 }}>Compiler Output</h5>
            <pre style={{
              background: '#1e1e1e',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {submissionResult.compilerOutput}
            </pre>
          </div>
        )}

        {/* PUBLIC TEST CASES */}
        {submissionResult.testCaseResults && submissionResult.testCaseResults.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h5 style={{ margin: 0, color: bannerColor, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Public Test Cases
              </h5>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {publicPassed} / {publicTotal} Passed
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {submissionResult.testCaseResults.map((tc, idx) => {
                const caseNum = tc.testCaseNumber || idx + 1;
                const isPass = tc.passed;
                return (
                  <div key={idx} style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: isPass ? '#ffffff' : '#fff5f5',
                    border: isPass ? '1px solid #cbd5e1' : '1.5px solid #fca5a5',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 800, color: isPass ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isPass ? <CheckCircle2 size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}
                        <span>Test Case {caseNum}</span>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isPass ? '#dcfce7' : '#fee2e2',
                          color: isPass ? '#166534' : '#991b1b',
                          marginLeft: '6px'
                        }}>
                          {isPass ? 'PASS' : (tc.status || 'FAIL')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Time: {tc.runtime != null ? `${tc.runtime} ms` : '--'}
                      </div>
                    </div>

                    <div style={{ fontFamily: 'monospace', color: 'var(--text)', fontSize: '0.825rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Input:</strong> <span>{tc.input != null ? tc.input : '<none>'}</span></div>
                      <div><strong>Expected:</strong> <span>{tc.expectedOutput != null ? tc.expectedOutput : '<none>'}</span></div>
                      <div><strong>Actual:</strong> <span style={{ color: isPass ? '#15803d' : '#dc2626', fontWeight: 600 }}>{tc.actualOutput != null ? tc.actualOutput : '<none>'}</span></div>
                      {tc.errorMessage && (
                        <div style={{ color: '#dc2626', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          <strong>Runtime Error:</strong> {tc.errorMessage}
                        </div>
                      )}
                      {tc.compilationError && (
                        <div style={{ color: '#dc2626', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          <strong>Compilation Error:</strong> {tc.compilationError}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRIVATE TEST CASES AGGREGATE SUMMARY */}
        {privateTotal > 0 && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem 1.25rem',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontWeight: 800, color: '#1e293b', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Lock size={16} color="var(--primary)" />
              <span>Private Test Cases</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Passed</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a' }}>
                  {privatePassed} / {privateTotal}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Failed</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: privateFailed > 0 ? '#dc2626' : '#16a34a' }}>
                  {privateFailed} / {privateTotal}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Execution Time</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                  {privAvgExecTime} ms
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Compilation Time</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#64748b' }}>
                  {privAvgCompTime} ms
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.65rem' }}>
              Private test case inputs and expected outputs are confidential to ensure evaluation integrity.
            </div>
          </div>
        )}

      </div>
    );
  };

  if (loading) {
    return <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>Loading problem workspace...</div>;
  }

  if (error) {
    return <div className="dashboard-card error-msg">{error}</div>;
  }

  if (!problem) {
    return <div className="dashboard-card">Problem not found.</div>;
  }

  const problemHints = problem.hints || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
      
      {/* TOP NAVIGATION BAR & BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/problems" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Problems
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* EDITORIAL BUTTON */}
          <button
            onClick={handleOpenEditorialModal}
            disabled={editorialLoading}
            style={{
              padding: '0.5rem 1.1rem',
              background: hasAttempted ? '#f0fdf4' : '#f1f5f9',
              color: hasAttempted ? '#166534' : '#94a3b8',
              border: hasAttempted ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: hasAttempted ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem'
            }}
            title={hasAttempted ? "View complete problem editorial explanation." : "Make at least one submission attempt to unlock the editorial."}
          >
            {hasAttempted ? <BookOpen size={16} color="#16a34a" /> : <Lock size={15} />}
            {editorialLoading ? 'Loading Editorial...' : '📖 Editorial'}
          </button>

          {/* REFERENCE SOLUTION BUTTON */}
          {hasAttempted ? (
            <button
              onClick={handleOpenSolutionModal}
              disabled={solutionLoading}
              style={{
                padding: '0.5rem 1.1rem',
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #7dd3fc',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.875rem',
                transition: 'background 0.2s'
              }}
            >
              <Eye size={16} /> {solutionLoading ? 'Loading Solution...' : 'View Reference Solution'}
            </button>
          ) : (
            <button
              disabled
              style={{
                padding: '0.5rem 1.1rem',
                background: '#f1f5f9',
                color: '#94a3b8',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'not-allowed',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.875rem'
              }}
              title="Submit at least one attempt first to unlock the reference solution."
            >
              <Lock size={15} /> Solution Locked (Submit Attempt First)
            </button>
          )}
        </div>
      </div>

      {/* WORKSPACE CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT SECTION: PROBLEM STATEMENT, HINTS, & EDITORIAL NOTICE */}
        <div className="dashboard-card" style={{ overflowX: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', wordBreak: 'break-word' }}>
              #{problem.id}. {problem.title}
            </h2>
            {getDifficultyBadge(problem.difficulty)}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Concepts:</span>
            {((problem.concepts && problem.concepts.length > 0) ? problem.concepts : (problem.concept ? problem.concept.split(',').map(s => s.trim()).filter(Boolean) : [])).map((c, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.8rem',
                  padding: '3px 10px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '12px',
                  border: '1px solid #7dd3fc',
                  fontWeight: 700
                }}
              >
                {c}
              </span>
            ))}
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1rem', fontWeight: 700 }}>Description</h4>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text)', fontSize: '0.95rem', overflowWrap: 'break-word' }}>
              {problem.description}
            </div>
          </div>

          {problem.constraints && (
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700 }}>Constraints</h4>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text)' }}>
                {problem.constraints}
              </div>
            </div>
          )}

          {/* VISIBLE TEST CASES / EXAMPLES */}
          {problem.testCasesList && problem.testCasesList.length > 0 ? (
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#166534', fontSize: '0.95rem', fontWeight: 700 }}>Visible Examples / Test Cases</h4>
              {problem.testCasesList.map((tc, idx) => (
                <div key={idx} style={{ marginBottom: idx === problem.testCasesList.length - 1 ? 0 : '0.75rem', paddingBottom: idx === problem.testCasesList.length - 1 ? 0 : '0.75rem', borderBottom: idx === problem.testCasesList.length - 1 ? 'none' : '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#15803d', marginBottom: '2px' }}>Example #{idx + 1}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#14532d' }}>
                    <div><strong>Input:</strong> {tc.input}</div>
                    <div><strong>Expected Output:</strong> {tc.expectedOutput}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (problem.testCases && (
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '0.95rem', fontWeight: 700 }}>Visible Examples / Test Cases</h4>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: '#14532d' }}>
                {problem.testCases}
              </div>
            </div>
          ))}

          {/* HINTS SECTION (STEP-BY-STEP PROGRESSIVE REVEALING) */}
          {problemHints && problemHints.length > 0 && (
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#b45309', fontSize: '0.975rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={18} color="#d97706" /> 💡 Need a hint? (Progressive Step-by-Step)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {problemHints.map((hint, idx) => {
                  const isRevealed = idx < revealedHintCount;
                  if (!isRevealed && idx > revealedHintCount) return null; // Hide future unreached hints

                  if (isRevealed) {
                    return (
                      <div key={idx} style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '0.875rem', color: '#78350f', animation: 'fadeIn 0.2s ease' }}>
                        <strong style={{ color: '#b45309' }}>Hint {idx + 1}:</strong> {hint.content}
                      </div>
                    );
                  }

                  return (
                    <div key={idx} style={{ marginTop: '0.25rem' }}>
                      <button
                        onClick={() => setRevealedHintCount(prev => prev + 1)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fcd34d',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background 0.2s'
                        }}
                      >
                        <Lightbulb size={14} /> Reveal Hint {idx + 1} <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EDITORIAL UNLOCK STATUS BANNER */}
          <div style={{ padding: '0.85rem 1rem', background: hasAttempted ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', border: hasAttempted ? '1px solid #bbf7d0' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: hasAttempted ? '#166534' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {hasAttempted ? <CheckCircle2 size={16} color="#16a34a" /> : <Lock size={15} color="#94a3b8" />}
              {hasAttempted ? 'Editorial is unlocked for this problem!' : 'Make at least one submission attempt to unlock the editorial.'}
            </div>
            {hasAttempted && (
              <button
                onClick={handleOpenEditorialModal}
                style={{ padding: '0.3rem 0.75rem', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
              >
                Read Editorial
              </button>
            )}
          </div>

        </div>

        {/* RIGHT SECTION: USER SANDBOX CODE EDITOR & RESULTS */}
        <div className="dashboard-card" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          
          {/* SANDBOX HEADER & LANGUAGE SELECTOR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text)' }}>
              <Code2 size={20} color="var(--primary)" />
              <span>User Sandbox</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Language:</label>
              <select
                value={normalizeLanguageId(language)}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 600, background: 'var(--white)', cursor: 'pointer' }}
              >
                {getAvailableLanguagesForProblem(problem).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MONACO CODE EDITOR */}
          <div className="notranslate" translate="no" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', minHeight: '380px', background: '#1e1e1e' }}>
            <Editor
              height="380px"
              language={getMonacoLanguage(language)}
              theme="vs-dark"
              value={currentCode}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4
              }}
            />
          </div>

          {/* ACTION BUTTONS (RUN VS SUBMIT) */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* RUN BUTTON (ONLY VISIBLE TEST CASES) */}
            <button
              onClick={handleRunCode}
              disabled={running || submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                background: '#e2e8f0',
                color: 'var(--text)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: (running || submitting) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              title="Executes code against visible sample test cases only. Does not count as a submission."
            >
              <Play size={16} /> {running ? 'Running Visible Test Cases...' : 'Run Code'}
            </button>

            {/* SUBMIT BUTTON (VISIBLE + HIDDEN TEST CASES) */}
            <button
              onClick={handleSubmitClick}
              disabled={running || submitting}
              className="btn-primary"
              style={{
                width: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.5rem',
                margin: 0
              }}
              title="Evaluates code against ALL test cases (visible + hidden). Creates submission attempt."
            >
              <Send size={16} /> {submitting ? 'Evaluating in Sandbox...' : 'Submit Code'}
            </button>
          </div>

          {/* RUN EXECUTION RESULT PANEL */}
          {renderRunResultPanel()}

          {/* SUBMISSION EVALUATION RESULT PANEL */}
          {renderSubmissionResultPanel()}

        </div>

      </div>

      {/* READ-ONLY EDITORIAL MODAL */}
      {editorialModalOpen && editorialData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.25s ease'
          }}>
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={22} color="var(--secondary)" /> Problem Editorial – #{editorialData.problemId}. {editorialData.problemTitle}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Comprehensive solution explanation, algorithm analysis, and complexity breakdown.
                </p>
              </div>
              <button
                onClick={() => setEditorialModalOpen(false)}
                style={{ padding: '0.4rem 0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
              >
                Close ✕
              </button>
            </div>

            {/* EDITORIAL CONTENT */}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text)', fontSize: '0.95rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
              {editorialData.editorial}
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY REFERENCE SOLUTION VIEWING MODAL */}
      {solutionModalOpen && solutionData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.25s ease'
          }}>
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={20} color="var(--primary)" /> Reference Solution – #{solutionData.problemId}. {solutionData.problemTitle}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Trusted platform solution for studying algorithms & optimal approaches.
                </p>
              </div>
              <button
                onClick={() => setSolutionModalOpen(false)}
                style={{ padding: '0.4rem 0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
              >
                Close ✕
              </button>
            </div>

            {/* LANGUAGE TABS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              {solutionData.hasSolutionC && (
                <button
                  onClick={() => setSolutionTab('C')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: solutionTab === 'C' ? 'var(--primary)' : '#f1f5f9',
                    color: solutionTab === 'C' ? '#ffffff' : 'var(--text)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  C Solution
                </button>
              )}

              {solutionData.hasSolutionPython && (
                <button
                  onClick={() => setSolutionTab('Python')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: solutionTab === 'Python' ? 'var(--primary)' : '#f1f5f9',
                    color: solutionTab === 'Python' ? '#ffffff' : 'var(--text)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Python Solution
                </button>
              )}

              {solutionData.hasSolutionJava && (
                <button
                  onClick={() => setSolutionTab('Java')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: solutionTab === 'Java' ? 'var(--primary)' : '#f1f5f9',
                    color: solutionTab === 'Java' ? '#ffffff' : 'var(--text)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Java Solution
                </button>
              )}
            </div>

            {/* CODE DISPLAY & COPY BUTTON */}
            {(() => {
              let codeToShow = '';
              if (solutionTab === 'C') codeToShow = solutionData.solutionC || '';
              else if (solutionTab === 'Python') codeToShow = solutionData.solutionPython || '';
              else if (solutionTab === 'Java') codeToShow = solutionData.solutionJava || '';

              if (!codeToShow) {
                return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No reference solution available for {solutionTab}.</div>;
              }

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{solutionTab} Code (Read-Only)</span>
                    <button
                      onClick={() => handleCopySolution(codeToShow)}
                      style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copied ? <><Check size={14} color="#16a34a" /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                    </button>
                  </div>

                  <div className="notranslate" translate="no" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', minHeight: '300px', background: '#1e1e1e' }}>
                    <Editor
                      height="320px"
                      language={MONACO_LANGUAGES[solutionTab] || 'python'}
                      theme="vs-dark"
                      value={codeToShow}
                      options={{
                        readOnly: true,
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4
                      }}
                    />
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={22} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  Submit Solution?
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Language: <strong>{language}</strong></span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
              Are you sure you want to submit your code? This will evaluate your solution against both <strong>public</strong> and <strong>private</strong> test cases and record this attempt on your profile.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: 'var(--text)',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedSubmit}
                disabled={submitting}
                className="btn-primary"
                style={{
                  width: 'auto',
                  margin: 0,
                  padding: '0.6rem 1.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem' }}></span>
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Proceed to Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProblemDetail;
