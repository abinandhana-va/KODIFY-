import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { FormLayout } from './components/form/FormLayout';
import { FormSection } from './components/form/FormSection';
import { FormField } from './components/form/FormField';
import { FormActions } from './components/form/FormActions';
import { FormValidationSummary } from './components/form/FormValidationSummary';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Star,
  Send,
  HelpCircle,
  Layers,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';

export function Support() {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('CREATE'); // 'CREATE' or 'MY_TICKETS'
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('TECHNICAL_ISSUE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await axios.get('/api/support/tickets/my');
      setTickets(res.data || []);
    } catch (err) {
      console.error("Failed to load user tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'MY_TICKETS') {
      fetchMyTickets();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  const handleOpenTicketDetail = async (ticketId) => {
    try {
      setLoadingDetail(true);
      const res = await axios.get(`/api/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
      alert(err.response?.data?.message || "Failed to load ticket details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    try {
      setSubmittingReply(true);
      const res = await axios.post(`/api/support/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      setSelectedTicket(res.data);
      setReplyMessage('');
      fetchMyTickets();
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCreateTicket = async (e) => {
    if (e) e.preventDefault();
    const newErrors = [];
    if (!subject.trim()) newErrors.push("Please provide a concise subject for your ticket.");
    if (!description.trim()) newErrors.push("Please provide a detailed description of your query or issue.");
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors([]);
      const res = await axios.post('/api/support/tickets', {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        rating: category === 'FEEDBACK' ? rating : null
      });

      setSuccessMessage(`Ticket #${res.data.ticketNumber} created successfully! Our team will respond shortly.`);
      setSubject('');
      setDescription('');
      setCategory('TECHNICAL_ISSUE');
      setPriority('MEDIUM');
      setRating(5);
      fetchMyTickets();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setErrors([err.response?.data?.message || "Failed to create support ticket. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    const norm = (p || '').toUpperCase();
    if (norm === 'HIGH') {
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <AlertTriangle size={11} /> HIGH
      </span>;
    }
    if (norm === 'MEDIUM') {
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        MEDIUM
      </span>;
    }
    return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      LOW
    </span>;
  };

  const getStatusBadge = (s) => {
    const norm = (s || '').toUpperCase();
    switch (norm) {
      case 'NEW':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)' }}>NEW</span>;
      case 'VIEWED':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>VIEWED</span>;
      case 'IN_PROGRESS':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>IN REVIEW</span>;
      case 'WAITING_FOR_USER':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>RESPONSE READY</span>;
      case 'RESOLVED':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>RESOLVED</span>;
      case 'CLOSED':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' }}>CLOSED</span>;
      default:
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-hover)', color: 'var(--text)' }}>{s}</span>;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <FormLayout
      title="Support & Feedback Center"
      subtitle="Submit queries, report technical issues, or provide platform feedback to the KODIFY team."
      badge="Support Desk"
      breadcrumbs={['Dashboard', 'Support']}
      extraHeaderRight={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('CREATE'); setSelectedTicket(null); }}
            className={`btn btn-sm ${activeTab === 'CREATE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PlusCircle size={14} /> Create Ticket
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('MY_TICKETS'); }}
            className={`btn btn-sm ${activeTab === 'MY_TICKETS' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <MessageSquare size={14} /> My Tickets ({tickets.length})
          </button>
        </div>
      }
    >
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateTicket}>
          {successMessage && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              <CheckCircle2 size={18} color="#16a34a" /> {successMessage}
            </div>
          )}

          <FormValidationSummary errors={errors} onDismiss={() => setErrors([])} />

          <FormSection
            title="Ticket Details"
            subtitle="Categorize your request and provide details so we can assist you promptly."
            icon={LifeBuoy}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <FormField label="Category" required hint="Choose the nature of your request">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                >
                  <option value="QUERY">General Query</option>
                  <option value="TECHNICAL_ISSUE">Technical Issue / Bug</option>
                  <option value="ASSIGNMENT_ISSUE">Assessment / Exam Issue</option>
                  <option value="ACCOUNT_ISSUE">Account & Verification Issue</option>
                  <option value="FEEDBACK">Platform Feedback & Suggestions</option>
                  <option value="OTHER">Other Request</option>
                </select>
              </FormField>

              <FormField label="Priority" required hint="Impact level on your workflow">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                >
                  <option value="HIGH">High (Urgent / Blocking Issue)</option>
                  <option value="MEDIUM">Medium (Normal Request)</option>
                  <option value="LOW">Low (Inquiry / Minor Polish)</option>
                </select>
              </FormField>
            </div>

            {category === 'FEEDBACK' && (
              <FormField label="Platform Experience Rating" hint="Rate your overall satisfaction with KODIFY">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: star <= rating ? '#eab308' : 'var(--border)'
                      }}
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star size={24} fill={star <= rating ? '#eab308' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    {rating} / 5 Stars
                  </span>
                </div>
              </FormField>
            )}

            <FormField label="Subject" required hint="Brief summary of the issue or topic">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Code editor not rendering output on Safari"
                className="form-control"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </FormField>

            <FormField label="Description" required hint="Provide complete context, steps to reproduce, or feedback details">
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what occurred, expected outcome, or any specific error messages..."
                className="form-control"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </FormField>

            <FormActions
              onSubmit={handleCreateTicket}
              isLastStep={true}
              submitText="Submit Support Ticket"
              loading={submitting}
              showBack={false}
            />
          </FormSection>
        </form>
      )}

      {activeTab === 'MY_TICKETS' && (
        <div>
          {loadingTickets && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading tickets...</p>}

          {!loadingTickets && tickets.length === 0 && (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <LifeBuoy size={40} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>No support tickets yet</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Have a question or facing a bug? Click "Create Ticket" to reach our support team.
              </p>
            </div>
          )}

          {!loadingTickets && tickets.length > 0 && (
            <div className="dashboard-card" style={{ padding: '1rem', overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                        {t.ticketNumber}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {t.subject}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {t.category?.replace(/_/g, ' ')}
                      </td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {formatDate(t.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenTicketDetail(t.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TICKET DETAIL & TIMELINE MODAL */}
      {selectedTicket && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedTicket(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            maxWidth: '750px',
            width: '100%',
            height: '85vh',
            maxHeight: '750px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                    #{selectedTicket.ticketNumber}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', color: 'var(--text)', fontWeight: 800 }}>
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            {/* Status Timeline Header */}
            <div style={{
              background: 'var(--bg-hover)',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                Status Lifecycle Timeline
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.725rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span>Created: <strong>{formatDate(selectedTicket.createdAt)}</strong></span>
                </div>
                {selectedTicket.viewedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#3b82f6" />
                    <span>Viewed: <strong>{formatDate(selectedTicket.viewedAt)}</strong></span>
                  </div>
                )}
                {selectedTicket.startedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#d97706" />
                    <span>In Review: <strong>{formatDate(selectedTicket.startedAt)}</strong></span>
                  </div>
                )}
                {selectedTicket.resolvedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#16a34a" />
                    <span>Resolved: <strong>{formatDate(selectedTicket.resolvedAt)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Message Thread */}
            <div style={{
              padding: '1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {(selectedTicket.messages || []).map((m, idx) => {
                const isAdminMsg = m.senderRole === 'ADMIN';
                return (
                  <div
                    key={m.id || idx}
                    style={{
                      alignSelf: isAdminMsg ? 'flex-start' : 'flex-end',
                      maxWidth: '82%',
                      background: isAdminMsg ? 'rgba(0, 129, 167, 0.08)' : 'rgba(0, 175, 185, 0.12)',
                      border: `1px solid ${isAdminMsg ? 'rgba(0, 129, 167, 0.25)' : 'rgba(0, 175, 185, 0.3)'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 0.95rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAdminMsg ? 'var(--primary)' : 'var(--secondary)' }}>
                        {isAdminMsg ? '🛡️ KODIFY Support Team' : `${m.senderName || m.senderUsername || 'You'} (Candidate)`}
                      </span>
                      <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Input Footer */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--card-bg)',
              flexShrink: 0
            }}>
              {selectedTicket.status !== 'CLOSED' ? (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type a response or follow-up question..."
                    className="form-control"
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.55rem 1.25rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  This ticket has been marked as closed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </FormLayout>
  );
}

export default Support;
