import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Unified FormLayout wrapper for all KODIFY forms
 * Provides consistent top header, breadcrumb/title hierarchy, responsive 2/3 column layout, and card enclosure.
 */
export function FormLayout({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  backUrl,
  sidebar,
  children,
  extraHeaderRight,
  maxWidth = '1200px'
}) {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in form-system-container" style={{ maxWidth, margin: '0 auto', width: '100%' }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {backUrl && (
              <button
                type="button"
                onClick={() => typeof backUrl === 'string' ? navigate(backUrl) : navigate(-1)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Go Back"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {breadcrumbs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span>/</span>}
                    <span style={{ color: idx === breadcrumbs.length - 1 ? 'var(--text)' : 'inherit', fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400 }}>
                      {bc}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          {extraHeaderRight && <div>{extraHeaderRight}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
              {badge && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(0, 129, 167, 0.12)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {badge}
                </span>
              )}
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text)'
              }}>
                {title}
              </h1>
            </div>
            {subtitle && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Form Workspace Layout */}
      {sidebar ? (
        <div className="form-workspace-layout" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) 1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          <aside className="form-sidebar-rail" style={{ position: 'sticky', top: '1rem' }}>
            {sidebar}
          </aside>
          <div className="form-main-content">
            {children}
          </div>
        </div>
      ) : (
        <div className="form-single-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default FormLayout;
