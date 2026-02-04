-- =============================================================================
-- Exam Note System for ExamQuestionBank
-- Created: 2026-02-04
-- Description: Replaces question_note with flexible exam_note table supporting
--              question-specific, exam-level, and manual study notes
-- =============================================================================

-- ============================================
-- TABLE 1: exam_note (Replaces question_note)
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_note (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_html TEXT,  -- Optional rich text

    -- Source context (what the user was studying)
    source_type VARCHAR(50),  -- 'question', 'exam', 'manual', 'external'
    source_id VARCHAR(255),   -- question_id, exam_id, or null for manual notes
    source_url TEXT,          -- For external resources (articles, videos)
    source_metadata JSONB,    -- { "subject": "憲法", "year": 2024, "difficulty": "hard", "question_type": "essay" }

    -- Organization
    tags TEXT[],              -- ['憲法', '人權', '重要']
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_user' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_user ON public.exam_note(user_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_source' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_source ON public.exam_note(source_type, source_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_tags' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_tags ON public.exam_note USING GIN(tags); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_pinned' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_pinned ON public.exam_note(user_id, is_pinned) WHERE is_pinned = true; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_created' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_created ON public.exam_note(user_id, created_at DESC); END IF; END $$;

-- Full-text search for Chinese content
DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_fts' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_fts ON public.exam_note USING GIN(to_tsvector('simple', coalesce(title, '') || ' ' || content)); END IF; END $$;

-- Row Level Security
ALTER TABLE public.exam_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exam notes" ON public.exam_note
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.exam_note TO service_role;
GRANT ALL ON public.exam_note TO authenticated;

-- ============================================
-- TABLE 2: exam_note_embedding (pgvector)
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_note_embedding (
    note_id UUID PRIMARY KEY REFERENCES public.exam_note(id) ON DELETE CASCADE,
    embedding vector(1536),
    model VARCHAR(50) DEFAULT 'text-embedding-3-small' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- HNSW index for fast similarity search
DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_embedding_vector' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_embedding_vector ON public.exam_note_embedding USING hnsw (embedding vector_cosine_ops); END IF; END $$;

-- Row Level Security
ALTER TABLE public.exam_note_embedding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own exam note embeddings" ON public.exam_note_embedding
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_note
        WHERE id = note_id AND user_id = auth.uid()
    ));

CREATE POLICY "Service role manages embeddings" ON public.exam_note_embedding
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.exam_note_embedding TO service_role;
GRANT SELECT ON public.exam_note_embedding TO authenticated;

-- ============================================
-- TABLE 3: exam_note_flashcard (SM2 Algorithm)
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_note_flashcard (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.exam_note(id) ON DELETE CASCADE,

    -- Flashcard content (AI-generated from note)
    front TEXT NOT NULL,  -- Question/prompt
    back TEXT NOT NULL,   -- Answer

    -- SM2 Algorithm fields
    ease_factor REAL DEFAULT 2.5 NOT NULL,
    interval_days SMALLINT DEFAULT 1 NOT NULL,
    repetition SMALLINT DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'new' NOT NULL,
    next_review_date DATE DEFAULT CURRENT_DATE NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    review_count SMALLINT DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT exam_note_flashcard_status_check CHECK (status IN ('new', 'learning', 'review', 'mastered'))
);

-- Indexes
DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_flashcard_user' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_flashcard_user ON public.exam_note_flashcard(user_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_flashcard_note' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_flashcard_note ON public.exam_note_flashcard(note_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS ( SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_exam_note_flashcard_due' AND n.nspname = 'public' ) THEN CREATE INDEX idx_exam_note_flashcard_due ON public.exam_note_flashcard(user_id, next_review_date); END IF; END $$;

-- Row Level Security
ALTER TABLE public.exam_note_flashcard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exam note flashcards" ON public.exam_note_flashcard
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.exam_note_flashcard TO service_role;
GRANT ALL ON public.exam_note_flashcard TO authenticated;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE TRIGGER set_exam_note_updated_at
    BEFORE UPDATE ON public.exam_note
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RPC: Match notes by semantic similarity
-- ============================================

CREATE OR REPLACE FUNCTION public.match_exam_notes(
    p_user_id UUID,
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    content TEXT,
    source_type VARCHAR,
    source_metadata JSONB,
    tags TEXT[],
    similarity float,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.source_type,
        n.source_metadata,
        n.tags,
        1 - (ne.embedding <=> query_embedding) as similarity,
        n.created_at
    FROM public.exam_note n
    JOIN public.exam_note_embedding ne ON ne.note_id = n.id
    WHERE
        n.user_id = p_user_id
        AND n.is_archived = false
        AND 1 - (ne.embedding <=> query_embedding) > match_threshold
    ORDER BY ne.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_exam_notes TO authenticated;

-- ============================================
-- RPC: Upsert note embedding
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_exam_note_embedding(
    p_note_id UUID,
    p_embedding vector(1536),
    p_model VARCHAR DEFAULT 'text-embedding-3-small'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.exam_note_embedding (note_id, embedding, model)
    VALUES (p_note_id, p_embedding, p_model)
    ON CONFLICT (note_id)
    DO UPDATE SET
        embedding = EXCLUDED.embedding,
        model = EXCLUDED.model,
        created_at = now();

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_exam_note_embedding TO service_role;

-- ============================================
-- DATA MIGRATION: question_note → exam_note
-- ============================================

-- Migrate existing question_note data to exam_note
-- Run this ONLY if question_note table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'question_note'
    ) THEN
        INSERT INTO public.exam_note (
            user_id,
            content,
            source_type,
            source_id,
            created_at
        )
        SELECT
            user_id,
            content,
            'question' as source_type,
            question_id::text as source_id,
            created_at
        FROM public.question_note
        WHERE NOT EXISTS (
            SELECT 1 FROM public.exam_note
            WHERE source_type = 'question'
            AND source_id = question_note.question_id::text
            AND user_id = question_note.user_id
        );

        RAISE NOTICE 'Migrated % notes from question_note to exam_note',
            (SELECT COUNT(*) FROM public.exam_note WHERE source_type = 'question');
    END IF;
END $$;

-- Optional: Drop old table after verifying migration
-- Uncomment below after confirming data migration is successful
-- DROP TABLE IF EXISTS public.question_note CASCADE;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE public.exam_note IS 'User study notes supporting question-specific, exam-level, and manual notes';
COMMENT ON COLUMN public.exam_note.source_type IS 'Type: question, exam, manual, external';
COMMENT ON COLUMN public.exam_note.source_id IS 'ID reference to question/exam, null for manual notes';
COMMENT ON COLUMN public.exam_note.source_metadata IS 'Rich context: subject, year, difficulty, question_type';
COMMENT ON TABLE public.exam_note_embedding IS 'OpenAI embeddings for semantic search';
COMMENT ON TABLE public.exam_note_flashcard IS 'AI-generated flashcards from notes using SM2 algorithm';
