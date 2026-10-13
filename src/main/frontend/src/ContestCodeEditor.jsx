import React, { useContext } from 'react';
import Editor from '@monaco-editor/react';
import { ThemeContext } from './ThemeContext';
import { Play, Send, RefreshCw, Code2, Maximize2, Minimize2 } from 'lucide-react';
import { getMonacoLanguage, SUPPORTED_LANGUAGES, normalizeLanguageId } from './utils/languageRegistry';

function ContestCodeEditor({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onResetCode,
  onRun,
  onSubmit,
  running,
  submitting,
  disabled = false,
  isFullScreen = false,
  onToggleFullScreen,
  availableLanguages = SUPPORTED_LANGUAGES
}) {
  const { isDark } = useContext(ThemeContext);

  const handleEditorMount = (editor, monaco) => {
    // Add custom keyboard shortcut: Ctrl+Enter or Cmd+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!running && !submitting && !disabled && onRun) {
        onRun();
      }
    });
  };

  return (
    <div
      className="contest-code-editor-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: isDark ? '#0f172a' : '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* TOOLBAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0.85rem',
          background: isDark ? '#1e293b' : 'var(--bg-hover)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={16} color="var(--primary)" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={disabled || running || submitting}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: isDark ? '#0f172a' : '#ffffff',
              color: 'var(--text)',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            {availableLanguages.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onResetCode}
            disabled={disabled || running || submitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title="Reset to default starter template"
          >
            <RefreshCw size={13} /> Reset
          </button>

          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px'
              }}
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* MONACO EDITOR AREA */}
      <div style={{ flex: 1, minHeight: '380px', position: 'relative' }}>
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(val) => onCodeChange(val || '')}
          theme={isDark ? 'vs-dark' : 'light'}
          onMount={handleEditorMount}
          options={{
            readOnly: disabled,
            minimap: { enabled: false },
            fontSize: 13.5,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 10, bottom: 10 }
          }}
        />
      </div>

      {/* FOOTER ACTION BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 0.85rem',
          background: isDark ? '#1e293b' : 'var(--bg-hover)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Tip: Press <strong>Ctrl+Enter</strong> to Run Samples
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onRun}
            disabled={disabled || running || submitting || !code?.trim()}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.95rem',
              fontWeight: 700,
              fontSize: '0.825rem'
            }}
          >
            <Play size={13} fill="currentColor" />
            {running ? 'Running Samples...' : 'RUN'}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || running || submitting || !code?.trim()}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 1.15rem',
              fontWeight: 800,
              fontSize: '0.825rem',
              background: disabled ? 'var(--tag-bg)' : 'var(--primary)',
              color: disabled ? 'var(--text-muted)' : '#ffffff'
            }}
          >
            <Send size={13} />
            {submitting ? 'Submitting...' : 'SUBMIT'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestCodeEditor;
