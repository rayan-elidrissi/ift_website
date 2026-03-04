/**
 * OAuth / email confirmation callback.
 * Supabase redirects here after sign-in; detectSessionInUrl processes the hash.
 * Redirects to ?next= or /dashboard for admins, / for others.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SAFE_PATHS = ['/', '/about', '/research', '/education', '/events', '/arts', '/collaborate', '/contact', '/login', '/dashboard'];

function isSafeRedirect(path: string | null): path is string {
  if (!path || !path.startsWith('/')) return false;
  const withoutQuery = path.split('?')[0];
  return SAFE_PATHS.some((p) => withoutQuery === p || withoutQuery.startsWith(p + '/'));
}

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, role } = useAuth();
  const [processed, setProcessed] = useState(false);

  const next = searchParams.get('next');

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      navigate('/', { replace: true });
      return;
    }

    // Let Supabase process session from URL hash (OAuth) or storage
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setProcessed(true);
        window.dispatchEvent(new Event('ift_auth_change'));
      }
    };
    check();
  }, [navigate]);

  // Once we have user (or confirmed no session after loading), redirect
  useEffect(() => {
    if (loading) return;
    if (processed || user) {
      const target = isSafeRedirect(next) ? next : (role === 'admin' ? '/dashboard' : '/');
      navigate(target, { replace: true });
      return;
    }
    // No session after loading - redirect to login with optional next
    const to = next ? `/login?redirect=${encodeURIComponent(next)}` : '/login';
    navigate(to, { replace: true });
  }, [loading, user, processed, role, next, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <p className="text-sm text-neutral-500 font-mono">Signing you in...</p>
    </div>
  );
};
