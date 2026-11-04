-- ========================================
-- Nexus — Usage Budgets & Studio Output Cache
-- Run this after 000 and 001 in the Supabase SQL Editor.
-- ========================================

-- ── usage ──
-- Per-user daily AI-call counter. Document count and storage usage are NOT
-- stored here: they are cheaply computed from the documents table, so they can
-- never drift from what users actually see.
CREATE TABLE IF NOT EXISTS usage (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_calls_date DATE,
  ai_calls_used INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own usage" ON usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);


-- ── studio_cache ──
-- Deterministic, per-document AI outputs (key topics, overview, quiz, summary,
-- flashcards, mind map) cached until the document is deleted or re-ingested.
CREATE TABLE IF NOT EXISTS studio_cache (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  feature      TEXT NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, document_id, feature)
);

ALTER TABLE studio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own studio cache" ON studio_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_studio_cache_user_id ON studio_cache(user_id);