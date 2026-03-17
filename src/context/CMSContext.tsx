import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as api from '../lib/api';
import { PAGE_SLUGS, getSlugForKey, SLUG_TO_KEYS } from '../lib/resourceMapping';

const LEGACY_BLOCK_TYPE = 'legacy_cms';
const CMS_CACHE_KEY = 'ift_cms_cache';

type ResourceVersion = 'Draft' | 'Published';

type CMSContextType = {
  isEditing: boolean;
  toggleEditMode: () => void;
  getContent: (key: string, defaultContent: any) => any;
  updateContent: (key: string, newContent: any) => void;
  /** Resource API: fetch by slug (when VITE_API_URL is set) */
  getResource: (slug: string, version?: ResourceVersion) => Promise<api.ResourceOut | null>;
  /** Resource API: save Draft (PUT) */
  saveChanges: (slug: string, data: api.ResourceIn) => Promise<boolean>;
  /** Resource API: mark for publication (PATCH) */
  sendForReview: (slug: string) => Promise<boolean>;
  /** Resource API: publish (GET /publish_resources) */
  publish: (slug: string) => Promise<boolean>;
  canEdit: boolean;
  canEditKey: (key: string) => boolean;
  isLoading: boolean;
  isApiConfigured: boolean;
  hasCache: boolean;
  /** Force re-fetch CMS data from API */
  reloadData: () => Promise<void>;
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const { canEditAny, canEditKey } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<Record<string, any>>(() => {
    try {
      const cached = sessionStorage.getItem(CMS_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasCache = Object.keys(data).length > 0;

  const canEdit = canEditAny;

  const loadData = React.useCallback(async () => {
    if (!api.isApiConfigured()) {
      setData({});
      setIsLoading(false);
      return;
    }
    const results = await Promise.allSettled(
      PAGE_SLUGS.map(async (slug) => {
        const resource =
          (await api.getResourceOptional(slug, 'Draft') ?? await api.getResourceOptional(slug, 'Published'));
        return resource;
      })
    );
    const merged: Record<string, any> = {};
    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value?.content) continue;
      for (const block of result.value.content as any[]) {
        if (block?.type === LEGACY_BLOCK_TYPE && block.data) {
          Object.assign(merged, block.data);
          break;
        }
      }
    }
    setData(merged);
    setIsLoading(false);
    try { sessionStorage.setItem(CMS_CACHE_KEY, JSON.stringify(merged)); } catch { /* quota */ }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('ift_auth_change', handler);
    return () => window.removeEventListener('ift_auth_change', handler);
  }, [loadData]);

  const toggleEditMode = () => {
    if (canEdit) {
      setIsEditing((prev) => !prev);
    }
  };

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

    if (!api.isApiConfigured()) {
      toast.error('API not configured. Set VITE_API_URL.');
      return;
    }
    const slug = getSlugForKey(key);
    if (!slug) {
      toast.error(`No resource mapping for "${key}"`);
      return;
    }
    try {
      const resource = await api.getResource(slug, 'Draft') ?? await api.getResource(slug, 'Published');
      if (!resource) {
        toast.error('Resource not found. Run migration from /migrate');
        loadData();
        return;
      }
      const content = Array.isArray(resource.content) ? [...resource.content] : [];
      let found = false;
      for (let i = 0; i < content.length; i++) {
        const b = content[i] as any;
        if (b?.type === LEGACY_BLOCK_TYPE) {
          content[i] = { ...b, data: { ...(b.data || {}), [key]: newContent } };
          found = true;
          break;
        }
      }
      if (!found) {
        content.push({ type: LEGACY_BLOCK_TYPE, uuid: `legacy-${slug}`, data: { [key]: newContent } });
      }
      await api.updateResource(slug, {
        authors: resource.authors,
        tags: resource.tags,
        title: resource.title,
        subtitle: resource.subtitle,
        abstract: resource.abstract,
        logo: resource.logo,
        banner: resource.banner,
        content,
        bibliography: resource.bibliography,
      });
      toast.success('Saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save.';
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        toast.error('API unreachable. Ensure the backend is running (npm run backend).');
      } else {
        toast.error(msg);
      }
      loadData();
    }
  };

  const getResource = async (slug: string, version: ResourceVersion = 'Published') => {
    if (!api.isApiConfigured()) return null;
    try {
      return await api.getResource(slug, version);
    } catch (e) {
      console.error('[CMS] getResource error:', e);
      return null;
    }
  };

  const saveChanges = async (slug: string, data: api.ResourceIn) => {
    if (!api.isApiConfigured()) {
      toast.error('API not configured');
      return false;
    }
    if (!canEdit) {
      toast.error('You don\'t have permission to edit');
      return false;
    }
    try {
      await api.updateResource(slug, data);
      toast.success('Saved');
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
      return false;
    }
  };

  const sendForReview = async (slug: string) => {
    if (!api.isApiConfigured()) {
      toast.error('API not configured');
      return false;
    }
    try {
      await api.sendForReview(slug);
      toast.success('Marked for publication');
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send for review');
      return false;
    }
  };

  const publish = async (slug: string) => {
    if (!api.isApiConfigured()) {
      toast.error('API not configured');
      return false;
    }
    try {
      await api.publishResource(slug);
      toast.success('Published');
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not publish');
      return false;
    }
  };

  const reloadData = React.useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <CMSContext.Provider value={{
      isEditing, toggleEditMode, getContent, updateContent,
      getResource, saveChanges, sendForReview, publish,
      canEdit, canEditKey, isLoading, isApiConfigured: api.isApiConfigured(),
      hasCache, reloadData,
    }}>
      {children}
    </CMSContext.Provider>
  );
};
