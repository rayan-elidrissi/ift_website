'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { signOut as authSignOut } from '../lib/auth.service';
import { getAuthUser, apiLogout, isApiConfigured } from '../lib/api';
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
  user: { id: string } | null;
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
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // 1. If API configured, try to get user from backend (OAuth JWT)
      if (isApiConfigured()) {
        const apiUser = await getAuthUser();
        if (apiUser) {
          setUser({ id: apiUser.user_id });
          setProfile({
            id: apiUser.user_id,
            email: apiUser.email ?? null,
            full_name: apiUser.username ?? null,
            avatar_url: null,
            role: apiUser.is_admin ? 'admin' : 'staff',
            updated_at: null,
          });
          setProfileError(null);
          setLoading(false);
          return;
        }
      }
      // 2. Fallback: password gate (local)
      const hasLocalAdmin = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ift_local_admin') === '1';
      if (hasLocalAdmin && isGateConfigured()) {
        setUser({ id: 'local-admin' });
        setProfile({
          id: 'local-admin',
          email: import.meta.env.VITE_ADMIN_EMAIL ?? null,
          full_name: null,
          avatar_url: null,
          role: 'admin',
          updated_at: null,
        });
        setProfileError(null);
      } else {
        setUser(null);
        setProfile(null);
        setProfileError(null);
      }
      setLoading(false);
    };

    checkSession();

    const handler = () => checkSession();
    window.addEventListener('ift_auth_change', handler);
    return () => window.removeEventListener('ift_auth_change', handler);
  }, []);

  const signOut = async () => {
    if (isApiConfigured()) {
      await apiLogout();
    }
    await authSignOut();
    setUser(null);
    setProfile(null);
    setProfileError(null);
    window.dispatchEvent(new Event('ift_auth_change'));
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
