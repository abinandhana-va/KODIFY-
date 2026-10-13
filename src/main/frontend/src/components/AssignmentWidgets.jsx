import React, { useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Camera,
  Maximize2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { formatDateTime } from '../utils/dateUtils';

/**
 * AssignmentOverviewWidget
 * Displays title, creator/host, duration, question count, and schedule.
 */
export function AssignmentOverviewWidget({
  assignment,
  style = {}
}) {
  const safeAssignment = assignment || {};

  const formatDate = (iso) => {
    return formatDateTime(iso, '--');
  };

  return (
    <div className="dashboard-card" style={{ padding: '1rem', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.65rem' }}>
        <ClipboardList size={16} color="var(--primary)" />
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text)' }}>
          Assignment Overview
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Host / Organization:</span>
          <strong style={{ color: 'var(--text)' }}>{safeAssignment.creatorName || safeAssignment.creatorUsername || safeAssignment.organizationName || 'KODIFY Host'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Questions:</span>
          <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{safeAssignment.problemCount || safeAssignment.problems?.length || 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
          <strong>{safeAssignment.durationMinutes || 60} Minutes</strong>
        </div>
        {safeAssignment.dueDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text)' }}>{formatDate(safeAssignment.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * QuestionProgressWidget
 * Compact question progress bar with solved vs remaining counts.
 */
export function QuestionProgressWidget({
  currentIndex = 0,
  totalQuestions = 1,
  solvedCount = 0,
  flaggedCount = 0,
  onSelectQuestion,
  questionStatus = [], // ['SOLVED', 'UNSOLVED', 'CURRENT']
  style = {}
}) {
  const percent = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return (
    <div className="dashboard-card" style={{ padding: '1rem', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={15} color="var(--primary)" />
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
            Assessment Progress
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: percent === 100 ? '#16a34a' : 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
          {percent}%
        </span>
      </div>

      <div style={{ height: '6px', width: '100%', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: percent === 100 ? '#16a34a' : 'var(--primary)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Mini Question Grid */}
      {totalQuestions > 0 && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const status = questionStatus[idx] || 'UNSOLVED';
            const isSolved = status === 'SOLVED';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectQuestion && onSelectQuestion(idx)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isSolved ? '#dcfce7' : (isCurrent ? 'var(--primary-subtle, rgba(0, 129, 167, 0.15))' : 'var(--input-bg)'),
                  color: isSolved ? '#166534' : (isCurrent ? 'var(--primary)' : 'var(--text)'),
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: onSelectQuestion ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title={`Question #${idx + 1}: ${isSolved ? 'Solved' : 'Pending'}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
        <span>Solved: <strong style={{ color: '#16a34a' }}>{solvedCount}</strong></span>
        <span>Remaining: <strong>{Math.max(0, totalQuestions - solvedCount)}</strong></span>
        {flaggedCount > 0 && <span>Flagged: <strong style={{ color: '#d97706' }}>{flaggedCount}</strong></span>}
      </div>
    </div>
  );
}

/**
 * SecurityStatusWidget
 * Verified proctoring security indicators (no fake status, only verified).
 */
export function SecurityStatusWidget({
  cameraActive = false,
  fullscreenActive = false,
  secureModeEnabled = true,
  violationsCount = 0,
  style = {}
}) {
  return (
    <div className="dashboard-card" style={{ padding: '1rem', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.65rem' }}>
        <ShieldCheck size={16} color={violationsCount > 0 ? '#d97706' : '#059669'} />
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
          Integrity & Security
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text)' }}>
            <Camera size={13} color={cameraActive ? '#16a34a' : '#94a3b8'} /> Camera Proctoring:
          </span>
          <span style={{ fontWeight: 700, color: cameraActive ? '#16a34a' : '#94a3b8' }}>
            {cameraActive ? '✓ Connected' : '○ Standby'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text)' }}>
            <Maximize2 size={13} color={fullscreenActive ? '#16a34a' : '#d97706'} /> Fullscreen Lock:
          </span>
          <span style={{ fontWeight: 700, color: fullscreenActive ? '#16a34a' : '#d97706' }}>
            {fullscreenActive ? '✓ Locked' : 'Windowed'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text)' }}>
            <Shield size={13} color="#0284c7" /> Environment:
          </span>
          <span style={{ fontWeight: 700, color: '#0284c7' }}>
            {secureModeEnabled ? 'Secure Sandbox' : 'Standard'}
          </span>
        </div>

        {violationsCount > 0 && (
          <div style={{
            marginTop: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: violationsCount >= 3 ? '#fee2e2' : '#fef3c7',
            color: violationsCount >= 3 ? '#991b1b' : '#92400e',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={12} /> {violationsCount} Integrity Warning{violationsCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ExpandableInstructionsWidget
 * Short collapsible instructions for exam candidates.
 */
export function ExpandableInstructionsWidget({
  instructions,
  defaultOpen = false,
  style = {}
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="dashboard-card" style={{ padding: '0.85rem 1rem', ...style }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={14} color="var(--primary)" /> Assessment Rules & Instructions
        </span>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {open && (
        <div style={{
          marginTop: '0.65rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.75rem',
          lineHeight: '1.5',
          color: 'var(--text-muted)',
          whiteSpace: 'pre-wrap'
        }}>
          {instructions || (
            <>
              • Write clean, optimal algorithmic code in your selected programming language.<br />
              • Click <strong>Run Code</strong> to test against public test cases.<br />
              • Click <strong>Submit Code</strong> to evaluate all test cases and record your score.<br />
              • Do not leave fullscreen mode or switch browser tabs during secure exams.
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default {
  AssignmentOverviewWidget,
  QuestionProgressWidget,
  SecurityStatusWidget,
  ExpandableInstructionsWidget
};
