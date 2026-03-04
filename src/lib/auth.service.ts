/**
 * Auth service – centralizes Supabase Auth operations.
 * Pattern from Next.js project: signUp, signIn, signOut, signInWithGoogle.
 */

import { supabase, isSupabaseConfigured } from './supabase';

const AUTH_TIMEOUT_MS = 15000;

/** Build redirect URL for email confirmation / OAuth callback */
function getRedirectUrl(next?: string): string {
  if (typeof window === 'undefined') return '';
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';
  const path = (next && next.startsWith('/') ? next : '/auth/callback').replace(/^\/+/, '');
  return new URL(`${base}/${path}`.replace(/\/+/g, '/'), window.location.origin).href;
}

export type SignUpResult = { success: true; message: string } | { success: false; error: string };
export type SignInResult = { success: true } | { success: false; error: string };

/**
 * Sign up with email/password.
 * Sends confirmation email; redirects to next or /auth/callback after verification.
 */
export async function signUp(
  email: string,
  password: string,
  options?: { redirectTo?: string }
): Promise<SignUpResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Auth not configured' };
  }
  try {
    const emailRedirectTo = options?.redirectTo
      ? getRedirectUrl(options.redirectTo)
      : getRedirectUrl('/auth/callback');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo },
    });
    if (error) return { success: false, error: error.message };
    return {
      success: true,
      message: 'Check your email to confirm your account, then sign in.',
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Sign in with email/password.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Auth not configured' };
  }
  try {
    const signInPromise = supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    const timeoutPromise = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('Sign-in took too long. Try again or check your network.')), AUTH_TIMEOUT_MS)
    );
    const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
    if (error) return { success: false, error: error.message };
    if (!data?.session) {
      return { success: false, error: 'Session not received. Check if email confirmation is required.' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google, then to redirectTo (or /auth/callback) on success.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<SignInResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Auth not configured' };
  }
  try {
    const callbackUrl = getRedirectUrl(redirectTo || '/auth/callback');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: redirectTo ? { next: redirectTo } : undefined,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Sign out.
 */
export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
