import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
import { supabase, isSupabaseConfigured, testRestConnection } from '../lib/supabase';
import { signUp, signIn, signInWithGoogle } from '../lib/auth.service';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [restOk, setRestOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? undefined;
  const { user, role, profileError, loading: authLoading, signOut } = useAuth();

  const testConnection = React.useCallback((): (() => void) | void => {
    if (!isSupabaseConfigured() || !supabase) return;
    setConnectionError(null);
    setRestOk(null);
    let cancelled = false;

    let authTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const runAuthTest = (restWasOk: boolean) => {
      if (cancelled) return;
      authTimeoutId = setTimeout(() => {
        if (cancelled) return;
        const realError = 'Auth connection timeout (15s).';
        console.warn('[Auth] Connection test — timeout:', realError);
        setConnectionError(restWasOk
          ? `${realError} REST API OK — auth endpoint unreachable. Check Supabase Auth config / Site URL.`
          : `${realError} Check network and .env.`);
      }, 15000);
      supabase.auth.getSession().then(({ error }) => {
        if (cancelled) return;
        if (authTimeoutId) clearTimeout(authTimeoutId);
        if (error) {
          const errMsg = error.message;
          console.warn('[Auth] getSession error:', errMsg);
          setConnectionError(restWasOk
            ? `Auth error: ${errMsg} (REST OK — auth-specific issue)`
            : `Auth: ${errMsg}`);
        } else {
          setConnectionError(null);
          setRestOk(true);
        }
      }).catch((err) => {
        if (cancelled) return;
        if (authTimeoutId) clearTimeout(authTimeoutId);
        const errMsg = err?.message || 'Network or CORS error';
        console.warn('[Auth] getSession catch:', errMsg);
        setConnectionError(restWasOk
          ? `${errMsg} (REST OK — auth endpoint may be blocked)`
          : `${errMsg}. Check Network tab (F12).`);
      });
    };

    // 1. REST first (fast) — 2–5s feedback instead of 15s
    (async () => {
      const rest = await testRestConnection();
      if (cancelled) return;
      setRestOk(rest.ok);
      if (!rest.ok) {
        setConnectionError(`REST API failed: ${rest.error || 'unknown'}. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`);
        return;
      }
      runAuthTest(true);
    })();

    return () => {
      cancelled = true;
      if (authTimeoutId) clearTimeout(authTimeoutId);
    };
  }, []);

  useEffect(() => {
    const cleanup = testConnection();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [testConnection]);

  // Redirect only once auth state and profile are loaded (avoids race condition)
  // If redirect param present and safe, go there; else dashboard for admin, / for others
  useEffect(() => {
    if (authLoading || !user) return;
    if (profileError) return; // Don't redirect when profile failed to load
    const safePaths = ['/', '/about', '/research', '/education', '/events', '/arts', '/collaborate', '/contact', '/dashboard'];
    const target = redirectTo && redirectTo.startsWith('/') && safePaths.some((p) => redirectTo === p || redirectTo.startsWith(p + '/'))
      ? redirectTo
      : role === 'admin'
        ? '/dashboard'
        : '/';
    navigate(target, { replace: true });
  }, [user, role, profileError, authLoading, navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const result = await signUp(email, password, {
          redirectTo: redirectTo || '/auth/callback',
        });
        if (!result.success) throw new Error(result.error);
        setError(result.message);
        setIsSignUp(false);
        return;
      }
      const result = await signIn(email, password);
      if (!result.success) throw new Error(result.error);
      // AuthContext will update; useEffect handles redirect when profile is loaded
      window.dispatchEvent(new Event('ift_auth_change'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    setError('');
    const result = await signInWithGoogle(redirectTo || '/auth/callback');
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
    // Success: browser redirects to Google, then to callback
  };

  // Show error when profile failed to load (RLS, missing column, etc.)
  if (user && !authLoading && profileError) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-6">
        <div className="w-full max-w-md bg-white p-8 shadow-lg border border-neutral-200">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h2 className="font-semibold">Could not load your profile</h2>
          </div>
          <p className="text-sm text-neutral-600 mb-6">
            {profileError} Please try signing out and back in, or contact your administrator.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full bg-neutral-900 text-white py-3 uppercase text-xs font-bold tracking-widest hover:bg-teal-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </section>
    );
  }

  // Show redirecting state when logged in and waiting for useEffect to navigate
  if (user && !authLoading) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-6">
        <p className="text-sm text-neutral-500 font-mono">Redirecting...</p>
      </section>
    );
  }

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
            <p className="text-sm text-neutral-500 font-sans">Sign in to edit content</p>
          </div>

          {!isSupabaseConfigured() ? (
            <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">CMS not configured</p>
              <p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.</p>
            </div>
          ) : (
          <>
          {connectionError && (
            <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 mb-6">
              <p className="font-medium mb-1">Connection issue</p>
              {restOk !== null && (
                <p className="text-xs font-mono mb-2">
                  Diagnostic: REST {restOk ? 'OK' : 'KO'} / Auth KO
                </p>
              )}
              <p className="mb-3">{connectionError}</p>
              <p className="text-xs mb-3">Check Supabase Dashboard → Auth → URL Configuration (Site URL, Redirect URLs).</p>
              <button
                type="button"
                onClick={() => testConnection()}
                className="text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-900 underline"
              >
                Retry connection
              </button>
            </div>
          )}
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

            {!isSignUp && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-500">or</span>
                </div>
              </div>
            )}

            {!isSignUp && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                <span className="text-sm font-medium">Continue with Google</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="w-full text-xs text-neutral-500 hover:text-teal-600"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
          </>
          )}
        </motion.div>
      </div>
    </section>
  );
};
