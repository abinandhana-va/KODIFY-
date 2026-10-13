import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import ErrorBoundary from './ErrorBoundary';
import LandingPage from './LandingPage';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Profile from './Profile';
import AdminDashboard from './AdminDashboard';
import AuthenticatedLayout from './AuthenticatedLayout';
import Problems from './Problems';
import ProblemDetail from './ProblemDetail';
import Activity from './Activity';
import Submissions from './Submissions';
import AdminSubmissions from './AdminSubmissions';
import AdminProblems from './AdminProblems';
import AdminUsers from './AdminUsers';
import AdminBadges from './AdminBadges';
import Leaderboard from './Leaderboard';
import Certificates from './Certificates';
import Badges from './Badges';
import Contests from './Contests';
import ContestCreate from './ContestCreate';
import ContestDetail from './ContestDetail';
import ContestArena from './ContestArena';
import ContestLeaderboard from './ContestLeaderboard';
import AdminContests from './AdminContests';
import AdminCertificates from './AdminCertificates';
import Assignments from './Assignments';
import AssignmentCreate from './AssignmentCreate';
import AssignmentDetail from './AssignmentDetail';
import AdminAssignments from './AdminAssignments';
import SecureExamMode from './SecureExamMode';
import Support from './Support';
import AdminSupport from './AdminSupport';
import Chatbot from './Chatbot';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return null;
  if (user) {
    const searchParams = new URLSearchParams(location.search);
    const rawReturnUrl = searchParams.get('returnUrl') || location.state?.from;
    const returnUrl = (rawReturnUrl && rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//') && !rawReturnUrl.includes('://')) ? rawReturnUrl : null;
    if (returnUrl) {
      return <Navigate to={returnUrl} replace />;
    }
    return user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />;
  }
  return children;
};

const SharedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const SecureExamRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  return children;
};


function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Landing Page at Root Route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          {/* Normal User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/problems" element={<ProtectedRoute><Problems /></ProtectedRoute>} />
          <Route path="/problems/:id" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
          
          {/* Host Verification & Assessments */}
          <Route path="/host-verification" element={<ProtectedRoute><AssignmentCreate /></ProtectedRoute>} />
          <Route path="/assessments" element={<SharedRoute><Assignments /></SharedRoute>} />
          <Route path="/assessments/create" element={<SharedRoute><AssignmentCreate /></SharedRoute>} />
          <Route path="/assessments/:id" element={<SharedRoute><AssignmentDetail /></SharedRoute>} />
          <Route path="/assessments/:id/results" element={<SharedRoute><AssignmentDetail /></SharedRoute>} />

          {/* Assignments */}
          <Route path="/assignments" element={<SharedRoute><Assignments /></SharedRoute>} />
          <Route path="/assignments/create" element={<SharedRoute><AssignmentCreate /></SharedRoute>} />
          <Route path="/assignments/:id" element={<SharedRoute><AssignmentDetail /></SharedRoute>} />
          <Route path="/assignments/:id/results" element={<SharedRoute><AssignmentDetail /></SharedRoute>} />
          <Route path="/assignments/:id/exam" element={<SecureExamMode />} />
          <Route path="/assignments/enter/:id" element={<SecureExamMode />} />
          <Route path="/assignments/:id/enter" element={<SecureExamMode />} />
          <Route path="/assignments/enter" element={<SecureExamMode />} />
          
          {/* Contests (View & Participate) */}
          <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
          <Route path="/contests/create" element={<AdminRoute><ContestCreate /></AdminRoute>} />
          <Route path="/contests/:id" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
          <Route path="/contests/:id/arena" element={<ProtectedRoute><ContestArena /></ProtectedRoute>} />
          <Route path="/contests/:id/leaderboard" element={<ProtectedRoute><ContestLeaderboard /></ProtectedRoute>} />
          <Route path="/contests/:id/result" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
          <Route path="/contests/:id/results" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
          
          <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/certificate" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
          <Route path="/support" element={<SharedRoute><Support /></SharedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/problems" element={<AdminRoute><AdminProblems /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissions /></AdminRoute>} />
          <Route path="/admin/contests" element={<AdminRoute><AdminContests /></AdminRoute>} />
          <Route path="/admin/contests/create" element={<AdminRoute><ContestCreate /></AdminRoute>} />
          <Route path="/admin/assignments" element={<AdminRoute><AdminAssignments /></AdminRoute>} />
          <Route path="/admin/assignments/:id" element={<AdminRoute><AssignmentDetail /></AdminRoute>} />
          <Route path="/admin/certificates" element={<AdminRoute><AdminCertificates /></AdminRoute>} />
          <Route path="/admin/badges" element={<AdminRoute><AdminBadges /></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
          
          {/* Shared Routes */}
          <Route path="/profile" element={<SharedRoute><Profile /></SharedRoute>} />
          <Route path="/leaderboard" element={<SharedRoute><Leaderboard /></SharedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Chatbot />
      </Router>
    </ErrorBoundary>
  );
}

export default App;

