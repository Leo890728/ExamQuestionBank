# Note-Taking System Implementation Spec

## Exam Question Bank

**Created:** 2026-02-02  
**Status:** Planning  

---

## 1. Executive Summary

Extend the existing Exam Question Bank with a **general-purpose note-taking system** that enables:
- Users to save **free-form notes** (not just question-specific notes)
- Notes to be **embedded and searchable** via pgvector
- AI-powered **"Ask AI" deep dive** using notes as context
- **Flashcard generation** from notes

This builds on the existing `question_note` and RAG infrastructure.

---

## 2. Current State Analysis

### Existing Assets
| Component | Status | Location |
|-----------|--------|----------|
| `question_note` table | ✅ Exists | Tied to specific questions only |
| `question_embedding` | ✅ Exists | pgvector with 1536d embeddings |
| `match_questions()` RPC | ✅ Exists | Semantic search for questions |
| `flashcard` table | ✅ Exists | SM2 algorithm, but question-bound |
| `conversation` table | ✅ Exists | AI chat with hybrid sync |

### Gap Analysis
| Need | Current Gap |
|------|-------------|
| Free-form notes | `question_note` requires a `question_id` |
| Note embeddings | Only questions are embedded, not notes |
| Note-based flashcards | `flashcard` only links to questions |
| Multi-source context for AI | Conversations don't pull from user notes |

---

## 3. Database Schema Design

### 3.1 New Table: `user_note`

```sql
CREATE TABLE IF NOT EXISTS public.user_note (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_html TEXT,  -- Optional rich text
    
    -- Context linking (optional)
    source_type VARCHAR(50),  -- 'question', 'exam', 'manual', 'extension'
    source_id VARCHAR(255),   -- question_id, exam_id, etc.
    source_url TEXT,          -- For extension-captured notes
    source_metadata JSONB,    -- { "subject": "憲法", "year": 2024 }
    
    -- Organization
    tags TEXT[],              -- ['憲法', '人權', '重要']
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_note_user ON public.user_note(user_id);
CREATE INDEX idx_user_note_source ON public.user_note(source_type, source_id);
CREATE INDEX idx_user_note_tags ON public.user_note USING GIN(tags);
CREATE INDEX idx_user_note_pinned ON public.user_note(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_user_note_search ON public.user_note USING GIN(to_tsvector('simple', coalesce(title, '') || ' ' || content));

-- RLS
ALTER TABLE public.user_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON public.user_note
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 3.2 New Table: `note_embedding`

```sql
CREATE TABLE IF NOT EXISTS public.note_embedding (
    note_id UUID PRIMARY KEY REFERENCES public.user_note(id) ON DELETE CASCADE,
    embedding vector(1536),
    model VARCHAR(50) DEFAULT 'text-embedding-3-small' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- HNSW index for similarity search
CREATE INDEX idx_note_embedding_vector ON public.note_embedding 
    USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.note_embedding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own note embeddings" ON public.note_embedding
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.user_note 
        WHERE id = note_id AND user_id = auth.uid()
    ));
```

### 3.3 New Table: `note_flashcard`

```sql
CREATE TABLE IF NOT EXISTS public.note_flashcard (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.user_note(id) ON DELETE CASCADE,
    
    -- Flashcard content (AI-generated from note)
    front TEXT NOT NULL,  -- Question/prompt
    back TEXT NOT NULL,   -- Answer
    
    -- SM2 Algorithm fields (same as existing flashcard table)
    ease_factor REAL DEFAULT 2.5 NOT NULL,
    interval_days SMALLINT DEFAULT 1 NOT NULL,
    repetition SMALLINT DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'new' NOT NULL,
    next_review_date DATE DEFAULT CURRENT_DATE NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    review_count SMALLINT DEFAULT 0 NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    CONSTRAINT note_flashcard_status_check CHECK (status IN ('new', 'learning', 'review', 'mastered'))
);

CREATE INDEX idx_note_flashcard_user ON public.note_flashcard(user_id);
CREATE INDEX idx_note_flashcard_note ON public.note_flashcard(note_id);
CREATE INDEX idx_note_flashcard_due ON public.note_flashcard(user_id, next_review_date);

ALTER TABLE public.note_flashcard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own note flashcards" ON public.note_flashcard
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 4. RPC Functions

### 4.1 Semantic Search Across Notes

