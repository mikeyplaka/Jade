import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import MyWork from '@/pages/MyWork';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Tasks from '@/pages/Tasks';
import Employees from '@/pages/Employees';
import Schedule from '@/pages/Schedule';
import MapView from '@/pages/MapView';
import TimeTracking from '@/pages/TimeTracking';
import Notifications from '@/pages/Notifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/MyWork" element={<MyWork />} />
        <Route path="/Projects" element={<Projects />} />
        <Route path="/ProjectDetail" element={<ProjectDetail />} />
        <Route path="/Tasks" element={<Tasks />} />
        <Route path="/Employees" element={<Employees />} />
        <Route path="/Schedule" element={<Schedule />} />
        <Route path="/MapView" element={<MapView />} />
        <Route path="/TimeTracking" element={<TimeTracking />} />
        <Route path="/Notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App