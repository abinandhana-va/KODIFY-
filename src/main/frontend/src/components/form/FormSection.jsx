import React from 'react';

/**
 * Reusable FormSection container card with title, subtitle, icon, and actions
 */
export function FormSection({
  title,
  subtitle,
  icon: Icon,
  badge,
  extraHeader,
  children,
  style = {},
  noPadding = false
}) {
  return (
    <div className="form-section-card" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: noPadding ? 0 : '1.5rem',
      marginBottom: '1.25rem',
      boxShadow: 'var(--shadow-sm)',
      ...style
    }}>
      {(title || subtitle || Icon || extraHeader) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: noPadding ? '0' : '1.25rem',
          padding: noPadding ? '1.25rem 1.25rem 0.75rem 1.25rem' : 0,
          borderBottom: noPadding ? '1px solid var(--border)' : 'none',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon && <Icon size={18} color="var(--primary)" />}
              {title && (
                <h3 style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {title}
                </h3>
              )}
              {badge && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0, 129, 167, 0.1)',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {extraHeader && <div>{extraHeader}</div>}
        </div>
      )}

      <div>
        {children}
      </div>
    </div>
  );
}

export default FormSection;
