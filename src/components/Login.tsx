import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const timeout = new Promise<{ data: { user: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { user: null } }), 5000)
          );
          const { data: { user } } = await Promise.race([supabase.auth.getUser(), timeout]);
          if (user) navigate('/dashboard');
        } catch {
          // Ignore - show login form
        }
        return;
      }
      if (localStorage.getItem('ift_auth')) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSupabaseConfigured() && supabase) {
      try {
        if (isSignUp) {
          const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
          if (err) throw err;
          setError('');
          setLoading(false);
          setError('Check your email to confirm your account, then sign in.');
          setIsSignUp(false);
          return;
        }
        // Clear any stale session that could block sign-in (fixes intermittent freezes)
        await supabase.auth.signOut();

        // Timeout to avoid infinite "Authenticating..."
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout. In Supabase: Authentication → URL Configuration, set Site URL to https://ift-website-zeta.vercel.app and add it to Redirect URLs.')), 8000)
        );
        const signIn = supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        const { error: err } = await Promise.race([signIn, timeout]);
        if (err) throw err;
        window.dispatchEvent(new Event('ift_auth_change'));
        navigate('/dashboard');
      } catch (err: any) {
        setError(err?.message || 'Invalid credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mock login (no Supabase)
    setTimeout(() => {
      let role = '';
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === 'reid.elidrissi@gmail.com') role = 'admin';

      if (role && password) {
        localStorage.setItem('ift_auth', 'true');
        localStorage.setItem('ift_role', role);
        window.dispatchEvent(new Event('ift_auth_change'));
        setLoading(false);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 shadow-2xl border border-neutral-200"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-neutral-900 mb-2">IFT Portal</h1>
            <p className="text-sm text-neutral-500 font-sans">
              {isSupabaseConfigured() ? 'Sign in to edit content' : 'Restricted Access'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="name@ift.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white py-4 uppercase text-xs font-bold tracking-widest hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {isSupabaseConfigured() && (
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="w-full text-xs text-neutral-500 hover:text-teal-600"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
};
