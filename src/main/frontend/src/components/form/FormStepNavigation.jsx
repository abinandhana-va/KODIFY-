import React from 'react';
import { Check, AlertCircle, ChevronRight } from 'lucide-react';

/**
 * Banyan Tree style FormStepNavigation
 * Displays hierarchical branch steps, active step, completed step indicator (✓), and error status.
 * Allows seamless navigation across steps.
 */
export function FormStepNavigation({
  steps = [],
  activeStep,
  completedSteps = [],
  errorSteps = [],
  onStepClick,
  title = "Form Progression"
}) {
  return (
    <div className="form-step-nav-card" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--primary)',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{title}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {completedSteps.length} of {steps.length} done
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
        {steps.map((step, idx) => {
          const stepId = step.id ?? idx + 1;
          const isActive = activeStep === stepId;
          const isCompleted = completedSteps.includes(stepId);
          const hasError = errorSteps.includes(stepId);
          const isClickable = Boolean(onStepClick);

          return (
            <div key={stepId} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                onClick={() => isClickable && onStepClick(stepId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: isClickable ? 'pointer' : 'default',
                  background: isActive ? 'rgba(0, 129, 167, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 129, 167, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Step indicator circle */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: hasError
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isCompleted
                    ? '#16a34a'
                    : isActive
                    ? 'var(--primary)'
                    : 'var(--bg-hover)',
                  color: (isCompleted || isActive) && !hasError ? '#ffffff' : hasError ? '#ef4444' : 'var(--text-muted)',
                  border: hasError ? '1px solid #ef4444' : 'none'
                }}>
                  {hasError ? (
                    <AlertCircle size={14} />
                  ) : isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    stepId
                  )}
                </div>

                {/* Step info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--primary)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {step.title}
                  </div>
                  {step.subtitle && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {step.subtitle}
                    </div>
                  )}
                </div>

                {isActive && (
                  <ChevronRight size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                )}
              </div>

              {/* Sub-steps / Children if any (Banyan tree branches) */}
              {step.subSteps && step.subSteps.length > 0 && (
                <div style={{
                  marginLeft: '22px',
                  paddingLeft: '12px',
                  borderLeft: '2px solid var(--border)',
                  margin: '4px 0 6px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {step.subSteps.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => onStepClick && onStepClick(sub.id)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        cursor: onStepClick ? 'pointer' : 'default',
                        color: activeStep === sub.id ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeStep === sub.id ? 700 : 400
                      }}
                    >
                      • {sub.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default FormStepNavigation;
