import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgencyConfigProvider, useAgencyConfig } from './context/AgencyConfigContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import DevLoginPage from './pages/DevLoginPage';
import VerticalPage from './pages/VerticalPage';
import ClientsPage from './pages/ClientsPage';
import AssociatesPage from './pages/AssociatesPage';
import ProjectPage from './pages/ProjectPage';
import TasksPage from './pages/TasksPage';
import NotificationsPage from './pages/NotificationsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

// Placeholder for Client ID - In production use ENV
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="flex bg-black min-h-screen text-white">
      {/* 1. SIDEBAR: Always stays on the left */}
      <Sidebar />

      {/* 2. CONTENT AREA: Changes based on the URL */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  const { config } = useAgencyConfig();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dev-login" element={<DevLoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* Verticals - Dynamic Routing */}
      {config?.verticals?.map(vertical => (
        <Route
          key={vertical.id}
          path={`/${vertical.id}`}
          element={
            <ProtectedRoute>
              <VerticalPage
                vertical={vertical.id}
                title={vertical.label}
              />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Operations (Placeholders for now) */}
      <Route path="/tasks" element={
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/finance" element={
        <ProtectedRoute>
          <div className="p-10">Finance & Quotations</div>
        </ProtectedRoute>
      } />

      {/* Management (Placeholders for now) */}
      <Route path="/clients" element={
        <ProtectedRoute>
          <ClientsPage />
        </ProtectedRoute>
      } />
      <Route path="/associates" element={
        <ProtectedRoute>
          <AssociatesPage />
        </ProtectedRoute>
      } />

      {/* Project Details */}
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <ProjectPage />
        </ProtectedRoute>
      } />

      {/* Settings */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AgencyConfigProvider>
          <Toaster theme="dark" position="bottom-right" richColors />
          <AppRoutes />
        </AgencyConfigProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;