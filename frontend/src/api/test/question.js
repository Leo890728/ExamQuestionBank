import { supabase } from '@/lib/supabase'

const rpc = async (fn, params = {}) => {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) throw new Error(error.message)
  return data
}

export const questionApi = {
  // ── Query ──

  // get_questions → { results: [...], count, page, page_size }
  getQuestions: ({
    subject = null,
    difficulty = null,
    type = null,
    year = null,
    keyword = null,
    page = 1,
    page_size = 20,
    category = null,
    tag_ids = null,
    tag_mode = 'or',
    ordering = null
  } = {}) => rpc('get_questions', {
    p_subject: subject || null,
    p_difficulty: difficulty || null,
    p_type: type || null,
    p_year: year ? Number(year) : null,
    p_keyword: keyword || null,
    p_page: page,
    p_page_size: page_size,
    p_category: category || null,
    p_tag_ids: tag_ids?.length ? tag_ids : null,
    p_tag_mode: tag_mode || 'or',
    p_ordering: ordering || null
  }),

  // get_question_detail → { id, content, explanation, type, difficulty, subject, category, year, source, options, tags }
  getQuestionDetail: (id) =>
    rpc('get_question_detail', { p_id: Number(id) }),

  // get_bookmarks → [{ id, content, ... }]
  getBookmarks: () => rpc('get_bookmarks'),

  // ── Mutation (admin only) ──

  // add_question → BIGINT (new question id)
  createQuestion: ({
    content,
    explanation = null,
    question_type = null,
    difficulty = null,
    subject = null,
    category = null,
    year = null,
    source = null,
    options = [],
    tag_ids = null
  }) => rpc('add_question', {
    p_content: content,
    p_explanation: explanation,
    p_question_type: question_type,
    p_difficulty: difficulty,
    p_subject: subject,
    p_category: category,
    p_year: year ? Number(year) : null,
    p_source: source,
    p_options: options,
    p_tag_ids: tag_ids
  }),

  // update_question → { id, success }
  updateQuestion: (id, {
    content,
    explanation = null,
    question_type = null,
    difficulty = null,
    subject = null,
    category = null,
    year = null,
    source = null,
    options = null,
    tag_ids = null
  }) => rpc('update_question', {
    p_id: Number(id),
    p_content: content,
    p_explanation: explanation,
    p_question_type: question_type,
    p_difficulty: difficulty,
    p_subject: subject,
    p_category: category,
    p_year: year ? Number(year) : null,
    p_source: source,
    p_options: options,
    p_tag_ids: tag_ids
  }),

  // delete_question → { id, success }
  deleteQuestion: (id) =>
    rpc('delete_question', { p_id: Number(id) }),

  // toggle_bookmark → { bookmarked: bool }
  toggleBookmark: (questionId) =>
    rpc('toggle_bookmark', { p_question_id: Number(questionId) }),

  // ── Tags ──

  // get_tags → { results, count, limit, offset }
  getTags: ({ search = null, limit = 50, offset = 0 } = {}) =>
    rpc('get_tags', { p_search: search, p_limit: limit, p_offset: offset }),

  // create_tag → { id, name, created_at, inserted }
  createTag: (name) =>
    rpc('create_tag', { p_name: name }),

  // set_question_tags → { question_id, removed, added }
  setQuestionTags: (questionId, tagIds) =>
    rpc('set_question_tags', { p_question_id: Number(questionId), p_tag_ids: tagIds })
}
