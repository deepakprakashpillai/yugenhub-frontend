import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgencyConfigProvider, useAgencyConfig } from './context/AgencyConfigContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useIsMobile } from './hooks/useMediaQuery';
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
import FinancePage from './pages/FinancePage';

import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to get hex background based on current theme mode
  const getBgColor = () => {
    // These must match theme.js values
    if (theme.mode === 'light') return '#fdf4ff';
    return '#000000';
  };

  if (loading) return (
    <div
      className={`flex flex-col md:flex-row h-screen w-full`}
      style={{ backgroundColor: getBgColor() }}
    >
      {/* Mobile Header Skeleton */}
      <div className={`md:hidden flex items-center justify-between h-14 px-4 border-b ${theme.canvas.sidebar} ${theme.canvas.border}`}>
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      {/* Sidebar Skeleton */}
      <div className={`w-64 border-r ${theme.canvas.sidebar} ${theme.canvas.border} p-6 space-y-8 hidden md:block`}>
        <div className={`h-8 w-32 ${theme.canvas.card} rounded-lg animate-pulse`} />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 md:h-10 w-36 md:w-48" />
          <Skeleton className="h-8 md:h-10 w-24 md:w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Skeleton className="h-24 md:h-32 md:col-span-2" />
          <Skeleton className="h-24 md:h-32" />
        </div>
        <Skeleton className="h-48 md:h-64 w-full" />
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className={`flex min-h-screen ${theme.canvas.bg} ${theme.text.primary}`}>
      <CommandPalette />

      {/* SIDEBAR: Desktop = inline, Mobile = overlay drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col">
        {/* Mobile Header - only renders on mobile */}
        <MobileHeader onMenuToggle={() => setSidebarOpen(true)} />
        <div className="flex-1">
          {children}
        </div>
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
          <FinancePage />
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

function ToasterWrapper() {
  const isMobile = useIsMobile();
  return <Toaster theme="system" position={isMobile ? "top-center" : "bottom-right"} richColors closeButton />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AgencyConfigProvider>
          <ThemeProvider>
            <ToasterWrapper />
            <AppRoutes />
          </ThemeProvider>
        </AgencyConfigProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;