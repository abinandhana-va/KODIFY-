import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import KodifyMascot from './KodifyMascot';
import { MessageSquare, X, Send, Sparkles, User, Terminal, ChevronDown, RotateCcw, AlertTriangle } from 'lucide-react';

export default function Chatbot() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check if current route is a secure exam route
  const isExamRoute = location.pathname.includes('/exam');

  // Derive problemId if on problem detail page
  const problemMatch = location.pathname.match(/\/problems\/(\d+)/);
  const currentProblemId = problemMatch ? Number(problemMatch[1]) : null;

  // Initialize greeting on first open or user change
  useEffect(() => {
    if (messages.length === 0) {
      if (user) {
        setMessages([
          {
            sender: 'bot',
            text: `👋 Vanakkam, **${user.name || user.username}**! I am your KODIFY coding companion. Ask me about your problem progress, assignments, certificates, or hints on challenges.`,
            time: new Date()
          }
        ]);
        setSuggestions(['Show my progress', 'What should I practice?', 'My assignments', 'My certificates']);
      } else {
        setMessages([
          {
            sender: 'bot',
            text: `👋 Vanakkam! I am your **KODIFY Assistant**. I can help you explore the platform, understand our Docker sandbox, learning paths, contests, and certifications.`,
            time: new Date()
          }
        ]);
        setSuggestions(['What is KODIFY?', 'How does the coding sandbox work?', 'Supported programming languages', 'How do assignments work?']);
      }
    }
  }, [user, location.pathname]);

  // Update suggestions dynamically based on route
  useEffect(() => {
    if (currentProblemId) {
      setSuggestions(['Explain this problem', 'Give me a hint', 'Explain the constraints', 'What is the expected complexity?']);
    } else if (user) {
      setSuggestions(['Show my progress', 'What should I practice?', 'My assignments', 'My recent submissions']);
    } else {
      setSuggestions(['What is KODIFY?', 'How does the coding sandbox work?', 'Supported programming languages', 'How do assignments work?']);
    }
  }, [location.pathname, currentProblemId, user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  // Do not render floating chatbot during active exam routes
  if (isExamRoute) {
    return null;
  }

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = { sender: 'user', text: textToSend, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const payload = {
        message: textToSend,
        context: {
          page: location.pathname,
          problemId: currentProblemId
        }
      };

      const res = await axios.post('/api/chat', payload);
      const data = res.data;

      if (data.disabled) {
        setChatDisabled(true);
        setDisabledMessage(data.reply || 'Chat assistance is disabled during secure assignments.');
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply || '⚠️ Chat assistance is disabled during active secure assignments.',
            time: new Date(),
            isWarning: true
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            time: new Date()
          }
        ]);
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errReply = err.response?.data?.message || 'Sorry, I encountered a temporary issue processing your request. Please try again.';
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ ${errReply}`,
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: user 
          ? `🔄 Chat refreshed. How can I help you, **${user.name || user.username}**?`
          : '🔄 Chat refreshed. How can I help you explore KODIFY?',
        time: new Date()
      }
    ]);
  };

  // Format simple markdown (bold, code blocks, bullet points)
  const renderMessageContent = (text) => {
    if (!text) return '';
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let lang = '';
        let code = part.slice(3, -3);
        if (lines[0] && !lines[0].includes(' ') && lines.length > 1) {
          lang = lines[0];
          code = lines.slice(1).join('\n');
        }
        return (
          <pre
            key={index}
            className="notranslate"
            translate="no"
            style={{
              background: '#090d16',
              color: '#38bdf8',
              padding: '0.65rem',
              borderRadius: '6px',
              fontSize: '0.785rem',
              fontFamily: "'JetBrains Mono', monospace",
              overflowX: 'auto',
              margin: '0.5rem 0',
              border: '1px solid #1e293b'
            }}
          >
            <code>{code}</code>
          </pre>
        );
      }

      // Inline formatting
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIdx) => {
            // Replace bold **text** and inline `code`
            const formattedLine = line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="notranslate" translate="no" style="background: rgba(0,129,167,0.12); color: var(--primary); padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.85em;">$1</code>');

            return (
              <span key={lIdx} style={{ display: 'block', minHeight: line.trim() === '' ? '0.4rem' : 'auto' }}>
                <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1200, fontFamily: 'var(--font-sans)' }}>
      
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#04c2ac',
            border: '2px solid var(--sandal)',
            borderRadius: '28px',
            padding: '6px 14px 6px 8px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 129, 167, 0.4)',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            outline: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 129, 167, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 129, 167, 0.4)';
          }}
          title="Ask KODIFY Assistant"
          aria-label="Ask KODIFY Assistant"
        >
          <div style={{ animation: 'pulse 3s infinite ease-in-out' }}>
            <KodifyMascot size={36} mood="happy" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.02em' }}>Ask KODIFY</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--sandal)', opacity: 0.9 }}>AI Companion</div>
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: 'calc(100vh - 100px)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#04c2ac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid var(--sandal)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <KodifyMascot size={34} mood={loading ? 'thinking' : 'happy'} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}>KODIFY Assistant</span>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399' }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--sandal)', opacity: 0.95 }}>
                  {currentProblemId ? `Context: Problem #${currentProblemId}` : (user ? 'Personalized Mode' : 'Guest Explorer Mode')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={clearChat}
                style={{ background: 'transparent', border: 'none', color: '#c25a04', opacity: 0.8, cursor: 'pointer', padding: '4px' }}
                title="Clear Conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#c25a04', cursor: 'pointer', padding: '4px' }}
                title="Minimize Chat"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* MESSAGES BODY */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              background: 'var(--bg)'
            }}
          >
            {messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isBot ? 'flex-start' : 'flex-end',
                    gap: '8px',
                    alignItems: 'flex-start'
                  }}
                >
                  {isBot && (
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <KodifyMascot size={24} mood={m.isWarning ? 'thinking' : 'happy'} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      background: isBot 
                        ? (m.isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg)') 
                        : 'var(--primary)',
                      color: isBot 
                        ? (m.isWarning ? '#dc2626' : 'var(--text)') 
                        : '#ffffff',
                      border: isBot 
                        ? (m.isWarning ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)') 
                        : 'none',
                      boxShadow: 'var(--shadow-xs)',
                      fontSize: '0.825rem',
                      lineHeight: 1.45
                    }}
                  >
                    {renderMessageContent(m.text)}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                <KodifyMascot size={22} mood="thinking" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTION CHIPS */}
          {suggestions.length > 0 && !chatDisabled && (
            <div
              style={{
                padding: '0.4rem 0.75rem',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                background: 'var(--card-bg)',
                borderTop: '1px solid var(--border)'
              }}
            >
              {suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleSend(sug)}
                  style={{
                    whiteSpace: 'nowrap',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '3px 9px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 129, 167, 0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* INPUT FORM */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '0.65rem 0.75rem',
              background: 'var(--card-bg)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={chatDisabled ? "Chat disabled during exam..." : "Ask about algorithms, progress, assignments..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={chatDisabled || loading}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.825rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={chatDisabled || loading || !input.trim()}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.45rem 0.75rem',
                cursor: (chatDisabled || loading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (chatDisabled || loading || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
