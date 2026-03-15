import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import ThemeProvider from '@/components/ThemeProvider';
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
import EmployeeTracking from '@/pages/EmployeeTracking';
import GroupChat from '@/pages/GroupChat';
import Equipment from '@/pages/Equipment';
import Permissions from '@/pages/Permissions';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

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
        <Route path="/EmployeeTracking" element={<EmployeeTracking />} />
        <Route path="/GroupChat" element={<GroupChat />} />
        <Route path="/Equipment" element={<Equipment />} />
        <Route path="/Permissions" element={<Permissions />} />
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