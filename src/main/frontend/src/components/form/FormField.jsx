import React from 'react';

/**
 * Reusable FormField with label, required asterisk, hint, error message, and clean input styling
 */
export function FormField({
  label,
  required = false,
  hint,
  error,
  children,
  style = {},
  labelRight
}) {
  return (
    <div className="form-field-group" style={{ marginBottom: '1rem', ...style }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <label style={{
            fontSize: '0.825rem',
            fontWeight: 600,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {label}
            {required && <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>}
          </label>
          {labelRight && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{labelRight}</div>}
        </div>
      )}

      <div>
        {children}
      </div>

      {hint && !error && (
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {hint}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.3rem', fontWeight: 500 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default FormField;
