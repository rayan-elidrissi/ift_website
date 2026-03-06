import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedProjects } from './components/FeaturedProjects';
import { ComingSoon } from './components/ComingSoon';
import { About } from './components/About';
import { Research } from './components/Research';
import { Education } from './components/Education';
import { Events } from './components/Events';
import { Arts } from './components/Arts';
import { Collaborate } from './components/Collaborate';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { Dashboard } from './components/Dashboard';
import { Migrate } from './components/Migrate';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Footer } from './components/Footer';
import { CMSWrapper } from './components/cms/CMSWrapper';
import { PasswordGate, isGateConfigured } from './components/PasswordGate';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const AppContent = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const authRoute = pathname === '/login' || pathname.startsWith('/auth/');
  const gateActive = isGateConfigured() && !user && !authRoute;

  if (import.meta.env.DEV) {
    console.debug('[Gate] configured:', isGateConfigured(), 'user:', !!user, '→ gate active:', gateActive);
  }

  if (gateActive) {
    return <PasswordGate />;
  }

  return (
    <CMSWrapper>
      <ScrollToTop />
      <div className="bg-white min-h-screen text-neutral-900 font-sans selection:bg-teal-200 selection:text-teal-900 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16">
          <Routes>
              <Route path="/" element={
                <>
                  <Hero />
                  <FeaturedProjects />
                  <ComingSoon />
                </>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/research" element={<Research />} />
              <Route path="/education" element={<Education />} />
              <Route path="/events" element={<Events />} />
              <Route path="/arts" element={<Arts />} />
              <Route path="/collaborate" element={<Collaborate />} />
              {/* Redirect old contact route to collaborate */}
              <Route path="/contact" element={<Navigate to="/collaborate" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/migrate" element={
                <ProtectedRoute requireAdmin>
                  <Migrate />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </CMSWrapper>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster richColors position="bottom-right" />
    </Router>
  );
}

export default App;