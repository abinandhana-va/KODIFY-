import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, ArrowLeft, Award, ShieldCheck, CheckCircle2, AlertCircle, Eye, Lock } from 'lucide-react';

function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const initialFormState = {
    name: '',
    description: '',
    category: 'CODING_MILESTONE',
    templateStyle: 'STANDARD',
    achievementType: 'PROBLEMS_SOLVED',
    target: 5,
    templateDocument: '',
    enabled: true
  };

  const [formData, setFormData] = useState(initialFormState);
  const [templatePreviewTab, setTemplatePreviewTab] = useState('preview'); // 'preview' | 'code'

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/certificates');
      setCertificates(res.data || []);
    } catch (err) {
      console.error("Error loading certificates:", err);
      setError("Unable to load certificates from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setValidationError(null);
    setShowForm(true);
  };

  const handleEdit = (cert) => {
    setEditingId(cert.id);
    setFormData({
      name: cert.name || '',
      description: cert.description || '',
      category: cert.category || 'CODING_MILESTONE',
      templateStyle: cert.templateStyle || 'STANDARD',
      achievementType: cert.achievementType || 'PROBLEMS_SOLVED',
      target: cert.target || 5,
      templateDocument: cert.templateDocument || '',
      enabled: cert.enabled !== undefined ? cert.enabled : true
    });
    setValidationError(null);
    setShowForm(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content) {
        setFormData(prev => ({ ...prev, templateDocument: content }));
      }
    };
    reader.readAsText(file);
  };

  const insertPlaceholder = (tag) => {
    setFormData(prev => ({
      ...prev,
      templateDocument: (prev.templateDocument || '') + tag
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name || !formData.name.trim()) {
      setValidationError("Certificate title is required.");
      return;
    }
    if (!formData.target || Number(formData.target) < 1) {
      setValidationError("Target requirement must be at least 1.");
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        target: Number(formData.target)
      };

      if (editingId) {
        await axios.put(`/api/admin/certificates/${editingId}`, payload);
      } else {
        await axios.post('/api/admin/certificates', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchCertificates();
    } catch (err) {
      console.error("Error saving certificate:", err);
      setValidationError(err.response?.data?.message || err.response?.data || "Error saving certificate.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this certificate? This will also remove unlocked records for this certificate.")) {
      try {
        await axios.delete(`/api/admin/certificates/${id}`);
        fetchCertificates();
      } catch (err) {
        console.error("Error deleting certificate:", err);
        alert("Error deleting certificate.");
      }
    }
  };

  const getMetricLabel = (metric, target) => {
    switch (metric) {
      case 'CONTESTS_PARTICIPATED':
        return `Participated in ≥ ${target} Contests`;
      case 'CONTESTS_CONDUCTED':
        return `Conducted ≥ ${target} Contests`;
      case 'CONTEST_WINS':
      case 'CONTEST_RANK_1':
        return `Won / Ranked 1st in Contest`;
      case 'PROBLEMS_SOLVED':
      default:
        return `Solved ≥ ${target} Unique Problems`;
    }
  };

  const placeholders = [
    '{{NAME}}', '{{CATEGORY}}', '{{MILESTONE}}',
    '{{ACHIEVEMENT}}', '{{RANK}}', '{{CONTEST_NAME}}',
    '{{DATE}}', '{{ORGANIZATION}}', '{{CERTIFICATE_CODE}}'
  ];

  if (showForm) {
    const isElite = formData.templateStyle === 'ELITE';
    const isAdvanced = formData.templateStyle === 'ADVANCED';

    const samplePreviewText = (formData.templateDocument && formData.templateDocument.trim())
      ? formData.templateDocument
          .replace(/\{\{NAME\}\}/g, 'Abinaya Sundar')
          .replace(/\{\{CATEGORY\}\}/g, (formData.category || 'CODING_MILESTONE').replace('_', ' '))
          .replace(/\{\{MILESTONE\}\}/g, `${formData.target} Problems Solved`)
          .replace(/\{\{ACHIEVEMENT\}\}/g, formData.name || 'Master Problem Solver')
          .replace(/\{\{RANK\}\}/g, '1st Rank')
          .replace(/\{\{CONTEST_NAME\}\}/g, 'KODIFY National CodeSprint 2026')
          .replace(/\{\{DATE\}\}/g, 'September 26, 2026')
          .replace(/\{\{ORGANIZATION\}\}/g, 'KODIFY Evaluation Platform')
          .replace(/\{\{CERTIFICATE_CODE\}\}/g, 'KODIFY-CERT-SAMPLE-84920')
      : null;

    return (
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--text)' }}>
                {editingId ? 'Edit Certificate & Document Template' : 'Create Certificate Template'}
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Upload or design customizable document templates with dynamic placeholder replacements.
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem' }}
              onClick={() => setShowForm(false)}
            >
              <ArrowLeft size={15} /> Cancel
            </button>
          </div>

          {validationError && (
            <div className="error-msg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> {validationError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Certificate Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Master Algorithm Certification"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Certificate Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="CODING_MILESTONE">Coding Milestone</option>
                    <option value="CONTEST">Contest Achievement</option>
                    <option value="ASSIGNMENT">Assignment Achievement</option>
                    <option value="COURSE">Course Credential</option>
                    <option value="EVENT">Event Certification</option>
                    <option value="CHALLENGE">Special Challenge</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Design Style Preset *</label>
                  <select
                    value={formData.templateStyle}
                    onChange={e => setFormData({ ...formData, templateStyle: e.target.value })}
                  >
                    <option value="STANDARD">Standard (Clean & Minimal)</option>
                    <option value="ADVANCED">Advanced (Sapphire & Teal Crest)</option>
                    <option value="ELITE">Elite (Royal Gold & Obsidian)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description / Citation</label>
                <textarea
                  placeholder="e.g. For outstanding technical accomplishment and dedication in solving algorithmic challenges..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Achievement Metric</label>
                  <select
                    value={formData.achievementType}
                    onChange={e => setFormData({ ...formData, achievementType: e.target.value })}
                  >
                    <option value="PROBLEMS_SOLVED">Problems Solved (Unique Accepted)</option>
                    <option value="CONTESTS_PARTICIPATED">Contests Participated</option>
                    <option value="CONTESTS_CONDUCTED">Contests Conducted</option>
                    <option value="CONTEST_WINS">Contest Victories / 1st Rank</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Milestone Target *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5, 10, 25, 50"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* DOCUMENT TEMPLATE UPLOAD & EDITOR */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Document Template</label>
                  <label style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    📁 Upload Template File (.txt, .docx, .html)
                    <input type="file" accept=".txt,.docx,.html,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                
                {/* Available Placeholder Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.5rem' }}>
                  {placeholders.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => insertPlaceholder(p)}
                      style={{
                        background: 'var(--tag-bg, #f1f5f9)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        fontWeight: 600
                      }}
                      title={`Click to insert ${p}`}
                    >
                      + {p}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Paste or write custom document template with {{NAME}}, {{CATEGORY}}, {{MILESTONE}}, {{ACHIEVEMENT}}, {{RANK}}, {{CONTEST_NAME}}, {{DATE}}, {{ORGANIZATION}}..."
                  value={formData.templateDocument}
                  onChange={e => setFormData({ ...formData, templateDocument: e.target.value })}
                  rows="6"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.4' }}
                />
              </div>

              {/* STATUS TOGGLE */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="enabledCertCheckbox"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="enabledCertCheckbox" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Active (Users can unlock and download this certificate)
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                {editingId ? 'Update Certificate Template' : 'Save Certificate Template'}
              </button>
            </form>

            {/* LIVE CERTIFICATE PREVIEW CARD */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTemplatePreviewTab('preview')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: templatePreviewTab === 'preview' ? 'var(--primary)' : 'var(--tag-bg)',
                    color: templatePreviewTab === 'preview' ? '#fff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Visual Certificate Preview
                </button>
                <button
                  type="button"
                  onClick={() => setTemplatePreviewTab('code')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: templatePreviewTab === 'code' ? 'var(--primary)' : 'var(--tag-bg)',
                    color: templatePreviewTab === 'code' ? '#fff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Rendered Template Text
                </button>
              </div>

              {templatePreviewTab === 'preview' ? (
                <div style={{
                  background: isElite ? '#fffdfa' : '#fcfdfd',
                  borderRadius: '10px',
                  border: `4px solid ${isElite ? '#b45309' : (isAdvanced ? 'var(--primary)' : '#334155')}`,
                  boxShadow: 'var(--shadow-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: isElite ? '#b45309' : 'var(--primary)', fontFamily: 'serif', letterSpacing: '2px', fontWeight: 900 }}>
                    K O D I F Y
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: isElite ? '#d97706' : 'var(--secondary)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {isElite ? '★ Elite Master Certification ★' : (isAdvanced ? '◆ Advanced Professional Credential ◆' : '● Official Kodify Certification ●')}
                  </p>

                  <div style={{ margin: '0.5rem 0', fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>
                    {formData.name || 'Certificate Title'}
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.4rem 0' }}>
                    PROUDLY PRESENTED TO
                  </p>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isElite ? '#0f172a' : 'var(--primary)', marginBottom: '0.5rem' }}>
                    ABINAYA SUNDAR
                  </div>

                  <p style={{ fontSize: '0.775rem', color: '#475569', lineHeight: '1.45', margin: '0 0 0.75rem 0' }}>
                    {formData.description || `For outstanding technical proficiency and completing ${formData.target || 5} ${formData.achievementType || 'Milestones'} on KODIFY.`}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <div>
                      <div>Date Issued</div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>September 26, 2026</div>
                    </div>
                    <div>
                      <div>Category</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formData.category}</div>
                    </div>
                    <div>
                      <div>Verification</div>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>✓ Authenticated</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#166534',
                    padding: '3px 10px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '0.725rem'
                  }}>
                    <ShieldCheck size={13} /> Requirement: {getMetricLabel(formData.achievementType, formData.target || 1)}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '350px',
                  overflowY: 'auto'
                }}>
                  {samplePreviewText || "No custom template document specified. The standard KODIFY layout with dynamic placeholders will be rendered."}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="var(--primary)" /> Certificate Management
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Configure milestone requirements across Standard, Advanced, and Elite design templates.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0.55rem 1.1rem' }}
            onClick={handleCreateNew}
          >
            <Plus size={16} /> Create Certificate
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading certificates...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && certificates.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No certificates found. Click "Create Certificate" to define your first certificate.
          </p>
        )}

        {!loading && !error && certificates.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Certificate Title</th>
                  <th>Category</th>
                  <th>Template Preset</th>
                  <th>Achievement Metric</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Issued Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map(c => {
                  const styleTier = (c.templateStyle || 'STANDARD').toUpperCase();
                  const cat = (c.category || 'CODING_MILESTONE').replace('_', ' ');
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                        {c.templateDocument && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                            📄 Custom Template Configured
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(0, 129, 167, 0.1)',
                          color: 'var(--primary)'
                        }}>
                          {cat}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: styleTier.includes('ELITE') ? 'rgba(217, 119, 6, 0.15)' : (styleTier.includes('ADVANCED') ? 'rgba(0, 129, 167, 0.12)' : 'var(--tag-bg)'),
                          color: styleTier.includes('ELITE') ? '#d97706' : (styleTier.includes('ADVANCED') ? 'var(--primary)' : 'var(--text-muted)')
                        }}>
                          {styleTier}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                          {c.achievementType || 'PROBLEMS_SOLVED'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {c.target}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: c.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: c.enabled ? '#16a34a' : '#dc2626'
                        }}>
                          {c.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                          {c.unlockedCount ?? c.earnedCount ?? 0} earned
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="admin-btn"
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => handleEdit(c)}
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => handleDelete(c.id)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

export default AdminCertificates;
