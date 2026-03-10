import React, { useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CMSWrapper } from './components/cms/CMSWrapper';
import { PasswordGate, isGateConfigured } from './components/PasswordGate';
import { ProtectedRoute } from './components/ProtectedRoute';

const Hero = lazy(() => import('./components/Hero').then(m => ({ default: m.Hero })));
const FeaturedProjects = lazy(() => import('./components/FeaturedProjects').then(m => ({ default: m.FeaturedProjects })));
const ComingSoon = lazy(() => import('./components/ComingSoon').then(m => ({ default: m.ComingSoon })));
const About = lazy(() => import('./components/About').then(m => ({ default: m.About })));
const Research = lazy(() => import('./components/Research').then(m => ({ default: m.Research })));
const Education = lazy(() => import('./components/Education').then(m => ({ default: m.Education })));
const Events = lazy(() => import('./components/Events').then(m => ({ default: m.Events })));
const Arts = lazy(() => import('./components/Arts').then(m => ({ default: m.Arts })));
const Collaborate = lazy(() => import('./components/Collaborate').then(m => ({ default: m.Collaborate })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const AuthCallback = lazy(() => import('./components/AuthCallback').then(m => ({ default: m.AuthCallback })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Migrate = lazy(() => import('./components/Migrate').then(m => ({ default: m.Migrate })));

const PageFallback = () => <div className="min-h-[50vh] flex items-center justify-center" aria-label="Loading" />;

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
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
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
      <Toaster richColors position="bottom-left" />
    </Router>
  );
}

export default App;