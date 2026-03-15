import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import ThemeProvider from '@/components/ThemeProvider';
import { pagesConfig } from './pages.config';

const roleAccess = {
  'Dashboard': ['admin', 'project_manager'],
  'MyWork': ['employee', 'foreman', 'subcontractor', 'admin', 'project_manager', 'supervisor'],
  'Projects': ['admin', 'project_manager', 'supervisor', 'foreman'],
  'ProjectDetail': ['admin', 'project_manager', 'supervisor', 'foreman'],
  'Tasks': ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'],
  'Employees': ['admin', 'project_manager'],
  'EmployeeTracking': ['admin', 'project_manager', 'supervisor'],
  'Schedule': ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'],
  'MapView': ['admin', 'project_manager'],
  'TimeTracking': ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'],
  'Notifications': ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'],
  'GroupChat': ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'],
  'Equipment': ['admin', 'project_manager', 'supervisor', 'foreman'],
  'Permissions': ['admin'],
};

const ProtectedRoute = ({ children, name, userRole }) => {
  const allowedRoles = roleAccess[name] || [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const isLoginPage = window.location.pathname === '/Login';
  const userRole = user?.role || 'employee';

  // Show loading spinner while checking app public settings or auth
  if ((isLoadingPublicSettings || isLoadingAuth) && !isLoginPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (except on login page)
  if (authError && !isLoginPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required' || authError.type === 'invalid_credentials') {
      return <Navigate to="/Login" replace state={{ from: window.location.pathname }} />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/Login" element={<pagesConfig.Pages.Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={
          <Navigate to={userRole === 'admin' || userRole === 'project_manager' ? '/Dashboard' : '/MyWork'} replace />
        } />
        {Object.entries(pagesConfig.Pages).map(([name, Component]) => {
          if (name === 'Login') return null;
          return (
            <Route 
              key={name} 
              path={`/${name}`} 
              element={
                <ProtectedRoute name={name} userRole={userRole}>
                  <Component />
                </ProtectedRoute>
              } 
            />
          );
        })}
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App