```sql
CREATE OR REPLACE FUNCTION public.match_user_notes(
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
        n.tags,
        1 - (ne.embedding <=> query_embedding) as similarity,
        n.created_at
    FROM public.user_note n
    JOIN public.note_embedding ne ON ne.note_id = n.id
    WHERE 
        n.user_id = p_user_id
        AND n.is_archived = false
        AND 1 - (ne.embedding <=> query_embedding) > match_threshold
    ORDER BY ne.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### 4.2 Combined Context Retrieval (Notes + Questions)

```sql
CREATE OR REPLACE FUNCTION public.get_ai_context(
    p_user_id UUID,
    query_embedding vector(1536),
    p_max_notes int DEFAULT 5,
    p_max_questions int DEFAULT 5,
    p_threshold float DEFAULT 0.65
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'notes', COALESCE((
            SELECT json_agg(json_build_object(
                'id', n.id,
                'title', n.title,
                'content', n.content,
                'similarity', 1 - (ne.embedding <=> query_embedding)
            ) ORDER BY ne.embedding <=> query_embedding)
            FROM public.user_note n
            JOIN public.note_embedding ne ON ne.note_id = n.id
            WHERE n.user_id = p_user_id
            AND n.is_archived = false
            AND 1 - (ne.embedding <=> query_embedding) > p_threshold
            LIMIT p_max_notes
        ), '[]'::json),
        'questions', COALESCE((
            SELECT json_agg(json_build_object(
                'id', q.id,
                'content', q.content,
                'subject', q.subject,
                'year', q.year,
                'similarity', 1 - (qe.embedding <=> query_embedding)
            ) ORDER BY qe.embedding <=> query_embedding)
            FROM public.question q
            JOIN public.question_embedding qe ON qe.question_id = q.id
            WHERE 1 - (qe.embedding <=> query_embedding) > p_threshold
            LIMIT p_max_questions
        ), '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;
```

---

## 5. Frontend Components

### 5.1 Component Structure

```
src/
├── components/
│   └── notes/
│       ├── NoteList.vue          # List view with search/filter
│       ├── NoteEditor.vue        # Create/edit note modal
│       ├── NoteCard.vue          # Individual note preview
│       ├── NoteDetail.vue        # Full note view with actions
│       ├── NoteTagInput.vue      # Tag management
│       └── NoteFlashcardGen.vue  # AI flashcard generation UI
├── stores/
│   └── noteStore.js              # Pinia store for notes
├── views/
│   └── NotesView.vue             # Main notes page
```

### 5.2 Key Features

1. **Quick Capture**
   - Floating "+" button for quick note entry
   - Support paste from clipboard (text, URLs)
   - Auto-tag based on content analysis

2. **Organization**
   - Tag-based filtering
   - Pin important notes
   - Archive old notes
   - Full-text search + semantic search

3. **AI Integration**
   - "Ask AI about this note" → Opens conversation with note as context
   - "Generate flashcards" → Creates 3-5 Q&A pairs from note
   - "Find related questions" → Semantic search against question bank

4. **Question Linking**
   - When viewing a question, "Add Note" saves with `source_type='question'`
   - Notes show linked question context

---

## 6. API Endpoints

### Supabase Edge Functions (Optional)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/embed-note` | POST | Generate embedding for new/updated note |
| `/generate-flashcards` | POST | AI generates flashcards from note content |

### Direct Supabase Client

Most operations use the Supabase JS client directly:

```javascript
// Create note
const { data } = await supabase
  .from('user_note')
  .insert({ user_id, title, content, tags })
  .select()
  .single();

// Search notes
const { data } = await supabase.rpc('match_user_notes', {
  p_user_id: userId,
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 10
});
```

---

## 7. Implementation Phases

### Phase 1: Core Notes (Week 1)
- [ ] Create `user_note` table migration
- [ ] Create `noteStore.js` Pinia store
- [ ] Build `NoteList.vue` and `NoteEditor.vue`
- [ ] Add "Notes" route to main navigation
- [ ] Basic CRUD operations

### Phase 2: Embeddings & Search (Week 2)
- [ ] Create `note_embedding` table migration
- [ ] Edge function or client-side embedding generation
- [ ] Implement `match_user_notes()` RPC
- [ ] Add semantic search to NoteList
- [ ] Full-text fallback search

### Phase 3: AI Features (Week 3)
- [ ] Create `note_flashcard` table migration
- [ ] "Ask AI" button → opens conversation with context
- [ ] Implement `get_ai_context()` RPC for combined retrieval
- [ ] Flashcard generation UI
- [ ] Integrate with existing flashcard review system

### Phase 4: Question Integration (Week 4)
- [ ] Add "Add Note" action to question detail view
- [ ] Show linked notes on question page
- [ ] "Find related questions" from note
- [ ] Cross-reference in study analytics

---

## 8. Migration File

Create: `supabase/migrations/20260202_note_taking_system.sql`

```sql
-- Full migration combining all tables and functions above
-- See sections 3 and 4 for complete SQL
```

---

## 9. UI Mockup Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 My Notes                        [+ New Note]  [🔍 Search]   │
├─────────────────────────────────────────────────────────────────┤
│  Tags: [憲法] [刑法] [重要] [All]                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📌 大法官解釋 748 號重點                         昨天      ││
│  │ 關於同性婚姻的憲法解釋，民法親屬編修正...                  ││
│  │ [憲法] [人權]                     [🤖 Ask AI] [📚 Cards]   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 刑法第 271 條筆記                              2 天前      ││
│  │ 殺人罪構成要件：主觀上需有殺人故意...                      ││
│  │ [刑法] [考古題]                   [🤖 Ask AI] [📚 Cards]   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Notes created per active user/week | ≥ 5 |
| AI context retrieval latency | < 500ms |
| Flashcard generation success rate | > 95% |
| User retention (notes feature users) | +15% |
