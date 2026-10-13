import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, ArrowLeft, ArrowRight, Code2, Lock, CheckCircle2,
  AlertCircle, Lightbulb, BookOpen, X, Tag, FileText, CheckSquare, Layers
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, DEFAULT_ALLOWED_LANGUAGES, getDefaultStarterCode } from './utils/languageRegistry';

function AdminProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Java');
  const [conceptInput, setConceptInput] = useState('');

  const totalSteps = 7;
  const stepTitles = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Description' },
    { num: 3, label: 'Test Cases' },
    { num: 4, label: 'Starter & Solutions' },
    { num: 5, label: 'Hints' },
    { num: 6, label: 'Editorial' },
    { num: 7, label: 'Review & Publish' }
  ];

  const initialFormState = {
    title: '',
    concept: '',
    concepts: [],
    difficulty: 'EASY',
    description: '',
    constraints: '',
    editorial: '',
    allowedLanguages: [...DEFAULT_ALLOWED_LANGUAGES],
    hints: [],
    testCasesList: [
      { input: '', expectedOutput: '', hidden: false }
    ],
    starterCodeC: getDefaultStarterCode('C'),
    solutionC: '',
    starterCodePython: getDefaultStarterCode('PYTHON'),
    solutionPython: '',
    starterCodeJava: getDefaultStarterCode('JAVA'),
    solutionJava: '',
    starterCodeCpp: getDefaultStarterCode('CPP'),
    solutionCpp: '',
    starterCodeJs: getDefaultStarterCode('JAVASCRIPT'),
    solutionJs: '',
    starterCodeGo: getDefaultStarterCode('GO'),
    solutionGo: '',
    starterCodeRust: getDefaultStarterCode('RUST'),
    solutionRust: '',
    solution: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/problems');
      setProblems(res.data || []);
    } catch (err) {
      console.error("Error loading problems:", err);
      setError('Unable to load problems from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setConceptInput('');
    setSelectedLanguage('Java');
    setValidationError(null);
    setCurrentStep(1);
    setShowForm(true);
  };

  const handleEdit = async (p) => {
    setEditingId(p.id);
    setSelectedLanguage('Java');
    setValidationError(null);
    setConceptInput('');
    setCurrentStep(1);
    try {
      const res = await axios.get('/api/problems/' + p.id);
      const full = res.data;
      
      let tcs = full.testCasesList && full.testCasesList.length > 0
        ? full.testCasesList
        : [{ input: '', expectedOutput: '', hidden: false }];

      let hnts = full.hints && full.hints.length > 0
        ? full.hints.map(h => ({ content: h.content }))
        : [];

      let rawConcepts = [];
      if (full.concepts && full.concepts.length > 0) {
        rawConcepts = full.concepts;
      } else if (full.concept) {
        rawConcepts = full.concept.split(',').map(s => s.trim()).filter(Boolean);
      }

      setFormData({
        title: full.title || '',
        concept: full.concept || '',
        concepts: rawConcepts,
        difficulty: (full.difficulty || 'EASY').toUpperCase(),
        description: full.description || '',
        constraints: full.constraints || '',
        editorial: full.editorial || '',
        allowedLanguages: (full.allowedLanguages && full.allowedLanguages.length > 0)
          ? full.allowedLanguages
          : [...DEFAULT_ALLOWED_LANGUAGES],
        hints: hnts,
        testCasesList: tcs,
        starterCodeC: full.starterCodeC || getDefaultStarterCode('C'),
        solutionC: full.solutionC || '',
        starterCodePython: full.starterCodePython || getDefaultStarterCode('PYTHON'),
        solutionPython: full.solutionPython || '',
        starterCodeJava: full.starterCodeJava || getDefaultStarterCode('JAVA'),
        solutionJava: full.solutionJava || '',
        starterCodeCpp: full.starterCodeCpp || getDefaultStarterCode('CPP'),
        solutionCpp: full.solutionCpp || '',
        starterCodeJs: full.starterCodeJs || getDefaultStarterCode('JAVASCRIPT'),
        solutionJs: full.solutionJs || '',
        starterCodeGo: full.starterCodeGo || getDefaultStarterCode('GO'),
        solutionGo: full.solutionGo || '',
        starterCodeRust: full.starterCodeRust || getDefaultStarterCode('RUST'),
        solutionRust: full.solutionRust || '',
        solution: full.solution || ''
      });
      setShowForm(true);
    } catch (err) {
      console.error("Error loading problem for edit:", err);
      alert("Could not load problem details.");
    }
  };

  // Concepts Handlers
  const handleAddConcept = () => {
    if (!conceptInput || !conceptInput.trim()) return;
    const newConcept = conceptInput.trim();
    if (formData.concepts.includes(newConcept)) {
      setConceptInput('');
      return;
    }
    const updated = [...formData.concepts, newConcept];
    setFormData(prev => ({
      ...prev,
      concepts: updated,
      concept: updated.join(', ')
    }));
    setConceptInput('');
  };

  const handleRemoveConcept = (index) => {
    const updated = formData.concepts.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      concepts: updated,
      concept: updated.join(', ')
    }));
  };

  // Test Case Management Handlers
  const handleAddTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCasesList: [...prev.testCasesList, { input: '', expectedOutput: '', hidden: false }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    if (formData.testCasesList.length <= 1) {
      setValidationError("At least one test case is mandatory for every problem.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      testCasesList: prev.testCasesList.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.testCasesList];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCasesList: updated };
    });
  };

  // Hints Handlers
  const handleAddHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, { content: '' }]
    }));
  };

  const handleRemoveHint = (index) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const handleHintChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.hints];
      updated[index] = { ...updated[index], content: value };
      return { ...prev, hints: updated };
    });
  };

  const validateStep = (step) => {
    setValidationError(null);
    if (step === 1) {
      if (!formData.title || !formData.title.trim()) {
        setValidationError("Problem title is required.");
        return false;
      }
      if ((!formData.concepts || formData.concepts.length === 0) && (!formData.concept || !formData.concept.trim())) {
        setValidationError("Please add at least one Concept / Topic tag for this problem.");
        return false;
      }
      if (!formData.allowedLanguages || formData.allowedLanguages.length === 0) {
        setValidationError("Select at least one programming language.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.description || !formData.description.trim()) {
        setValidationError("Problem statement / description is required.");
        return false;
      }
      if (!formData.constraints || !formData.constraints.trim()) {
        setValidationError("Constraints are required.");
        return false;
      }
    } else if (step === 3) {
      const validTc = formData.testCasesList.some(
        tc => tc.input && tc.input.trim() && tc.expectedOutput && tc.expectedOutput.trim()
      );
      if (!validTc) {
        setValidationError("Please add at least one valid test case with non-blank input and expected output.");
        return false;
      }
    } else if (step === 4) {
      const hasSol = (formData.solutionC && formData.solutionC.trim()) ||
        (formData.solutionPython && formData.solutionPython.trim()) ||
        (formData.solutionJava && formData.solutionJava.trim()) ||
        (formData.solutionCpp && formData.solutionCpp.trim()) ||
        (formData.solutionJs && formData.solutionJs.trim()) ||
        (formData.solutionGo && formData.solutionGo.trim()) ||
        (formData.solutionRust && formData.solutionRust.trim()) ||
        (formData.solution && formData.solution.trim());

      if (!hasSol) {
        setValidationError("At least one language reference solution is required for evaluation validation.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate all required steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        concept: formData.concepts.length > 0 ? formData.concepts.join(', ') : formData.concept
      };

      if (editingId) {
        await axios.put('/api/admin/problems/' + editingId, payload);
      } else {
        await axios.post('/api/admin/problems', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      setConceptInput('');
      setValidationError(null);
      fetchProblems();
    } catch (err) {
      console.error("Error saving problem:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Error saving problem. Please check required fields.';
      setValidationError(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this problem? All associated submissions and assignment links will be affected.')) {
      try {
        await axios.delete('/api/admin/problems/' + id);
        fetchProblems();
      } catch (err) {
        console.error("Error deleting problem:", err);
        alert('Error deleting problem.');
      }
    }
  };

  if (showForm) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="dashboard-card">
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                PROBLEM BUILDER WIZARD
              </div>
              <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.4rem' }}>
                {editingId ? `Edit Problem #${editingId}` : 'Create New Assessment Problem'}
              </h2>
            </div>
            <button
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowForm(false)}
            >
              <ArrowLeft size={14} /> Back to Problems List
            </button>
          </div>

          {/* STEPPER NAVIGATION */}
          <div className="wizard-stepper">
            {stepTitles.map(st => (
              <div
                key={st.num}
                className={`wizard-step-node ${currentStep === st.num ? 'active' : (currentStep > st.num ? 'completed' : '')}`}
                onClick={() => {
                  if (st.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.num);
                  }
                }}
              >
                <span className="step-badge">{currentStep > st.num ? '✓' : st.num}</span>
                <span className="step-label">{st.label}</span>
              </div>
            ))}
          </div>

          {validationError && (
            <div className="error-msg" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {validationError}
            </div>
          )}

          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} color="var(--primary)" /> Step 1: Basic Problem Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Two Sum, Implement Trie, Longest Substring"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Difficulty *</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="EASY">Easy (100 Points)</option>
                    <option value="MEDIUM">Medium (200 Points)</option>
                    <option value="HARD">Hard (300 Points)</option>
                  </select>
                </div>
              </div>

              {/* CONCEPTS / TOPICS SECTION */}
              <div className="form-group" style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <Tag size={15} color="var(--primary)" /> Concepts / Algorithmic Topics * (At least 1 required)
                </label>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.65rem', minHeight: '32px', alignItems: 'center' }}>
                  {formData.concepts && formData.concepts.length > 0 ? (
                    formData.concepts.map((conceptItem, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(2, 132, 199, 0.12)',
                          color: '#0284c7',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {conceptItem}
                        <button
                          type="button"
                          onClick={() => handleRemoveConcept(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0284c7',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title="Remove concept"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No tags added yet. Type below and click "Add Tag" (e.g., Arrays, Hash Map, Binary Search).
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter concept tag (e.g. Dynamic Programming, Trees, Graph)..."
                    value={conceptInput}
                    onChange={e => setConceptInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddConcept();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddConcept}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.825rem', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> Add Tag
                  </button>
                </div>
              </div>

              {/* ALLOWED PROGRAMMING LANGUAGES */}
              <div className="form-group" style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.85rem' }}>
                      <Code2 size={15} color="var(--primary)" /> Allowed Programming Languages * (At least 1 required)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Users will only be allowed to submit using these chosen languages for this problem.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, allowedLanguages: SUPPORTED_LANGUAGES.map(l => l.id) }))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, allowedLanguages: [] }))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginTop: '0.5rem' }}>
                  {SUPPORTED_LANGUAGES.map(lang => {
                    const isSelected = formData.allowedLanguages?.includes(lang.id);
                    return (
                      <div
                        key={lang.id}
                        onClick={() => {
                          setFormData(prev => {
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
            </div>
          )}

          {/* STEP 2: DESCRIPTION & CONSTRAINTS */}
          {currentStep === 2 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} color="var(--primary)" /> Step 2: Problem Statement & Constraints
              </h3>

              <div className="form-group">
                <label>Problem Statement / Task Description *</label>
                <textarea
                  placeholder="Provide detailed problem description, input format, output format, and sample explanation..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ height: '160px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}
                />
              </div>

              <div className="form-group">
                <label>Constraints *</label>
                <textarea
                  placeholder="e.g. 1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9"
                  value={formData.constraints}
                  onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                  required
                  style={{ height: '80px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: TEST CASES */}
          {currentStep === 3 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={18} color="var(--primary)" /> Step 3: Test Cases Evaluation Suite
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Define sample test cases (visible to users) and hidden evaluation cases (used for scoring).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
                >
                  <Plus size={14} /> Add Test Case
                </button>
              </div>

              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {formData.testCasesList.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-hover)',
                      padding: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                        Test Case #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={tc.hidden}
                            onChange={e => handleTestCaseChange(idx, 'hidden', e.target.checked)}
                          />
                          <span style={{ color: tc.hidden ? '#ca8a04' : 'var(--text-muted)', fontWeight: tc.hidden ? 700 : 500 }}>
                            {tc.hidden ? '🔒 Hidden Case' : '👁️ Sample Case'}
                          </span>
                        </label>
                        {formData.testCasesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: 0 }}
                            title="Delete test case"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Standard Input (stdin)</label>
                        <textarea
                          placeholder="Raw stdin input..."
                          value={tc.input}
                          onChange={e => handleTestCaseChange(idx, 'input', e.target.value)}
                          style={{ height: '70px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Expected Output (stdout)</label>
                        <textarea
                          placeholder="Expected stdout output..."
                          value={tc.expectedOutput}
                          onChange={e => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                          style={{ height: '70px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: STARTER CODE & SOLUTIONS */}
          {currentStep === 4 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code2 size={18} color="var(--primary)" /> Step 4: Starter Code & Reference Solutions
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Configure default editor templates and private ground-truth solutions for all supported languages.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLanguage(l.id)}
                      className={selectedLanguage === l.id || selectedLanguage === l.name ? 'btn btn-primary' : 'btn-secondary'}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  Active Language: {selectedLanguage.toUpperCase()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {/* STARTER CODE */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text)' }}>
                      {selectedLanguage} Starter Code (User Workspace Initializer)
                    </label>
                    <textarea
                      placeholder={`Enter ${selectedLanguage} starter boilerplate for users...`}
                      value={
                        (selectedLanguage === 'Java' || selectedLanguage === 'JAVA') ? formData.starterCodeJava :
                        (selectedLanguage === 'Python' || selectedLanguage === 'PYTHON') ? formData.starterCodePython :
                        (selectedLanguage === 'CPP' || selectedLanguage === 'C++') ? formData.starterCodeCpp :
                        (selectedLanguage === 'JavaScript' || selectedLanguage === 'JAVASCRIPT') ? formData.starterCodeJs :
                        (selectedLanguage === 'Go' || selectedLanguage === 'GO') ? formData.starterCodeGo :
                        (selectedLanguage === 'Rust' || selectedLanguage === 'RUST') ? formData.starterCodeRust :
                        formData.starterCodeC
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (selectedLanguage === 'Java' || selectedLanguage === 'JAVA') setFormData(prev => ({ ...prev, starterCodeJava: val }));
                        else if (selectedLanguage === 'Python' || selectedLanguage === 'PYTHON') setFormData(prev => ({ ...prev, starterCodePython: val }));
                        else if (selectedLanguage === 'CPP' || selectedLanguage === 'C++') setFormData(prev => ({ ...prev, starterCodeCpp: val }));
                        else if (selectedLanguage === 'JavaScript' || selectedLanguage === 'JAVASCRIPT') setFormData(prev => ({ ...prev, starterCodeJs: val }));
                        else if (selectedLanguage === 'Go' || selectedLanguage === 'GO') setFormData(prev => ({ ...prev, starterCodeGo: val }));
                        else if (selectedLanguage === 'Rust' || selectedLanguage === 'RUST') setFormData(prev => ({ ...prev, starterCodeRust: val }));
                        else setFormData(prev => ({ ...prev, starterCodeC: val }));
                      }}
                      style={{ height: '160px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                    />
                  </div>

                  {/* REFERENCE SOLUTION */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> {selectedLanguage} Reference Solution (Admin Ground Truth)
                    </label>
                    <textarea
                      placeholder={`Enter complete 100% working ${selectedLanguage} solution...`}
                      value={
                        (selectedLanguage === 'Java' || selectedLanguage === 'JAVA') ? formData.solutionJava :
                        (selectedLanguage === 'Python' || selectedLanguage === 'PYTHON') ? formData.solutionPython :
                        (selectedLanguage === 'CPP' || selectedLanguage === 'C++') ? formData.solutionCpp :
                        (selectedLanguage === 'JavaScript' || selectedLanguage === 'JAVASCRIPT') ? formData.solutionJs :
                        (selectedLanguage === 'Go' || selectedLanguage === 'GO') ? formData.solutionGo :
                        (selectedLanguage === 'Rust' || selectedLanguage === 'RUST') ? formData.solutionRust :
                        formData.solutionC
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (selectedLanguage === 'Java' || selectedLanguage === 'JAVA') setFormData(prev => ({ ...prev, solutionJava: val }));
                        else if (selectedLanguage === 'Python' || selectedLanguage === 'PYTHON') setFormData(prev => ({ ...prev, solutionPython: val }));
                        else if (selectedLanguage === 'CPP' || selectedLanguage === 'C++') setFormData(prev => ({ ...prev, solutionCpp: val }));
                        else if (selectedLanguage === 'JavaScript' || selectedLanguage === 'JAVASCRIPT') setFormData(prev => ({ ...prev, solutionJs: val }));
                        else if (selectedLanguage === 'Go' || selectedLanguage === 'GO') setFormData(prev => ({ ...prev, solutionGo: val }));
                        else if (selectedLanguage === 'Rust' || selectedLanguage === 'RUST') setFormData(prev => ({ ...prev, solutionRust: val }));
                        else setFormData(prev => ({ ...prev, solutionC: val }));
                      }}
                      style={{ height: '160px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: HINTS */}
          {currentStep === 5 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={18} color="#d97706" /> Step 5: Problem Hints (Progressive Help)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Add progressive hints revealed one by one to users struggling on the problem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddHint}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
                >
                  <Plus size={14} /> Add Hint
                </button>
              </div>

              {formData.hints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-hover)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                  <Lightbulb size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No hints added yet. Click "Add Hint" to provide algorithmic clues or edge-case advice.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {formData.hints.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-hover)',
                        padding: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                          Hint #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHint(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: 0 }}
                          title="Remove hint"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        placeholder={`Enter hint #${idx + 1}...`}
                        value={h.content}
                        onChange={e => handleHintChange(idx, e.target.value)}
                        style={{ height: '60px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: EDITORIAL */}
          {currentStep === 6 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={18} color="var(--primary)" /> Step 6: Official Editorial & Algorithmic Analysis
              </h3>

              <div className="form-group">
                <label>Official Editorial / Solution Explanation (Markdown Supported)</label>
                <textarea
                  placeholder="Explain the intuition, mathematical proofs, time complexity O(N), and space complexity O(1)..."
                  value={formData.editorial}
                  onChange={e => setFormData({ ...formData, editorial: e.target.value })}
                  style={{ height: '180px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & PUBLISH */}
          {currentStep === 7 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} color="#16a34a" /> Step 7: Review & Finalize Problem
              </h3>

              <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '6px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Title</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{formData.title || '--'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Difficulty</div>
                    <div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: formData.difficulty === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : (formData.difficulty === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                        color: formData.difficulty === 'EASY' ? '#16a34a' : (formData.difficulty === 'MEDIUM' ? '#d97706' : '#dc2626')
                      }}>
                        {formData.difficulty}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Test Cases</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.testCasesList.length} defined</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Hints</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.hints.length} defined</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Topics / Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {formData.concepts.map((c, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', background: 'var(--card-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Language Solutions Implemented</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                    <span style={{ color: formData.solutionJava?.trim() ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                      {formData.solutionJava?.trim() ? '✓ Java Ready' : '✗ No Java'}
                    </span>
                    <span style={{ color: formData.solutionPython?.trim() ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                      {formData.solutionPython?.trim() ? '✓ Python Ready' : '✗ No Python'}
                    </span>
                    <span style={{ color: formData.solutionC?.trim() ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                      {formData.solutionC?.trim() ? '✓ C Ready' : '✗ No C'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER WIZARD CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', opacity: currentStep === 1 ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Previous Step
            </button>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} /> {editingId ? 'Update & Save Problem' : 'Publish Assessment Problem'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.4rem' }}>Problem Management</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Create, configure, and maintain algorithmic problem statements, test cases, and private evaluation suites.
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={handleCreateNew}
          >
            <Plus size={16} /> Add Problem
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading problems...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && problems.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No problems found in database. Click "Add Problem" to create one.
          </p>
        )}

        {!loading && !error && problems.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Concepts & Topics</th>
                  <th>Difficulty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map(p => {
                  const pConcepts = p.concepts && p.concepts.length > 0 
                    ? p.concepts 
                    : (p.concept ? p.concept.split(',').map(s => s.trim()).filter(Boolean) : []);

                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{p.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.title}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '340px' }}>
                          {pConcepts.length > 0 ? (
                            pConcepts.map((c, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.725rem',
                                  padding: '2px 7px',
                                  background: 'var(--bg-hover)',
                                  color: 'var(--primary)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: (p.difficulty || '').toUpperCase() === 'EASY' ? 'rgba(22, 163, 74, 0.15)' : ((p.difficulty || '').toUpperCase() === 'MEDIUM' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'),
                          color: (p.difficulty || '').toUpperCase() === 'EASY' ? '#16a34a' : ((p.difficulty || '').toUpperCase() === 'MEDIUM' ? '#d97706' : '#dc2626')
                        }}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleEdit(p)}
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--coral)', borderColor: 'rgba(220, 38, 38, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProblems;
