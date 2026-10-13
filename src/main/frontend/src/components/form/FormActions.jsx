import React from 'react';

/**
 * Reusable FormActions bar for Primary, Secondary, Back, Next, and Save buttons
 */
export function FormActions({
  children,
  onBack,
  onNext,
  onSubmit,
  backText = "Back",
  nextText = "Next Step",
  submitText = "Save & Submit",
  loading = false,
  disabled = false,
  showBack = true,
  isLastStep = false,
  extraLeft,
  style = {}
}) {
  return (
    <div className="form-actions-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 0',
      marginTop: '1.5rem',
      borderTop: '1px solid var(--border)',
      flexWrap: 'wrap',
      gap: '0.75rem',
      ...style
    }}>
      <div>
        {extraLeft ? extraLeft : (showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            disabled={disabled || loading}
            style={{ padding: '0.45rem 1rem' }}
          >
            &larr; {backText}
          </button>
        ) : null)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}

        {onNext && !isLastStep && (
          <button
            type="button"
            onClick={onNext}
            className="btn btn-primary btn-sm"
            disabled={disabled || loading}
            style={{ padding: '0.45rem 1.25rem', fontWeight: 600 }}
          >
            {nextText} &rarr;
          </button>
        )}

        {onSubmit && isLastStep && (
          <button
            type="button"
            onClick={onSubmit}
            className="btn btn-primary btn-sm"
            disabled={disabled || loading}
            style={{ padding: '0.45rem 1.5rem', fontWeight: 700 }}
          >
            {loading ? "Processing..." : submitText}
          </button>
        )}
      </div>
    </div>
  );
}

export default FormActions;
