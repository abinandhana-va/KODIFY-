import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, ArrowLeft, Award, Shield, CheckCircle2, AlertCircle, Sparkles, Image, Check, X } from 'lucide-react';

const PRESET_BADGE_IMAGES = [
  { name: 'Coding Matrix', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&auto=format&fit=crop&q=80' },
  { name: 'Algorithm Logic', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120&auto=format&fit=crop&q=80' },
  { name: 'Python Terminal', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80' },
  { name: 'Data Master', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=120&auto=format&fit=crop&q=80' },
  { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Super Achiever', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80' }
];

function AdminBadges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const initialFormState = {
    name: '',
    description: '',
    imageUrl: PRESET_BADGE_IMAGES[0].url,
    shape: 'CIRCLE', // CIRCLE, HEXAGON, DIAMOND
    metric: 'PROBLEMS_SOLVED',
    target: 10,
    enabled: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/badges');
      setBadges(res.data || []);
    } catch (err) {
      console.error("Error loading badges:", err);
      setError("Unable to load badges from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setValidationError(null);
    setShowForm(true);
  };

  const handleEdit = (badge) => {
    setEditingId(badge.id);
    setFormData({
      name: badge.name || '',
      description: badge.description || '',
      imageUrl: badge.imageUrl || PRESET_BADGE_IMAGES[0].url,
      shape: badge.shape || 'CIRCLE',
      metric: badge.metric || 'PROBLEMS_SOLVED',
      target: badge.target || 10,
      enabled: badge.enabled !== undefined ? badge.enabled : true
    });
    setValidationError(null);
    setShowForm(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name || !formData.name.trim()) {
      setValidationError("Badge name is required.");
      return;
    }
    if (!formData.target || Number(formData.target) < 1) {
      setValidationError("Achievement target must be at least 1.");
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        target: Number(formData.target)
      };

      if (editingId) {
        await axios.put('/api/admin/badges/' + editingId, payload);
      } else {
        await axios.post('/api/admin/badges', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchBadges();
    } catch (err) {
      console.error("Error saving badge:", err);
      setValidationError(err.response?.data?.message || err.response?.data || "Error saving badge.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this badge? This will also remove it from any users who earned it.")) {
      try {
        await axios.delete('/api/admin/badges/' + id);
        fetchBadges();
      } catch (err) {
        console.error("Error deleting badge:", err);
        alert("Error deleting badge.");
      }
    }
  };

  const getMetricLabel = (metric, target) => {
    switch (metric) {
      case 'CONTESTS_PARTICIPATED':
        return `Participated in ≥ ${target} Contest${target > 1 ? 's' : ''}`;
      case 'CONTESTS_CONDUCTED':
        return `Conducted ≥ ${target} Contest${target > 1 ? 's' : ''}`;
      case 'CONTEST_WINS':
        return `Won ≥ ${target} Contest${target > 1 ? 's' : ''}`;
      case 'PROBLEMS_SOLVED':
      default:
        return `Solved ≥ ${target} Problem${target > 1 ? 's' : ''}`;
    }
  };

  const renderBadgeSticker = (shape, imageUrl, size = 90) => {
    let clipStyle = {};
    if (shape === 'CIRCLE') {
      clipStyle = { borderRadius: '50%' };
    } else if (shape === 'HEXAGON') {
      clipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
    } else if (shape === 'DIAMOND') {
      clipStyle = { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: 'drop-shadow(0 4px 8px rgba(0, 129, 167, 0.25))'
      }}>
        {/* STICKER WHITE BORDER BACKGROUND */}
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
          padding: '4px',
          ...clipStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* INNER IMAGE */}
          <div style={{
            width: '100%',
            height: '100%',
            ...clipStyle,
            overflow: 'hidden',
            background: 'var(--primary)'
          }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Badge"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Award size={size / 2.5} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showForm) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>
              {editingId ? 'Edit Badge' : 'Create New Badge'}
            </h2>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0.5rem 1rem', background: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowForm(false)}
            >
              <ArrowLeft size={16} /> Cancel
            </button>
          </div>

          {validationError && (
            <div className="error-msg" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> {validationError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            
            {/* FORM FIELDS */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Badge Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Problem Solver"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="e.g. Solve your first 10 coding problems"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ height: '70px' }}
                />
              </div>

              {/* SHAPE SELECTOR */}
              <div className="form-group">
                <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Shape *</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { id: 'CIRCLE', label: '◯ Circle' },
                    { id: 'HEXAGON', label: '⬡ Hexagon' },
                    { id: 'DIAMOND', label: '◇ Diamond' }
                  ].map(shapeOpt => (
                    <label
                      key={shapeOpt.id}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.5rem',
                        textAlign: 'center',
                        borderRadius: '8px',
                        border: formData.shape === shapeOpt.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: formData.shape === shapeOpt.id ? '#e0f2fe' : '#ffffff',
                        fontWeight: formData.shape === shapeOpt.id ? 700 : 500,
                        color: formData.shape === shapeOpt.id ? 'var(--primary)' : 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <input
                        type="radio"
                        name="shape"
                        value={shapeOpt.id}
                        checked={formData.shape === shapeOpt.id}
                        onChange={() => setFormData({ ...formData, shape: shapeOpt.id })}
                        style={{ display: 'none' }}
                      />
                      {shapeOpt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* ACHIEVEMENT CONDITION */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>
                  Achievement Condition
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Metric</label>
                    <select
                      value={formData.metric}
                      onChange={e => setFormData({ ...formData, metric: e.target.value })}
                    >
                      <option value="PROBLEMS_SOLVED">Problems Solved</option>
                      <option value="CONTESTS_PARTICIPATED">Contests Participated</option>
                      <option value="CONTESTS_CONDUCTED">Contests Conducted</option>
                      <option value="CONTEST_WINS">Contest Wins</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Target Count *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={formData.target}
                      onChange={e => setFormData({ ...formData, target: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BADGE IMAGE SELECTION & UPLOAD */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={15} color="var(--primary)" /> Badge Image
                </label>
                
                {/* PRESET IMAGE OPTIONS */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {PRESET_BADGE_IMAGES.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset.url}
                      alt={preset.name}
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: formData.imageUrl === preset.url ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                        boxShadow: formData.imageUrl === preset.url ? '0 0 0 2px var(--secondary)' : 'none',
                        objectFit: 'cover'
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter image URL or choose preset"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                  <label style={{
                    padding: '0.65rem 0.9rem',
                    background: '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* STATUS TOGGLE */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="enabledCheckbox"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="enabledCheckbox" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                  Active / Enabled (Users can earn this badge)
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1.25rem' }}>
                {editingId ? 'Update Badge' : 'Create Badge'}
              </button>
            </form>

            {/* LIVE STICKER PREVIEW CARD */}
            <div style={{
              background: '#f8fafc',
              padding: '2rem 1.5rem',
              borderRadius: '12px',
              border: '1.5px dashed var(--secondary)',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live Sticker Preview
              </h4>

              <div style={{ margin: '1rem 0' }}>
                {renderBadgeSticker(formData.shape, formData.imageUrl, 110)}
              </div>

              <h3 style={{ margin: '0.75rem 0 0.25rem 0', color: 'var(--text)', fontWeight: 800 }}>
                {formData.name || 'Badge Name'}
              </h3>
              
              <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {formData.description || 'Badge achievement description'}
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                <Sparkles size={14} /> {getMetricLabel(formData.metric, formData.target || 1)}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={26} color="var(--primary)" /> Badge Management
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Configure achievement sticker badges, shapes (Circle, Hexagon, Diamond), and unlock thresholds.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0.65rem 1.25rem', background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleCreateNew}
          >
            <Plus size={18} /> Create Badge
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading badges...</p>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && badges.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No badges found. Click "Create Badge" to add your first achievement badge.
          </p>
        )}

        {!loading && !error && badges.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Badge Name</th>
                  <th>Shape</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Earned Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {badges.map(b => (
                  <tr key={b.id}>
                    <td>
                      {renderBadgeSticker(b.shape, b.imageUrl, 46)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.description}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        {b.shape}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {getMetricLabel(b.metric, b.target)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: b.enabled ? '#dcfce7' : '#fee2e2',
                        color: b.enabled ? '#166534' : '#991b1b'
                      }}>
                        {b.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {b.earnedCount || 0} users
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn"
                        style={{ padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleEdit(b)}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 size={14} /> Delete
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
  );
}

export default AdminBadges;
