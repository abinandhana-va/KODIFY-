import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Eye } from 'lucide-react';

export default function QuestionImageUploader({ imageUrl, onImageChange, disabled = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG, WEBP, SVG, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post('/api/assignments/questions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.imageUrl) {
        onImageChange(res.data.imageUrl);
      }
    } catch (err) {
      console.error('Failed to upload question image:', err);
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        disabled={disabled || uploading}
      />

      {imageUrl ? (
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: '8px'
          }}
        >
          <img
            src={imageUrl}
            alt="Question Diagram"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
            onClick={() => setPreviewModalOpen(true)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
              Question Diagram Attached
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click thumbnail or preview button to inspect.
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewModalOpen(true)}
                style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Eye size={12} /> Preview
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} className={uploading ? 'animate-spin' : ''} /> Replace
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onImageChange('')}
                disabled={disabled || uploading}
                style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary, #3b82f6)' : 'var(--border, rgba(255,255,255,0.15))'}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <RefreshCw size={18} className="animate-spin" />
              <span style={{ fontSize: '0.85rem' }}>Uploading question image...</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <ImageIcon size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>
                  Attach Question Diagram or Image (Optional)
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Drag and drop image here or click to browse (PNG, JPG, WEBP, max 5MB)
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.75rem', marginTop: '4px' }}>
          {error}
        </div>
      )}

      {/* Fullsize Preview Modal */}
      {previewModalOpen && imageUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg, #18181b)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModalOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <img
              src={imageUrl}
              alt="Question Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
