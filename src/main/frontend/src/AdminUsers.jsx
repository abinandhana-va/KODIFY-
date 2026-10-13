import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { 
  User as UserIcon, Shield, ShieldAlert, Search, Filter, 
  CheckCircle2, XCircle, Trash2, Eye, Lock, Unlock, 
  Award, Trophy, Calendar, Mail, Phone, FileText, Check, X, 
  Flame, Sparkles, AlertTriangle, RefreshCw 
} from 'lucide-react';

function AdminUsers() {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileTab, setProfileTab] = useState('overview');

  const [blockModalUser, setBlockModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      setLoadingProfile(true);
      setSelectedUser(null);
      setProfileTab('overview');
      const res = await axios.get(`/api/admin/users/${user.id}`);
      setSelectedUser(res.data);
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load user profile.'
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!blockModalUser) return;
    const isCurrentlyBlocked = blockModalUser.status === 'BLOCKED';
    const newStatus = isCurrentlyBlocked ? 'ACTIVE' : 'BLOCKED';

    try {
      setActionLoading(true);
      await axios.patch(`/api/admin/users/${blockModalUser.id}/status`, { status: newStatus });
      
      setActionMsg({
        type: 'success',
        text: `User ${blockModalUser.username || blockModalUser.name} has been ${isCurrentlyBlocked ? 'unblocked and enabled' : 'blocked successfully'}.`
      });

      // Update local state
      setUsers(prev => prev.map(u => u.id === blockModalUser.id ? { ...u, status: newStatus } : u));
      if (selectedUser && selectedUser.id === blockModalUser.id) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
      setBlockModalUser(null);
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user status.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;

    try {
      setActionLoading(true);
      await axios.delete(`/api/admin/users/${deleteModalUser.id}`);
      
      setActionMsg({
        type: 'success',
        text: `User ${deleteModalUser.username || deleteModalUser.name} and associated records removed successfully.`
      });

      setUsers(prev => prev.map(u => u.id).filter(id => id !== deleteModalUser.id ? true : false));
      if (selectedUser && selectedUser.id === deleteModalUser.id) {
        setSelectedUser(null);
      }
      setDeleteModalUser(null);
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete user.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = async (vId, docType = 'member-proof') => {
    try {
      const res = await axios.get(`/api/creator-verification/admin/${vId}/document`, {
        params: { type: docType },
        responseType: 'blob'
      });
      const contentType = res.headers['content-type'] || (docType === 'member-proof' ? 'application/pdf' : 'image/jpeg');
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("View document error:", err);
      alert(err.response?.data?.message || "Failed to open document. It may not exist or authorization failed.");
    }
  };

  // Filtered list
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && (u.status === 'ACTIVE' || !u.status)) ||
      (statusFilter === 'BLOCKED' && u.status === 'BLOCKED');

    const matchesRole = 
      roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isSelfOrAdmin = (u) => {
    return u.role === 'ADMIN' || u.email === 'kodifyofficial@gmail.com' || u.email === 'admin@123' || (currentUser && (u.id === currentUser.id || u.email === currentUser.email));
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={24} color="var(--primary)" />
            User Management
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            View member portfolios, manage platform access statuses, and manage accounts securely.
          </p>
        </div>

        <button 
          onClick={fetchUsers}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Users
        </button>
      </div>

      {/* ALERT MESSAGE */}
      {actionMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          background: actionMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: actionMsg.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{actionMsg.text}</span>
          </div>
          <button 
            onClick={() => setActionMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS BAR */}
      <div className="dashboard-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search by name, username, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', width: '100%', fontSize: '0.85rem', height: '36px' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', height: '36px', padding: '0.2rem 0.5rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', height: '36px', padding: '0.2rem 0.5rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

        </div>
      </div>

      {/* USERS TABLE */}
      <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && <p style={{ padding: '1.5rem', margin: 0, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</p>}
        {error && <p style={{ padding: '1.5rem', margin: 0, textAlign: 'center', color: '#dc2626' }}>{error}</p>}
        
        {!loading && !error && filteredUsers.length === 0 && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>No users match the search / filter criteria.</p>
          </div>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700 }}>User</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700 }}>Username</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700 }}>Joined</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isBlocked = u.status === 'BLOCKED';
                  const protectedUser = isSelfOrAdmin(u);

                  return (
                    <tr 
                      key={u.id}
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        background: isBlocked ? 'rgba(240, 113, 103, 0.04)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: u.role === 'ADMIN' ? 'var(--primary-subtle, #e0f2fe)' : '#f1f5f9',
                            color: u.role === 'ADMIN' ? 'var(--primary, #0081A7)' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: '1px solid var(--border)'
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{u.name || 'Unnamed User'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        @{u.username}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: u.role === 'ADMIN' ? 'rgba(0, 129, 167, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                          color: u.role === 'ADMIN' ? '#0081A7' : '#475569',
                          border: `1px solid ${u.role === 'ADMIN' ? 'rgba(0, 129, 167, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`
                        }}>
                          {u.role === 'ADMIN' && <Shield size={11} />}
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isBlocked ? '#fef2f2' : '#f0fdf4',
                          color: isBlocked ? '#dc2626' : '#16a34a',
                          border: `1px solid ${isBlocked ? '#fecaca' : '#bbf7d0'}`
                        }}>
                          {isBlocked ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(u.createdAt)}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => handleViewUser(u)}
                            className="btn-secondary"
                            title="View user profile & achievements"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* BLOCK / UNBLOCK BUTTON */}
                          {!protectedUser && (
                            <button
                              onClick={() => setBlockModalUser(u)}
                              title={isBlocked ? "Unblock / Enable user" : "Block user from platform"}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: isBlocked ? '#f0fdf4' : '#fff1f2',
                                color: isBlocked ? '#16a34a' : '#e11d48',
                                border: `1px solid ${isBlocked ? '#bbf7d0' : '#fecdd3'}`
                              }}
                            >
                              {isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                              {isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          )}

                          {/* DELETE BUTTON */}
                          {!protectedUser && (
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              title="Delete user account & clean records"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca'
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}

                          {protectedUser && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Protected
                            </span>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          VIEW USER PROFILE MODAL
      ========================================================= */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--tag-bg, #f8fafc)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--primary, #0081A7)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}>
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedUser.name} <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{selectedUser.username}</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: selectedUser.status === 'BLOCKED' ? '#fef2f2' : '#f0fdf4',
                      color: selectedUser.status === 'BLOCKED' ? '#dc2626' : '#16a34a',
                      border: `1px solid ${selectedUser.status === 'BLOCKED' ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {selectedUser.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Joined {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', background: 'var(--card-bg, #ffffff)' }}>
              {['overview', 'submissions', 'achievements', 'assignments'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: profileTab === tab ? '2px solid var(--primary, #0081A7)' : '2px solid transparent',
                    color: profileTab === tab ? 'var(--primary, #0081A7)' : 'var(--text-muted)',
                    fontWeight: profileTab === tab ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'grid', gap: '1.25rem' }}>
              
              {/* TAB 1: OVERVIEW */}
              {profileTab === 'overview' && (
                <>
                  {/* METRICS ROW */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--tag-bg, #f8fafc)', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Solved</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary, #0081A7)', marginTop: '2px' }}>
                        {selectedUser.solvedCount || 0}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>Easy Solved</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                        {selectedUser.easySolved || 0}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>Medium Solved</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                        {selectedUser.mediumSolved || 0}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 600 }}>Hard Solved</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                        {selectedUser.hardSolved || 0}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--tag-bg, #f8fafc)', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contests Played</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
                        {selectedUser.contestsParticipated || 0}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--tag-bg, #f8fafc)', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Streak 🔥</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                        {selectedUser.currentStreak || 0}
                      </div>
                    </div>
                  </div>

                  {/* USER INFO DETAILS */}
                  <div style={{ background: 'var(--tag-bg, #f8fafc)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Account & Contact Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span style={{ fontWeight: 600 }}>{selectedUser.email}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Phone / Contact:</span> <span style={{ fontWeight: 600 }}>{selectedUser.contact || 'Not provided'}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> <span style={{ fontWeight: 600 }}>{selectedUser.role}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Account Status:</span> <span style={{ fontWeight: 600 }}>{selectedUser.status}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Created Date:</span> <span style={{ fontWeight: 600 }}>{formatDate(selectedUser.createdAt)}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Last Updated:</span> <span style={{ fontWeight: 600 }}>{formatDate(selectedUser.updatedAt)}</span></div>
                    </div>
                    {selectedUser.bio && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bio:</span> <span style={{ fontStyle: 'italic' }}>{selectedUser.bio}</span>
                      </div>
                    )}
                  </div>

                  {/* CREATOR VERIFICATION CARD */}
                  {selectedUser.creatorVerification && (
                    <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Assignment Creator Verification</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.825rem' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Organization:</span> <strong>{selectedUser.creatorVerification.organizationName}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Verification Status:</span> <strong>{selectedUser.creatorVerification.status}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Submitted:</span> {formatDate(selectedUser.creatorVerification.submittedAt)}</div>
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedUser.creatorVerification.hasGovernmentId1 !== false && (
                          <button
                            type="button"
                            onClick={() => handleViewDocument(selectedUser.creatorVerification.id, 'gov-id-1')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <FileText size={13} /> View Gov ID 1
                          </button>
                        )}
                        {selectedUser.creatorVerification.hasGovernmentId2 !== false && (
                          <button
                            type="button"
                            onClick={() => handleViewDocument(selectedUser.creatorVerification.id, 'gov-id-2')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <FileText size={13} /> View Gov ID 2
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleViewDocument(selectedUser.creatorVerification.id, 'member-proof')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FileText size={13} /> View Proof PDF
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: SUBMISSIONS */}
              {profileTab === 'submissions' && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Recent Submissions History</h4>
                  {(!selectedUser.recentSubmissions || selectedUser.recentSubmissions.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No code submissions recorded for this user.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--tag-bg, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Problem</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Difficulty</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Language</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Test Cases</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.recentSubmissions.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{s.problemTitle || `Problem #${s.problemId}`}</td>
                              <td style={{ padding: '6px 10px' }}>{s.problemDifficulty}</td>
                              <td style={{ padding: '6px 10px' }}>
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: s.status === 'ACCEPTED' ? '#f0fdf4' : '#fef2f2',
                                  color: s.status === 'ACCEPTED' ? '#16a34a' : '#dc2626'
                                }}>
                                  {s.status}
                                </span>
                              </td>
                              <td style={{ padding: '6px 10px', textTransform: 'uppercase' }}>{s.language}</td>
                              <td style={{ padding: '6px 10px' }}>{s.passedTestCases != null ? `${s.passedTestCases}/${s.totalTestCases}` : '-'}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{formatDate(s.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACHIEVEMENTS */}
              {profileTab === 'achievements' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* BADGES */}
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="var(--primary)" /> Earned Badges ({selectedUser.badges?.filter(b => b.unlocked).length || 0})
                    </h4>
                    {(!selectedUser.badges || selectedUser.badges.filter(b => b.unlocked).length === 0) ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No badges earned yet.</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {selectedUser.badges.filter(b => b.unlocked).map(b => (
                          <div key={b.id} style={{ textAlign: 'center', width: '85px', padding: '6px', borderRadius: '6px', background: 'var(--tag-bg, #f8fafc)', border: '1px solid var(--border)' }}>
                            <img src={b.imageUrl} alt={b.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '4px' }}>{b.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CERTIFICATES */}
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="var(--primary)" /> Earned Certificates ({selectedUser.certificates?.filter(c => c.unlocked).length || 0})
                    </h4>
                    {(!selectedUser.certificates || selectedUser.certificates.filter(c => c.unlocked).length === 0) ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No certificates unlocked yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        {selectedUser.certificates.filter(c => c.unlocked).map(c => (
                          <div key={c.id} style={{ padding: '0.75rem', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px' }}>{c.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ASSIGNMENTS */}
              {profileTab === 'assignments' && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Assignment Participation History</h4>
                  {(!selectedUser.assignments || selectedUser.assignments.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No assignments associated with this account.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--tag-bg, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Assignment</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Access Code</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Score</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Assigned Date</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.assignments.map(a => (
                            <tr key={a.assignmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.assignmentTitle}</td>
                              <td style={{ padding: '6px 10px' }}>
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: a.status === 'COMPLETED' ? '#dcfce7' : (a.status === 'IN_PROGRESS' ? '#dbeafe' : 'var(--tag-bg)'),
                                  color: a.status === 'COMPLETED' ? '#166534' : (a.status === 'IN_PROGRESS' ? '#1e40af' : 'var(--text-muted)')
                                }}>
                                  {a.status}
                                </span>
                              </td>
                              <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{a.accessCode || '-'}</td>
                              <td style={{ padding: '6px 10px', fontWeight: 700 }}>{a.score != null ? `${a.score}%` : '-'}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{formatDate(a.assignedAt)}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '2px 8px', fontSize: '0.725rem', fontWeight: 600 }}
                                  onClick={() => {
                                    setSelectedUser(null);
                                    navigate(`/assignments/${a.assignmentId}`);
                                  }}
                                >
                                  Review
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

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--tag-bg, #f8fafc)'
            }}>
              <div>
                {!isSelfOrAdmin(selectedUser) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setBlockModalUser(selectedUser)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedUser.status === 'BLOCKED' ? '#f0fdf4' : '#fff1f2',
                        color: selectedUser.status === 'BLOCKED' ? '#16a34a' : '#e11d48',
                        border: `1px solid ${selectedUser.status === 'BLOCKED' ? '#bbf7d0' : '#fecdd3'}`
                      }}
                    >
                      {selectedUser.status === 'BLOCKED' ? 'Unblock Account' : 'Block Account'}
                    </button>

                    <button
                      onClick={() => setDeleteModalUser(selectedUser)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                      }}
                    >
                      Delete Account
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          BLOCK / UNBLOCK CONFIRMATION MODAL
      ========================================================= */}
      {blockModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '10px',
            maxWidth: '450px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: blockModalUser.status === 'BLOCKED' ? '#f0fdf4' : '#fff1f2',
                color: blockModalUser.status === 'BLOCKED' ? '#16a34a' : '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {blockModalUser.status === 'BLOCKED' ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                {blockModalUser.status === 'BLOCKED' ? 'Enable this user?' : 'Block this user?'}
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              {blockModalUser.status === 'BLOCKED' ? (
                <>
                  Enabling <strong>{blockModalUser.name}</strong> (@{blockModalUser.username}) will restore their ability to sign in and access the KODIFY platform. All existing user achievements and history remain intact.
                </>
              ) : (
                <>
                  A blocked user cannot sign in or access KODIFY. Any existing active sessions for <strong>{blockModalUser.name}</strong> (@{blockModalUser.username}) will be immediately revoked by Spring Security.
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={actionLoading}
                onClick={() => setBlockModalUser(null)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmStatusToggle}
                style={{
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: blockModalUser.status === 'BLOCKED' ? '#16a34a' : '#e11d48',
                  color: '#ffffff'
                }}
              >
                {actionLoading ? 'Updating...' : (blockModalUser.status === 'BLOCKED' ? 'Confirm Unblock' : 'Confirm Block')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION MODAL
      ========================================================= */}
      {deleteModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '10px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#991b1b' }}>
                Delete this user?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: '1.5', margin: '0 0 0.75rem 0' }}>
              User account <strong>{deleteModalUser.name}</strong> (@{deleteModalUser.username}) and associated submissions, achievements, and attempt data will be permanently removed.
            </p>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 1.25rem 0', background: 'var(--tag-bg, #f8fafc)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              ✓ Note: Shared problems, platform assignments, and contest templates used by other learners will remain safe and unaffected.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={actionLoading}
                onClick={() => setDeleteModalUser(null)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff'
                }}
              >
                {actionLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminUsers;

