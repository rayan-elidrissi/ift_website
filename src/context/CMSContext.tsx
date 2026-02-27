import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type CMSContextType = {
  isEditing: boolean;
  toggleEditMode: () => void;
  getContent: (key: string, defaultContent: any) => any;
  updateContent: (key: string, newContent: any) => void;
  canEdit: boolean;
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
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

        // Auth: Supabase user = can edit
        const { data: { user } } = await supabase.auth.getUser();
        setCanEdit(!!user);
        if (!user) setIsEditing(false);
      } catch (e) {
        console.error('CMS load error:', e);
        setData(loadFromLocalStorage());
        setCanEdit(false);
      }
    } else {
      setData(loadFromLocalStorage());
      const role = localStorage.getItem('ift_role');
      const auth = localStorage.getItem('ift_auth');
      const canEditVal = !!(auth && (role === 'director' || role === 'admin' || role === 'staff'));
      setCanEdit(canEditVal);
      if (!canEditVal) setIsEditing(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for auth changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      const handleAuthChange = () => loadData();
      window.addEventListener('ift_auth_change', handleAuthChange);
      window.addEventListener('storage', handleAuthChange);
      return () => {
        window.removeEventListener('ift_auth_change', handleAuthChange);
        window.removeEventListener('storage', handleAuthChange);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  const toggleEditMode = () => {
    if (canEdit) {
      setIsEditing(!isEditing);
    }
  };

  const getContent = (key: string, defaultContent: any) => {
    return data[key] !== undefined ? data[key] : defaultContent;
  };

  const updateContent = async (key: string, newContent: any) => {
    const newData = { ...data, [key]: newContent };
    setData(newData);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('cms_content')
          .upsert({
            key,
            value: newContent,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        if (error) {
          console.error('Failed to save CMS data:', error);
          localStorage.setItem('ift_cms_data', JSON.stringify(newData));
        }
      } catch (e) {
        console.error('CMS save error:', e);
        localStorage.setItem('ift_cms_data', JSON.stringify(newData));
      }
    } else {
      localStorage.setItem('ift_cms_data', JSON.stringify(newData));
    }
  };

  return (
    <CMSContext.Provider value={{ isEditing, toggleEditMode, getContent, updateContent, canEdit, isLoading }}>
      {children}
    </CMSContext.Provider>
  );
};
