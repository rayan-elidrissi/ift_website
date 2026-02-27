import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedProjects } from './components/FeaturedProjects';
import { LatestEvents } from './components/LatestEvents';
import { About } from './components/About';
import { Research } from './components/Research';
import { Education } from './components/Education';
import { Events } from './components/Events';
import { Arts } from './components/Arts';
import { Collaborate } from './components/Collaborate';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { CMSWrapper } from './components/cms/CMSWrapper';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  return (
    <Router>
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
                  <LatestEvents />
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
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CMSWrapper>
    </Router>
  );
}

export default App;