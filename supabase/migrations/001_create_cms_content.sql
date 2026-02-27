-- IFT CMS content table
-- Run this in your Supabase project: SQL Editor > New query > paste & Run

CREATE TABLE IF NOT EXISTS public.cms_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read (public content)
CREATE POLICY "cms_content_select_policy"
  ON public.cms_content
  FOR SELECT
  USING (true);

-- Policy: only authenticated users can insert/update/delete
CREATE POLICY "cms_content_insert_policy"
  ON public.cms_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cms_content_update_policy"
  ON public.cms_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cms_content_delete_policy"
  ON public.cms_content
  FOR DELETE
  TO authenticated
  USING (true);

-- Optional: create index for updated_at if you need time-based queries
CREATE INDEX IF NOT EXISTS idx_cms_content_updated_at ON public.cms_content(updated_at DESC);
