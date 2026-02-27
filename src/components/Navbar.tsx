import React, { useState, useEffect } from "react";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        return;
      }
      setIsLoggedIn(!!localStorage.getItem("ift_auth"));
    };

    checkAuth();

    window.addEventListener("ift_auth_change", checkAuth);
    window.addEventListener("storage", checkAuth);

    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
      return () => {
        subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener("ift_auth_change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("ift_auth");
    localStorage.removeItem("ift_role");
    window.dispatchEvent(new Event("ift_auth_change"));
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Research", href: "/research" },
    { name: "Education", href: "/education" },
    { name: "Arts", href: "/arts" },
    { name: "Collaborate", href: "/collaborate" },
    { name: "Events", href: "/events" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/90 backdrop-blur-md py-4 border-b border-neutral-200"
    >
      <div className="w-full px-4">
        <div className="flex items-center">
          {/* Logo - aligned with hero video (same padding as Hero p-4) */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer z-50 -translate-y-2"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <svg
              className="w-8 h-8 text-neutral-900 fill-current"
              viewBox="0 0 32 33"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.0811 8.4182L5.83462 0.190918H2.99992L9.67261 13.1182C10.5858 12.4441 10.9873 10.1747 10.0811 8.4182Z"
                fill="#007F7F"
              ></path>
              <path
                d="M15.718 2.23543L13.1494 7.23357C13.1494 7.23357 10.7002 3.40679 11.9444 1.22143C12.9961 -0.412105 14.5318 0.34164 14.7541 0.518363C14.9764 0.694577 15.652 1.06534 15.718 2.23543Z"
                fill="#007F7F"
              ></path>
              <path d="M4.56792 32.1182H0.919922V16.5902H4.56792V32.1182Z"></path>
              <path d="M18.2125 19.4222H12.3325V22.7822H17.9245V25.5662H12.3325V32.1182H8.68448V16.5902H18.2125V19.4222Z"></path>
              <path d="M31.774 19.4222H27.67V32.1182H23.998V19.4222H19.894V16.5902H31.774V19.4222Z"></path>
            </svg>
            {/* <span className="font-mono text-[10px] md:text-xs text-neutral-900 tracking-widest uppercase whitespace-nowrap">Institute for Future Technologies</span> */}
          </Link>

          {/* Desktop Navigation - Minimalist Style */}
          <div className="hidden lg:flex items-center space-x-12 ml-auto">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-xs font-sans uppercase tracking-[0.15em] transition-all duration-300 relative group ${
                  location.pathname === link.href
                    ? "text-teal-600"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-2 left-0 w-0 h-px bg-teal-600 transition-all duration-300 group-hover:w-full ${location.pathname === link.href ? "w-full" : ""}`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center space-x-6 ml-12">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                title="Log In"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden z-50 ml-auto">
            <button
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
              className="text-neutral-900 hover:text-teal-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-40 flex flex-col justify-center items-center"
          >
            <div className="space-y-8 text-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full text-center text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors"
                >
                  <LogOut className="w-8 h-8" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-3 text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="w-8 h-8" />
                  <span>Log In</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};