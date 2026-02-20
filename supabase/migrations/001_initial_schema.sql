-- ============================================================
-- ConcertIndustry.com — Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- USERS & AUTH
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('tm', 'pm', 'pa')) DEFAULT 'tm',
  tour_scale TEXT CHECK (tour_scale IN ('club', 'theater', 'arena', 'stadium')) DEFAULT 'club',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- USER PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  default_role TEXT CHECK (default_role IN ('tm', 'pm', 'pa')),
  default_tour_scale TEXT CHECK (default_tour_scale IN ('club', 'theater', 'arena', 'stadium')),
  default_currency TEXT DEFAULT 'USD',
  crisis_mode_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTIONS & USAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('free', 'pro_monthly', 'pro_annual')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhook)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Usage Metrics (query counting)
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_queries INTEGER DEFAULT 0,
  queries_this_month INTEGER DEFAULT 0,
  last_query_at TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.usage_metrics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.usage_metrics FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TOURS / PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  tour_scale TEXT CHECK (tour_scale IN ('club', 'theater', 'arena', 'stadium')) DEFAULT 'club',
  tour_type TEXT CHECK (tour_type IN ('headline', 'support', 'festival')) DEFAULT 'headline',
  start_date DATE,
  end_date DATE,
  regions TEXT[] DEFAULT ARRAY['US'],  -- e.g. ['US', 'EU', 'UK', 'Japan']
  currency TEXT DEFAULT 'USD',
  -- Budget assumptions (optional)
  num_shows INTEGER,
  avg_capacity INTEGER,
  avg_guarantee NUMERIC(12, 2),
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tours"
  ON public.tours FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CONVERSATION LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('tm', 'pm', 'pa')) NOT NULL,
  tour_scale TEXT CHECK (tour_scale IN ('club', 'theater', 'arena', 'stadium')) NOT NULL,
  mode TEXT CHECK (mode IN ('chat', 'knowledge', 'budget', 'settlement', 'crisis')) DEFAULT 'chat',
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  -- Retrieval metadata
  retrieved_chunk_ids UUID[],  -- which doc chunks were used
  -- Quality signals
  is_starred BOOLEAN DEFAULT FALSE,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful')),
  -- Tags for categorization
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON public.conversation_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- BUDGET TEMPLATES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.budget_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Budget data stored as JSON for flexibility
  budget_data JSONB NOT NULL DEFAULT '{}',
  -- AI-generated summary
  ai_summary TEXT,
  estimated_margin_low NUMERIC(12, 2),
  estimated_margin_high NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
  ON public.budget_templates FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SETTLEMENT RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  show_name TEXT NOT NULL,
  show_date DATE,
  venue_name TEXT,
  venue_city TEXT,
  -- Input figures
  gross_tickets NUMERIC(12, 2),
  total_taxes NUMERIC(12, 2),
  total_fees NUMERIC(12, 2),
  venue_rent NUMERIC(12, 2),
  marketing_costs NUMERIC(12, 2),
  production_reimbursements NUMERIC(12, 2),
  merch_deal_details TEXT,
  artist_guarantee NUMERIC(12, 2),
  overage_percentage NUMERIC(5, 2),  -- e.g. 85.00 for 85%
  -- Settlement results stored as JSON
  settlement_data JSONB NOT NULL DEFAULT '{}',
  -- AI output
  ai_breakdown TEXT,
  ai_watchouts TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settlements"
  ON public.settlements FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- KNOWLEDGE BASE — CORE DOCS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.core_docs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name TEXT NOT NULL,
  doc_type TEXT CHECK (doc_type IN (
    'tour_management', 'accounting', 'production',
    'audio_engineering', 'international', 'health',
    'festival', 'stage_management', 'backline',
    'promotion', 'general'
  )) DEFAULT 'general',
  raw_text TEXT NOT NULL,
  -- Metadata
  word_count INTEGER,
  char_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core docs are admin-only (use service role for writes)
ALTER TABLE public.core_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read core docs"
  ON public.core_docs FOR SELECT TO authenticated USING (is_active = TRUE);

CREATE POLICY "Service role can manage core docs"
  ON public.core_docs FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- KNOWLEDGE BASE — DOC CHUNKS (vector embeddings)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doc_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doc_id UUID REFERENCES public.core_docs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  -- pgvector embedding (text-embedding-3-small = 1536 dims)
  embedding VECTOR(1536),
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doc_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read doc chunks"
  ON public.doc_chunks FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Service role can manage doc chunks"
  ON public.doc_chunks FOR ALL USING (auth.role() = 'service_role');

-- Create vector similarity index (IVFFlat for speed at scale)
-- Run after inserting embeddings for better performance
-- CREATE INDEX ON public.doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- KNOWLEDGE ENTRIES (for future knowledge evolution)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  role TEXT CHECK (role IN ('tm', 'pm', 'pa', 'all')) DEFAULT 'all',
  tour_scale TEXT CHECK (tour_scale IN ('club', 'theater', 'arena', 'stadium', 'all')) DEFAULT 'all',
  body TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('conversation_promoted', 'original_doc', 'manual')) DEFAULT 'manual',
  source_conversation_id UUID REFERENCES public.conversation_logs(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read knowledge entries"
  ON public.knowledge_entries FOR SELECT TO authenticated USING (is_active = TRUE);

CREATE POLICY "Service role can manage knowledge entries"
  ON public.knowledge_entries FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- HELPER FUNCTION: Vector similarity search
-- ============================================================

CREATE OR REPLACE FUNCTION match_doc_chunks(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 8,
  filter_doc_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  doc_id UUID,
  chunk_text TEXT,
  chunk_index INTEGER,
  file_name TEXT,
  doc_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.doc_id,
    dc.chunk_text,
    dc.chunk_index,
    cd.file_name,
    cd.doc_type,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.doc_chunks dc
  JOIN public.core_docs cd ON dc.doc_id = cd.id
  WHERE cd.is_active = TRUE
    AND (filter_doc_type IS NULL OR cd.doc_type = filter_doc_type)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- TIMESTAMPS HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at BEFORE UPDATE ON public.usage_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_templates_updated_at BEFORE UPDATE ON public.budget_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_core_docs_updated_at BEFORE UPDATE ON public.core_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
