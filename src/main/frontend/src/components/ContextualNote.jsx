import React from 'react';
import { Info, Lightbulb, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * ContextualNote
 * Compact integrated guidance note explaining fields, constraints, and recommendations.
 */
export function ContextualNote({
  type = 'info', // 'info', 'tip', 'security', 'warning', 'success'
  title,
  children,
  style = {}
}) {
  const configs = {
    info: {
      icon: Info,
      color: '#0081A7',
      bg: 'rgba(0, 129, 167, 0.05)',
      border: 'rgba(0, 129, 167, 0.2)'
    },
    tip: {
      icon: Lightbulb,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.06)',
      border: 'rgba(217, 119, 6, 0.22)'
    },
    security: {
      icon: Shield,
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.06)',
      border: 'rgba(2, 132, 199, 0.22)'
    },
    warning: {
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.06)',
      border: 'rgba(220, 38, 38, 0.22)'
    },
    success: {
      icon: CheckCircle2,
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.06)',
      border: 'rgba(5, 150, 105, 0.22)'
    }
  };

  const conf = configs[type] || configs.info;
  const IconComponent = conf.icon;

  return (
    <div style={{
      background: conf.bg,
      border: `1px solid ${conf.border}`,
      borderRadius: '8px',
      padding: '0.75rem 0.85rem',
      fontSize: '0.775rem',
      lineHeight: '1.45',
      color: 'var(--text)',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      ...style
    }}>
      <div style={{ color: conf.color, flexShrink: 0, marginTop: '1px' }}>
        <IconComponent size={15} />
      </div>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 700, color: conf.color, marginBottom: '2px', fontSize: '0.8rem' }}>
            {title}
          </div>
        )}
        <div style={{ color: 'var(--text-muted)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default ContextualNote;
