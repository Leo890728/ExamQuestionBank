-- Essay analysis history: one row per analysis (user question + AI response)
-- Used by AI Essay Analysis feature to save and list past analyses

CREATE TABLE IF NOT EXISTS public.essay_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    analysis_response TEXT NOT NULL,
    analysis_type VARCHAR(50) DEFAULT 'essay',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_essay_analysis_user ON public.essay_analysis(user_id);
CREATE INDEX idx_essay_analysis_created ON public.essay_analysis(user_id, created_at DESC);

ALTER TABLE public.essay_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own essay analyses" ON public.essay_analysis
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.essay_analysis TO authenticated;
GRANT SELECT, INSERT ON public.essay_analysis TO service_role;

COMMENT ON TABLE public.essay_analysis IS 'AI essay/case analysis history per user';
