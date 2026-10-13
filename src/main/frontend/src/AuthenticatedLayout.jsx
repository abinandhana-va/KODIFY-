import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import LanguageSelector from './LanguageSelector';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  FileCode,
  ClipboardList,
  Trophy,
  Terminal,
  Award,
  Sparkles,
  User as UserIcon,
  Users,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  LifeBuoy,
  Bell,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

function AuthenticatedLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme, isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.allSettled([
        axios.get('/api/notifications'),
        axios.get('/api/notifications/unread-count')
      ]);
      if (listRes.status === 'fulfilled') setNotifications(listRes.value.data || []);
      if (countRes.status === 'fulfilled') setUnreadCount(countRes.value.data?.unreadCount || 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifications();
      if (link) {
        setNotifOpen(false);
        navigate(link);
      }
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === 'ADMIN' ? [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Problems', path: '/admin/problems', icon: FileCode },
    { name: 'Assignments', path: '/admin/assignments', icon: ClipboardList },
    { name: 'Contests', path: '/admin/contests', icon: Trophy },
    { name: 'Support Desk', path: '/admin/support', icon: LifeBuoy },
    { name: 'Certificates', path: '/admin/certificates', icon: Award },
    { name: 'Badges', path: '/admin/badges', icon: Sparkles },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Submissions', path: '/admin/submissions', icon: Terminal },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy }
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Problems', path: '/problems', icon: FileCode },
    { name: 'Assignments', path: '/assignments', icon: ClipboardList },
    { name: 'Contests', path: '/contests', icon: Trophy },
    { name: 'Submissions', path: '/submissions', icon: Terminal },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Certificates', path: '/certificates', icon: Award },
    { name: 'Badges', path: '/badges', icon: Sparkles },
    { name: 'Support', path: '/support', icon: LifeBuoy },
    { name: 'Profile', path: '/profile', icon: UserIcon }
  ];

  const currentSection = navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Workspace';

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div>
          <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
            {!collapsed && (
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="sidebar-brand-title" style={{ color: '#ffffff' }}>KODIFY</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--sandal)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', background: 'rgba(254, 217, 183, 0.15)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(254, 217, 183, 0.25)' }}>
                  கோடிஃபை
                </span>
                {user?.role === 'ADMIN' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', background: 'rgba(0, 175, 185, 0.15)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(0, 175, 185, 0.3)' }}>
                    ADMIN
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              style={{ background: 'transparent', border: 'none', color: 'var(--sidebar-text)', cursor: 'pointer', display: 'flex', padding: '2px' }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={16} />
            </button>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            {!collapsed && (
              <div className="nav-section-title" style={{ color: 'var(--sandal)', opacity: 0.8 }}>
                {user?.role === 'ADMIN' ? 'Assessment Console' : 'Developer Platform'}
              </div>
            )}
            <nav>
              {navItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    to={item.path}
                    key={item.name}
                    className={`nav-item ${active ? 'active' : ''}`}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                    title={collapsed ? item.name : ''}
                  >
                    <Icon size={16} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px 4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--sidebar-text)', fontWeight: 600 }}>Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.725rem'
                }}
              >
                {isDark ? <Sun size={12} color="var(--sandal)" /> : <Moon size={12} />}
                <span>{isDark ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '4px' }}>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || user?.username}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)' }}>
                  {user?.role || 'USER'}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--primary)' }}>KODIFY</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentSection}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Language Selector */}
            <LanguageSelector compact={true} />

            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="btn btn-secondary btn-sm"
                title="Notifications"
                style={{ padding: '0.25rem 0.55rem', position: 'relative' }}
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)' }}>
                      Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: n.isRead ? 'transparent' : 'rgba(0, 129, 167, 0.05)',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: n.isRead ? 600 : 700, color: 'var(--text)' }}>
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '5px' }} />
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ padding: '0.25rem 0.55rem' }}
            >
              {isDark ? <Sun size={14} color="var(--sandal)" /> : <Moon size={14} />}
            </button>

            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)'
                }} 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <UserIcon size={14} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)' }}>{user?.username}</span>
              </div>
              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 100,
                  minWidth: '140px',
                  overflow: 'hidden'
                }}>
                  <Link
                    to="/profile"
                    className="nav-item"
                    style={{ display: 'flex', alignItems: 'center', margin: 0, borderRadius: 0, padding: '0.5rem 0.75rem', color: 'var(--text)' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserIcon size={14} style={{ marginRight: '6px' }} /> Profile
                  </Link>
                  <Link
                    to={user?.role === 'ADMIN' ? "/admin/support" : "/support"}
                    className="nav-item"
                    style={{ display: 'flex', alignItems: 'center', margin: 0, borderRadius: 0, padding: '0.5rem 0.75rem', color: 'var(--text)' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LifeBuoy size={14} style={{ marginRight: '6px' }} /> Support
                  </Link>
                  <div
                    className="nav-item"
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0, borderRadius: 0, padding: '0.5rem 0.75rem', color: '#dc2626' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={14} style={{ marginRight: '6px' }} /> Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AuthenticatedLayout;

