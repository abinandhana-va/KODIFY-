import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Eye,
  Send,
  UserCheck,
  Check,
  XCircle,
  Filter
} from 'lucide-react';

export function AdminSupport() {
  const { user } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selected ticket for modal / inspection / reply / resolve
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyText, setReplyText] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/support/tickets');
      setTickets(res.data || []);
    } catch (err) {
      console.error("Failed to load admin support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  const handleOpenTicket = async (ticketId) => {
    try {
      setActionLoading(true);
      const res = await axios.get(`/api/admin/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (err) {
      console.error("Failed to open ticket:", err);
      alert(err.response?.data?.message || "Failed to open ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTicketAction = async (action, customMsg = null) => {
    if (!selectedTicket) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/admin/support/tickets/${selectedTicket.id}/action`, {
        action,
        message: customMsg || replyText
      });
      setSelectedTicket(res.data);
      if (customMsg || replyText) setReplyText('');
      fetchTickets();
    } catch (err) {
      console.error(`Failed to perform action ${action}:`, err);
      alert(err.response?.data?.message || `Failed to perform ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  const getPriorityBadge = (p) => {
    const norm = (p || '').toUpperCase();
    if (norm === 'HIGH') {
      return (
        <span style={{ fontSize: '0.725rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} /> HIGH
        </span>
      );
    }
    if (norm === 'MEDIUM') {
      return (
        <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          MEDIUM
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        LOW
      </span>
    );
  };

  const getStatusBadge = (s) => {
    const norm = (s || '').toUpperCase();
    switch (norm) {
      case 'NEW':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 129, 167, 0.15)', color: 'var(--primary)' }}>NEW</span>;
      case 'VIEWED':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>VIEWED</span>;
      case 'IN_PROGRESS':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>IN PROGRESS</span>;
      case 'WAITING_FOR_USER':
        return <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>AWAITING USER</span>;
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
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0, 175, 185, 0.15)', color: 'var(--secondary)', padding: '2px 8px', borderRadius: '4px' }}>
              ADMIN CONSOLE
            </span>
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
            Support & Ticket Management
          </h2>
          <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Triaged by priority (High &rarr; Medium &rarr; Low) and recency. Review, reply, and resolve user requests.
          </p>
        </div>

        {/* Quick Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="form-control"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority Only</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="VIEWED">Viewed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            type="button"
            onClick={fetchTickets}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TICKETS TABLE */}
      <div className="dashboard-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading support tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <LifeBuoy size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No support tickets match the selected criteria.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>User / Candidate</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Admin</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} style={{ background: t.priority === 'HIGH' && t.status === 'NEW' ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {t.ticketNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t.userName || t.userUsername}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{t.userEmail}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.subject}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {t.category?.replace(/_/g, ' ')}
                  </td>
                  <td>{getPriorityBadge(t.priority)}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t.assignedAdminName || '--'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDate(t.createdAt)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleOpenTicket(t.id)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADMIN TICKET ACTION MODAL */}
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
            maxWidth: '850px',
            width: '100%',
            height: '85vh',
            maxHeight: '750px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    #{selectedTicket.ticketNumber}
                  </span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    From: <strong>{selectedTicket.userName} ({selectedTicket.userEmail})</strong>
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text)', fontWeight: 800 }}>
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

            {/* Quick Lifecycle Action Bar */}
            <div style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--bg-hover)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Admin Lifecycle Actions:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={actionLoading || selectedTicket.status === 'IN_PROGRESS'}
                  onClick={() => handleTicketAction('START_WORKING')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Clock size={12} color="#d97706" /> Start Working
                </button>
                <button
                  type="button"
                  disabled={actionLoading || selectedTicket.status === 'RESOLVED'}
                  onClick={() => handleTicketAction('RESOLVE', 'Ticket has been marked resolved by admin.')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}
                >
                  <CheckCircle2 size={12} /> Resolve Ticket
                </button>
                <button
                  type="button"
                  disabled={actionLoading || selectedTicket.status === 'CLOSED'}
                  onClick={() => handleTicketAction('CLOSE')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
                >
                  <XCircle size={12} /> Close
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div style={{
              padding: '1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {(selectedTicket.messages || []).map((m, idx) => {
                const isAdmin = m.senderRole === 'ADMIN';
                return (
                  <div
                    key={m.id || idx}
                    style={{
                      alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isAdmin ? 'rgba(0, 129, 167, 0.12)' : 'var(--bg)',
                      border: `1px solid ${isAdmin ? 'rgba(0, 129, 167, 0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 0.95rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAdmin ? 'var(--primary)' : 'var(--text)' }}>
                        {isAdmin ? '🛡️ Admin Reply' : `${selectedTicket.userName || 'Candidate'}`}
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

            {/* Admin Response Box */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official admin response to the candidate..."
                  className="form-control"
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}
                />
                <button
                  type="button"
                  disabled={actionLoading || !replyText.trim()}
                  onClick={() => handleTicketAction('REPLY')}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.55rem 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSupport;
