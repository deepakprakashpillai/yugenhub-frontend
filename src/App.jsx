import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgencyConfigProvider, useAgencyConfig } from './context/AgencyConfigContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useIsMobile } from './hooks/useMediaQuery';
import { Toaster } from 'sonner';
const Login = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DevLoginPage = lazy(() => import('./pages/DevLoginPage'));
const VerticalPage = lazy(() => import('./pages/VerticalPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const AssociatesPage = lazy(() => import('./pages/AssociatesPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';

import BottomNav from './components/BottomNav';

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
      className={`flex flex-col md:flex-row h-[100dvh] w-full`}
      style={{ backgroundColor: getBgColor() }}
    >
      {/* Mobile Header Skeleton */}
      <div className={`md:hidden flex items-center justify-between h-[72px] px-4 border-b ${theme.canvas.sidebar} ${theme.canvas.border}`}>
        <Skeleton className="h-7 w-7" />
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
    <div className={`flex min-h-[100dvh] ${theme.canvas.bg} ${theme.text.primary}`}>
      <CommandPalette />

      {/* SIDEBAR: Desktop = inline, Mobile = overlay drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* CONTENT AREA */}
      <main id="main-scroll-container" className="flex-1 h-[100dvh] overflow-y-auto flex flex-col scroll-smooth md:pb-0 pb-20">
        {/* Mobile Header - only renders on mobile */}
        <MobileHeader />
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
};

function AppRoutes() {
  const { config } = useAgencyConfig();

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        {import.meta.env.DEV && (
          <Route path="/dev-login" element={<DevLoginPage />} />
        )}

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

        {/* Operations */}
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

        {/* Management */}
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
    </Suspense>
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