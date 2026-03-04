'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { signOut as authSignOut } from '../lib/auth.service';
import { canEditKey as checkCanEditKey, CMSRole } from '../lib/cmsPermissions';

import { isGateConfigured } from '../components/PasswordGate';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: CMSRole | null;
  updated_at: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  role: CMSRole | null;
  isAdmin: boolean;
  canEditKey: (key: string) => boolean;
  canEditAny: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  role: null,
  isAdmin: false,
  canEditKey: () => false,
  canEditAny: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  const fetchProfile = useMemo(
    () => async (userId: string): Promise<{ profile: Profile | null; error: string | null }> => {
      if (!supabase) return { profile: null, error: null };
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, updated_at')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('[Auth] Profile fetch failed:', error.message, error.code);
        return { profile: null, error: error.message };
      }
      return { profile: data as Profile, error: null };
    },
    []
  );

  useEffect(() => {
    const checkUser = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) {
          setUser(null);
          setProfile(null);
          setProfileError(null);
          lastUserId.current = null;
        } else {
          setUser(currentUser);
          lastUserId.current = currentUser.id;
          const { profile: p, error: profileErr } = await fetchProfile(currentUser.id);
          setProfile(p);
          setProfileError(profileErr ?? null);
        }
      } catch {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        lastUserId.current = null;
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const newUser = session?.user ?? null;
          const newUserId = newUser?.id ?? null;
          setUser(newUser);
          if (newUser) {
            const { profile: p, error: profileErr } = await fetchProfile(newUser.id);
            setProfile(p);
            setProfileError(profileErr ?? null);
          } else {
            setProfile(null);
            setProfileError(null);
          }
          setLoading(false);
          if (newUserId !== lastUserId.current) {
            lastUserId.current = newUserId;
            window.dispatchEvent(new Event('ift_auth_change'));
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [fetchProfile]);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
    setProfileError(null);
    lastUserId.current = null;
    window.dispatchEvent(new Event('ift_auth_change'));
    // Navigation to /login is handled by the calling component (Navbar, Dashboard, etc.)
  };

  const role = (profile?.role as CMSRole) ?? null;
  const gateUserHasEdit = isGateConfigured() && !!user;
  const effectiveRole: CMSRole | null = gateUserHasEdit ? 'admin' : role;
  const isAdmin = effectiveRole === 'admin';
  const canEditAny = gateUserHasEdit || role === 'admin' || role === 'staff' || role === 'students';
  const canEditKeyFn = useMemo(() => (key: string) => checkCanEditKey(key, effectiveRole), [effectiveRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
        role,
        isAdmin,
        canEditKey: canEditKeyFn,
        canEditAny,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
