-- =============================================================================
-- RAG Exam Analysis MVP: pgvector setup and tables
-- Created: 2026-01-29
-- Description: Enables vector similarity search for exam questions
-- =============================================================================

-- ============================================
-- ENABLE PGVECTOR EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLE 1: question_embedding (Vector Storage)
-- Links to existing question table, stores embeddings
-- ============================================

CREATE TABLE IF NOT EXISTS public.question_embedding (
    question_id BIGINT PRIMARY KEY REFERENCES public.question(id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
    model VARCHAR(50) DEFAULT 'text-embedding-3-small' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_question_embedding_vector ON public.question_embedding 
    USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.question_embedding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read question embeddings" ON public.question_embedding
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- TABLE 2: concept_group (Clusters of Similar Questions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.concept_group (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    subject VARCHAR(100),
    question_count INTEGER DEFAULT 0 NOT NULL,
    year_min SMALLINT,
    year_max SMALLINT,
    is_important BOOLEAN DEFAULT false NOT NULL,
    is_high_priority BOOLEAN DEFAULT false NOT NULL,
    frequency DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_concept_group_subject ON public.concept_group(subject);
CREATE INDEX idx_concept_group_important ON public.concept_group(is_important);
CREATE INDEX idx_concept_group_priority ON public.concept_group(is_high_priority);

ALTER TABLE public.concept_group ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read concept groups" ON public.concept_group
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- TABLE 3: concept_group_question (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.concept_group_question (
    group_id BIGINT NOT NULL REFERENCES public.concept_group(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES public.question(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (group_id, question_id)
);

CREATE INDEX idx_cgq_group ON public.concept_group_question(group_id);
CREATE INDEX idx_cgq_question ON public.concept_group_question(question_id);

ALTER TABLE public.concept_group_question ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read concept group questions" ON public.concept_group_question
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- RPC FUNCTION: match_questions (Similarity Search)
-- ============================================

CREATE OR REPLACE FUNCTION public.match_questions(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20,
    filter_subject text DEFAULT NULL,
    filter_year_from int DEFAULT NULL,
    filter_year_to int DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    content text,
    year smallint,
    subject varchar,
    type public.question_type,
    difficulty public.question_difficulty,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.content,
        q.year,
        q.subject,
        q.type,
        q.difficulty,
        1 - (qe.embedding <=> query_embedding) as similarity
    FROM public.question q
    JOIN public.question_embedding qe ON qe.question_id = q.id
    WHERE 
        (filter_subject IS NULL OR q.subject = filter_subject)
        AND (filter_year_from IS NULL OR q.year >= filter_year_from)
        AND (filter_year_to IS NULL OR q.year <= filter_year_to)
        AND 1 - (qe.embedding <=> query_embedding) > match_threshold
    ORDER BY qe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_questions TO authenticated;

-- ============================================
-- RPC FUNCTION: find_similar_by_question_id
-- ============================================

CREATE OR REPLACE FUNCTION public.find_similar_questions(
    p_question_id bigint,
    p_threshold float DEFAULT 0.7,
    p_limit int DEFAULT 20
)
RETURNS TABLE (
    id bigint,
    content text,
    year smallint,
    subject varchar,
    type public.question_type,
    difficulty public.question_difficulty,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    source_embedding vector(1536);
BEGIN
    -- Get the embedding for the source question
    SELECT qe.embedding INTO source_embedding
    FROM public.question_embedding qe
    WHERE qe.question_id = p_question_id;
    
    IF source_embedding IS NULL THEN
        RAISE EXCEPTION 'Question % has no embedding', p_question_id;
    END IF;
    
    RETURN QUERY
    SELECT
        q.id,
        q.content,
        q.year,
        q.subject,
        q.type,
        q.difficulty,
        1 - (qe.embedding <=> source_embedding) as similarity
    FROM public.question q
    JOIN public.question_embedding qe ON qe.question_id = q.id
    WHERE 
        q.id != p_question_id
        AND 1 - (qe.embedding <=> source_embedding) > p_threshold
    ORDER BY qe.embedding <=> source_embedding
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_similar_questions TO authenticated;

-- ============================================
-- RPC FUNCTION: upsert_question_embedding
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_question_embedding(
    p_question_id bigint,
    p_embedding vector(1536),
    p_model varchar DEFAULT 'text-embedding-3-small'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.question_embedding (question_id, embedding, model)
    VALUES (p_question_id, p_embedding, p_model)
    ON CONFLICT (question_id) 
    DO UPDATE SET 
        embedding = EXCLUDED.embedding,
        model = EXCLUDED.model,
        created_at = now();
    
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_question_embedding TO service_role;

-- ============================================
-- RPC FUNCTION: get_embedding_stats
-- ============================================

CREATE OR REPLACE FUNCTION public.get_embedding_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_questions', (SELECT COUNT(*) FROM public.question),
        'embedded_questions', (SELECT COUNT(*) FROM public.question_embedding),
        'unembedded_questions', (
            SELECT COUNT(*) FROM public.question q 
            LEFT JOIN public.question_embedding qe ON qe.question_id = q.id 
            WHERE qe.question_id IS NULL
        ),
        'models', (
            SELECT json_agg(json_build_object('model', model, 'count', cnt))
            FROM (
                SELECT model, COUNT(*) as cnt 
                FROM public.question_embedding 
                GROUP BY model
            ) m
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_embedding_stats TO authenticated;

-- ============================================
-- RPC FUNCTION: get_unembedded_question_ids
-- ============================================

CREATE OR REPLACE FUNCTION public.get_unembedded_question_ids(
    p_limit int DEFAULT 100
)
RETURNS SETOF bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT q.id
    FROM public.question q
    LEFT JOIN public.question_embedding qe ON qe.question_id = q.id
    WHERE qe.question_id IS NULL
    ORDER BY q.id
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unembedded_question_ids TO authenticated;

-- ============================================
-- RPC FUNCTION: get_concept_groups
-- ============================================

CREATE OR REPLACE FUNCTION public.get_concept_groups(
    p_subject text DEFAULT NULL,
    p_important_only boolean DEFAULT false,
    p_page int DEFAULT 1,
    p_page_size int DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    offset_val int;
BEGIN
    offset_val := (p_page - 1) * p_page_size;
    
    SELECT json_build_object(
        'results', COALESCE((
            SELECT json_agg(row_to_json(g))
            FROM (
                SELECT 
                    cg.id,
                    cg.name,
                    cg.description,
                    cg.subject,
                    cg.question_count,
                    cg.year_min,
                    cg.year_max,
                    cg.is_important,
                    cg.is_high_priority,
                    cg.frequency,
                    cg.created_at
                FROM public.concept_group cg
                WHERE 
                    (p_subject IS NULL OR cg.subject = p_subject)
                    AND (p_important_only = false OR cg.is_important = true)
                ORDER BY 
                    cg.is_high_priority DESC,
                    cg.is_important DESC,
                    cg.question_count DESC
                LIMIT p_page_size OFFSET offset_val
            ) g
        ), '[]'::json),
        'count', (
            SELECT COUNT(*) FROM public.concept_group cg
            WHERE 
                (p_subject IS NULL OR cg.subject = p_subject)
                AND (p_important_only = false OR cg.is_important = true)
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_concept_groups TO authenticated;

-- ============================================
-- RPC FUNCTION: get_concept_group_questions
-- ============================================

CREATE OR REPLACE FUNCTION public.get_concept_group_questions(
    p_group_id bigint
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'group', (
            SELECT row_to_json(cg)
            FROM public.concept_group cg
            WHERE cg.id = p_group_id
        ),
        'questions', COALESCE((
            SELECT json_agg(json_build_object(
                'id', q.id,
                'content', q.content,
                'year', q.year,
                'subject', q.subject,
                'type', q.type,
                'difficulty', q.difficulty,
                'similarity_score', cgq.similarity_score
            ) ORDER BY cgq.similarity_score DESC NULLS LAST)
            FROM public.concept_group_question cgq
            JOIN public.question q ON q.id = cgq.question_id
            WHERE cgq.group_id = p_group_id
        ), '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_concept_group_questions TO authenticated;

-- ============================================
-- TRIGGER: Update concept_group updated_at
-- ============================================

CREATE TRIGGER set_concept_group_updated_at
    BEFORE UPDATE ON public.concept_group
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON public.question_embedding TO service_role;
GRANT SELECT ON public.question_embedding TO authenticated;

GRANT ALL ON public.concept_group TO service_role;
GRANT SELECT ON public.concept_group TO authenticated;

GRANT ALL ON public.concept_group_question TO service_role;
GRANT SELECT ON public.concept_group_question TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.question_embedding IS 'Stores vector embeddings for questions using pgvector';
COMMENT ON TABLE public.concept_group IS 'Groups of semantically similar questions (concept clusters)';
COMMENT ON TABLE public.concept_group_question IS 'Junction table linking questions to concept groups';
COMMENT ON FUNCTION public.match_questions IS 'Semantic similarity search using pgvector';
COMMENT ON FUNCTION public.find_similar_questions IS 'Find questions similar to a given question by ID';
