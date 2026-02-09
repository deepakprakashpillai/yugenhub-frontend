import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import DevLoginPage from './pages/DevLoginPage';
import VerticalPage from './pages/VerticalPage';
import ClientsPage from './pages/ClientsPage';
import AssociatesPage from './pages/AssociatesPage';
import ProjectPage from './pages/ProjectPage';
import TasksPage from './pages/TasksPage';
import NotificationsPage from './pages/NotificationsPage';
import CalendarPage from './pages/CalendarPage';

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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dev-login" element={<DevLoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <div className="p-10">Dashboard</div>
        </ProtectedRoute>
      } />

      {/* Verticals */}
      <Route path="/knots" element={
        <ProtectedRoute>
          <VerticalPage vertical="knots" title="Knots (Weddings)" />
        </ProtectedRoute>
      } />
      <Route path="/pluto" element={
        <ProtectedRoute>
          <VerticalPage vertical="pluto" title="Pluto (Kids)" />
        </ProtectedRoute>
      } />
      <Route path="/festia" element={
        <ProtectedRoute>
          <VerticalPage vertical="festia" title="Festia (Events)" />
        </ProtectedRoute>
      } />
      <Route path="/thryv" element={
        <ProtectedRoute>
          <VerticalPage vertical="thryv" title="Thryv (Marketing)" />
        </ProtectedRoute>
      } />

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
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Toaster theme="dark" position="bottom-right" richColors />
        <AppRoutes />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;