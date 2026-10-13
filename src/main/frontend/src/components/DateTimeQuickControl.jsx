import React from 'react';
import { Calendar, Clock, RotateCcw, Plus, Minus, Check } from 'lucide-react';
import { parseLocalDateTime, formatForDateTimeInput } from '../utils/dateUtils';

/**
 * DateTimeQuickControl
 * Provides datetime-local input with quick [-1 hr], [NOW], [+1 hr] buttons,
 * timezone-aware date rollover handling, and readable preview badge.
 */
export function DateTimeQuickControl({
  label,
  value, // ISO string or 'YYYY-MM-DDTHH:mm'
  onChange,
  required = false,
  helperText,
  min,
  max,
  disabled = false
}) {
  const currentDateObj = parseLocalDateTime(value);
  const inputValue = currentDateObj ? formatForDateTimeInput(currentDateObj) : (value || '');

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    onChange(formatForDateTimeInput(now));
  };

  const handleAdjustHour = (deltaHours) => {
    let base = currentDateObj ? new Date(currentDateObj) : new Date();
    base.setHours(base.getHours() + deltaHours);
    base.setSeconds(0, 0);
    onChange(formatForDateTimeInput(base));
  };

  const formatDisplayPreview = () => {
    if (!currentDateObj) return null;
    try {
      const datePart = currentDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timePart = currentDateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${datePart} at ${timePart}`;
    } catch {
      return null;
    }
  };

  const preview = formatDisplayPreview();

  return (
    <div className="form-group-compact" style={{ margin: 0 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
            {label} {required && <span className="label-required">*</span>}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '0 4px',
                textDecoration: 'underline'
              }}
              title="Clear date and time"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px', position: 'relative' }}>
          <input
            type="datetime-local"
            value={inputValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            disabled={disabled}
            required={required}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              fontSize: '0.825rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--input-bg)',
              color: 'var(--text)'
            }}
          />
        </div>

        {/* Quick adjustments */}
        <div style={{ display: 'inline-flex', gap: '3px' }}>
          <button
            type="button"
            onClick={() => handleAdjustHour(-1)}
            disabled={disabled}
            style={{
              padding: '0.35rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'var(--bg-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              whiteSpace: 'nowrap'
            }}
            title="Subtract 1 hour (handles day rollover)"
          >
            <Minus size={11} /> 1 hr
          </button>

          <button
            type="button"
            onClick={handleSetNow}
            disabled={disabled}
            style={{
              padding: '0.35rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(0, 129, 167, 0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(0, 129, 167, 0.25)',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Set to current local time"
          >
            NOW
          </button>

          <button
            type="button"
            onClick={() => handleAdjustHour(1)}
            disabled={disabled}
            style={{
              padding: '0.35rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'var(--bg-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              whiteSpace: 'nowrap'
            }}
            title="Add 1 hour (handles day rollover)"
          >
            <Plus size={11} /> 1 hr
          </button>
        </div>
      </div>

      {/* Formatted Date Tag */}
      {preview && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.72rem',
          color: 'var(--primary)',
          fontWeight: 600,
          background: 'rgba(0, 129, 167, 0.06)',
          padding: '2px 8px',
          borderRadius: '4px',
          marginTop: '2px',
          width: 'fit-content'
        }}>
          <Clock size={11} /> {preview}
        </div>
      )}

      {helperText && !preview && (
        <div className="form-hint-text">{helperText}</div>
      )}
    </div>
  );
}

export default DateTimeQuickControl;
