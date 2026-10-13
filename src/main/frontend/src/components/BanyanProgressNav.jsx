import React from 'react';
import { Check, Circle } from 'lucide-react';

/**
 * BanyanProgressNav
 * Cultural visual step progression inspired by banyan branches and kolam nodes.
 */
export function BanyanProgressNav({
  steps = [], // [{ id: 1, title: 'Details', subtitle: 'Title & Schedule', icon: null }]
  activeStep = 1,
  onStepClick = () => {},
  completedSteps = [] // [1, 2]
}) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '1.25rem 1rem',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.3px' }}>
            Workflow Path
          </h4>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Step {activeStep} of {steps.length}
          </span>
        </div>

        {/* Small kolam accent badge */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(0, 129, 167, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {steps.map((s, idx) => {
          const isCompleted = completedSteps.includes(s.id) || (typeof s.id === 'number' && s.id < activeStep);
          const isActive = s.id === activeStep;
          const isLast = idx === steps.length - 1;

          return (
            <div key={s.id} style={{ display: 'flex', position: 'relative' }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '28px',
                  bottom: '-10px',
                  width: '2px',
                  background: isCompleted ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.3s ease',
                  zIndex: 1
                }} />
              )}

              {/* Node Button */}
              <div
                onClick={() => onStepClick(s.id)}
                className={`banyan-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : 'upcoming'}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  padding: '0.5rem 0.6rem',
                  borderRadius: '6px',
                  cursor: isCompleted || isActive ? 'pointer' : 'default',
                  zIndex: 2,
                  marginBottom: '0.65rem'
                }}
              >
                {/* Visual Step Marker */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  background: isCompleted
                    ? 'var(--primary)'
                    : (isActive ? 'var(--primary-subtle, rgba(0, 129, 167, 0.15))' : 'var(--bg)'),
                  color: isCompleted
                    ? '#ffffff'
                    : (isActive ? 'var(--primary)' : 'var(--text-muted)'),
                  border: isCompleted
                    ? '2px solid var(--primary)'
                    : (isActive ? '2px solid var(--primary)' : '1px solid var(--border)'),
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 0 3px rgba(0, 129, 167, 0.15)' : 'none'
                }}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : s.id}
                </div>

                {/* Text Description */}
                <div style={{ minWidth: 0, flex: 1, paddingTop: '2px' }}>
                  <div style={{
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--primary)' : (isCompleted ? 'var(--text)' : 'var(--text-muted)'),
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {s.title}
                  </div>
                  {s.subtitle && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginTop: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {s.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BanyanProgressNav;
