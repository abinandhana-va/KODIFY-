import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Filter, CheckCircle, Search, Tag, Edit3, Play, Check } from 'lucide-react';

function Problems() {
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [topics, setTopics] = useState([]);

  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [probsRes, topicsRes, solvedRes] = await Promise.all([
          axios.get('/api/problems'),
          axios.get('/api/problems/topics'),
          axios.get('/api/problems/user-progress')
        ]);

        setProblems(probsRes.data || []);
        setTopics(topicsRes.data || []);
        setSolvedIds(new Set(solvedRes.data || []));
      } catch (err) {
        console.error("Error loading problems data:", err);
        setError('Unable to load coding problems.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProblemConcepts = (p) => {
    if (p.concepts && p.concepts.length > 0) return p.concepts;
    if (p.concept) return p.concept.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const filteredProblems = problems.filter(p => {
    const pConcepts = getProblemConcepts(p);

    // Difficulty filter
    if (filterDifficulty !== 'ALL') {
      if ((p.difficulty || '').toUpperCase() !== filterDifficulty) {
        return false;
      }
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      const isSolved = solvedIds.has(p.id);
      if (filterStatus === 'COMPLETED' && !isSolved) return false;
      if (filterStatus === 'NOT_COMPLETED' && isSolved) return false;
    }

    // Topic filter (problem matches if ANY of its concepts match the selected topic)
    if (filterTopic !== 'ALL') {
      const matchTopic = pConcepts.some(
        c => c.trim().toLowerCase() === filterTopic.trim().toLowerCase()
      );
      if (!matchTopic) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchConcept = pConcepts.some(c => c.toLowerCase().includes(q)) || (p.concept || '').toLowerCase().includes(q);
      if (!matchTitle && !matchConcept) return false;
    }

    return true;
  });

  const getDifficultyBadge = (diff) => {
    const norm = (diff || '').toUpperCase();
    if (norm === 'EASY') {
      return (
        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: '#dcfce7', color: '#166534', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>
          Easy
        </span>
      );
    }
    if (norm === 'MEDIUM') {
      return (
        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: '#fef08a', color: '#854d0e', fontWeight: 'bold', border: '1px solid #fde047' }}>
          Medium
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: '#fee2e2', color: '#991b1b', fontWeight: 'bold', border: '1px solid #fca5a5' }}>
        Hard
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>Coding Problems</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose a problem, select your programming language, and code your solution.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="dashboard-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
          <Filter size={18} />
          <span>Filter Problems</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Difficulty Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Difficulty</label>
            <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_COMPLETED">Not Completed</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Topic / Concept</label>
            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
              <option value="ALL">All Topics</option>
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search title or concept..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* PROBLEM LIST CARDS */}
      <div className="dashboard-card">
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading problems...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && filteredProblems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No problems match your selected filter criteria.
          </div>
        )}

        {!loading && !error && filteredProblems.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredProblems.map(p => {
              const isSolved = solvedIds.has(p.id);
              const pConcepts = getProblemConcepts(p);

              return (
                <Link
                  to={'/problems/' + p.id}
                  key={p.id}
                  className="problem-card-hover"
                  style={{
                    display: 'block',
                    padding: '1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: isSolved ? '#f0fdf4' : 'var(--white)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      {/* STATUS ICON */}
                      {isSolved ? (
                        <span title="Solved" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', flexShrink: 0 }}>
                          <Check size={15} strokeWidth={3} />
                        </span>
                      ) : (
                        <span title="Unsolved - Click to solve" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', flexShrink: 0 }}>
                          <Edit3 size={13} />
                        </span>
                      )}

                      <h3 style={{ margin: 0, color: isSolved ? '#166534' : 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', wordBreak: 'break-word' }}>
                        #{p.id}. {p.title}
                      </h3>
                      {isSolved && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#166534', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                          <CheckCircle size={12} /> Solved
                        </span>
                      )}
                    </div>
                    {getDifficultyBadge(p.difficulty)}
                  </div>

                  {/* CONCEPTS CHIPS */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.65rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={13} color="var(--secondary)" /> Concepts:
                    </span>
                    {pConcepts.length > 0 ? (
                      pConcepts.map((c, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            borderRadius: '10px',
                            border: '1px solid #bae6fd',
                            fontWeight: 700
                          }}
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>General</span>
                    )}
                  </div>

                  <div style={{
                    marginTop: '0.65rem',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.5'
                  }}>
                    {p.description}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Problems;
