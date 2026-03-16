/**
 * Migration page: copy localStorage CMS data to backend resources.
 * Run once when switching to API backend.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { isApiConfigured, createResource, updateResource, getResourceOptional } from '../lib/api';
import { PAGE_SLUGS, SLUG_TO_KEYS } from '../lib/resourceMapping';

const CMS_STORAGE_KEY = 'ift_cms_data';
const LEGACY_BLOCK_TYPE = 'legacy_cms';

export const Migrate = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const log = (msg: string) => setStatus((s) => [...s, msg]);

  const run = async () => {
    if (!isApiConfigured()) {
      log('Error: API not configured');
      return;
    }
    setRunning(true);
    setStatus([]);
    try {
      const raw = localStorage.getItem(CMS_STORAGE_KEY);
      const localData = raw ? JSON.parse(raw) : {};
      if (typeof localData !== 'object') {
        log('No CMS data in localStorage');
        return;
      }
      for (const slug of PAGE_SLUGS) {
        const keys = SLUG_TO_KEYS[slug] || [];
        const data: Record<string, unknown> = {};
        for (const k of keys) {
          if (localData[k] !== undefined) data[k] = localData[k];
        }
        const content = [{ type: LEGACY_BLOCK_TYPE, uuid: `legacy-${slug}`, data }];
        try {
          const existing = await getResourceOptional(slug, 'Draft') ?? await getResourceOptional(slug, 'Published');
          const payload = {
            authors: existing?.authors ?? [],
            tags: existing?.tags ?? [],
            title: existing?.title || slug,
            subtitle: existing?.subtitle ?? '',
            abstract: existing?.abstract ?? '',
            logo: existing?.logo ?? '',
            banner: existing?.banner ?? '',
            content,
            bibliography: existing?.bibliography ?? '',
          };
          if (existing) {
            await updateResource(slug, payload);
            log(`Updated ${slug}`);
          } else {
            try {
              await createResource(slug, {
                authors: [],
                tags: [],
                title: slug,
                subtitle: '',
                abstract: '',
                logo: '',
                banner: '',
                content,
                bibliography: '',
              });
              log(`Created ${slug}`);
            } catch (createErr) {
              const createMsg = createErr instanceof Error ? createErr.message : String(createErr);
              if (createMsg.includes('already exists')) {
                await updateResource(slug, payload);
                log(`Updated ${slug} (existed, overwritten)`);
              } else {
                throw createErr;
              }
            }
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          log(`Failed ${slug}: ${errMsg}`);
        }
      }
      log('Migration complete.');
    } finally {
      setRunning(false);
    }
  };

  if (!isApiConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-md">
          <h1 className="text-2xl font-serif mb-4">Migration</h1>
          <p className="text-neutral-600 mb-4">
            Configure the API (e.g. VITE_API_URL=/api for dev proxy) and ensure the backend is running.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-teal-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-serif mb-4">Migrate CMS to API</h1>
        <p className="text-neutral-600 mb-6">
          Copy localStorage CMS data to backend resources. Run once when switching to the API.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="bg-neutral-900 text-white px-6 py-2 uppercase text-xs font-bold tracking-widest disabled:opacity-50"
        >
          {running ? 'Migrating...' : 'Run Migration'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="ml-4 text-neutral-600 hover:underline"
        >
          Back to Dashboard
        </button>
        {status.length > 0 && (
          <pre className="mt-6 p-4 bg-white border border-neutral-200 text-sm overflow-auto max-h-96">
            {status.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
};
