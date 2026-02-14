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

import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen w-full bg-black">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 p-6 space-y-8 hidden md:block">
        <div className="h-8 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 col-span-2" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="flex bg-black min-h-screen text-white">
      <CommandPalette />
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AgencyConfigProvider>
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
          <AppRoutes />
        </AgencyConfigProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;