import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

type CMSContextType = {
  isEditing: boolean;
  toggleEditMode: () => void;
  getContent: (key: string, defaultContent: any) => any;
  updateContent: (key: string, newContent: any) => void;
  canEdit: boolean;
  canEditKey: (key: string) => boolean;
  isLoading: boolean;
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};

function loadFromLocalStorage(): Record<string, any> {
  const savedData = localStorage.getItem('ift_cms_data');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Failed to parse CMS data', e);
    }
  }
  return {};
}

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const { canEditAny, canEditKey } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // canEdit: any user with a role can enter edit mode
  const canEdit = canEditAny;

  // Load data from Supabase or localStorage
  const loadData = React.useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('cms_content')
          .select('key, value');

        if (error) {
          console.error('Failed to load CMS data:', error);
          setData(loadFromLocalStorage());
        } else if (rows && rows.length > 0) {
          const merged: Record<string, any> = {};
          for (const row of rows) {
            merged[row.key] = row.value;
          }
          setData(merged);
        } else {
          setData({});
        }
      } catch (e) {
        console.error('CMS load error:', e);
        setData(loadFromLocalStorage());
      }
    } else {
      setData(loadFromLocalStorage());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for auth changes (Supabase only)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadData());
    return () => subscription.unsubscribe();
  }, [loadData]);

  const toggleEditMode = () => {
    if (canEdit) {
      setIsEditing((prev) => !prev);
    }
  };

  // Reset edit mode when user loses admin access
  useEffect(() => {
    if (!canEdit) setIsEditing(false);
  }, [canEdit]);

  const getContent = (key: string, defaultContent: any) => {
    return data[key] !== undefined ? data[key] : defaultContent;
  };

  const updateContent = async (key: string, newContent: any) => {
    if (!canEditKey(key)) {
      toast.error(`You don't have permission to edit "${key}"`);
      return;
    }
    setData((prev) => ({ ...prev, [key]: newContent }));

    if (isSupabaseConfigured() && supabase) {
      // Diagnostic en dev : si save échoue, vérifier hasSession, role (profiles.role) et URL Supabase
      if (import.meta.env.DEV) {
        const { data: { session } } = await supabase.auth.getSession();
        const url = import.meta.env.VITE_SUPABASE_URL ?? '';
        console.debug('[CMS] Save attempt:', {
          key,
          hasSession: !!session,
          userId: session?.user?.id?.slice(0, 8),
          supabaseProject: url ? new URL(url).hostname : 'not set',
        });
      }
      try {
        const { error } = await supabase
          .from('cms_content')
          .upsert(
            {
              key,
              value: newContent,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );

        if (error) {
          console.error('[CMS] Save failed:', error.message, { code: error.code, details: error.details });
          setData((prev) => {
            localStorage.setItem('ift_cms_data', JSON.stringify({ ...prev, [key]: newContent }));
            return prev;
          });
          toast.error(`Could not save to cloud: ${error.message}`);
        } else {
          toast.success('Saved to cloud');
        }
      } catch (e) {
        console.error('[CMS] Save error:', e);
        setData((prev) => {
          localStorage.setItem('ift_cms_data', JSON.stringify({ ...prev, [key]: newContent }));
          return prev;
        });
        toast.error('Could not save to cloud. Changes saved locally.');
      }
    } else {
      setData((prev) => {
        const merged = { ...prev, [key]: newContent };
        localStorage.setItem('ift_cms_data', JSON.stringify(merged));
        return merged;
      });
    }
  };

  return (
    <CMSContext.Provider value={{ isEditing, toggleEditMode, getContent, updateContent, canEdit, canEditKey, isLoading }}>
      {children}
    </CMSContext.Provider>
  );
};
