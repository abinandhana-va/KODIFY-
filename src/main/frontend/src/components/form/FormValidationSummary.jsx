import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Reusable FormValidationSummary banner for displaying form error summaries
 */
export function FormValidationSummary({
  errors = [],
  onDismiss,
  title = "Please review the following errors before proceeding:"
}) {
  const errorList = Array.isArray(errors) ? errors : (errors ? [errors] : []);

  if (errorList.length === 0) return null;

  return (
    <div className="form-validation-summary" style={{
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px'
    }}>
      <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
          {title}
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#dc2626' }}>
          {errorList.map((err, idx) => (
            <li key={idx} style={{ marginTop: '2px' }}>
              {typeof err === 'string' ? err : err.message || JSON.stringify(err)}
            </li>
          ))}
        </ul>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default FormValidationSummary;
