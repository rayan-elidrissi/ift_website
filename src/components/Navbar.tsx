import React, { useState } from "react";
import { LogIn, LogOut, Menu, X, LayoutDashboard, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { isGateConfigured } from "./PasswordGate";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const gateConfigured = isGateConfigured();

  const handleLogout = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate(gateConfigured ? '/' : '/login');
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
          <div className="hidden lg:flex items-center space-x-6 ml-12 flex-shrink-0 relative z-[60]">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    to="/dashboard"
                    className="text-neutral-400 hover:text-teal-600 transition-colors p-2 cursor-pointer rounded inline-flex items-center justify-center"
                    title="Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                {gateConfigured ? (
                  <button
                    onClick={handleLogout}
                    className="text-neutral-400 hover:text-teal-600 transition-colors p-2 cursor-pointer rounded inline-flex items-center justify-center"
                    title="Verrouiller le site (revoir la porte mot de passe)"
                  >
                    <Lock className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 cursor-pointer rounded"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-neutral-400 hover:text-teal-600 transition-colors p-2 cursor-pointer rounded inline-flex items-center justify-center"
                title="Log In"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden z-[60] ml-auto">
            <button
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
              className="text-neutral-900 hover:text-teal-600 transition-colors p-3 cursor-pointer -m-3 touch-manipulation"
              title={isMobileMenuOpen ? "Close menu" : "Open menu"}
              type="button"
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
            className="fixed inset-0 bg-white z-[55] flex flex-col justify-center items-center"
          >
            <div className="space-y-8 text-center pointer-events-auto">
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
                <>
                  {isAdmin && (
                    <Link
                      to="/dashboard"
                      className="flex items-center justify-center gap-3 text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors py-4"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-8 h-8" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 w-full text-center text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors py-4 cursor-pointer"
                  >
                    {gateConfigured ? (
                      <>
                        <Lock className="w-8 h-8" />
                        <span>Verrouiller</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-8 h-8" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  className="flex items-center justify-center gap-3 text-3xl font-serif text-neutral-400 hover:text-teal-600 transition-colors py-4 cursor-pointer w-full"
                >
                  <LogIn className="w-8 h-8" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};