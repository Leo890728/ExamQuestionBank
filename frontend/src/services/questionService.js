/**
 * Question Service - Supabase RPC Only
 * No Django fallback - uses RPC functions exclusively
 */
import { supabase } from '@/lib/supabase'

const normalizeType = (value, options = []) => {
  if (value === 'multipleChoice' || value === 'essay') return value
  if (value === '選擇題' || value === '多選題' || value === '是非題') return 'multipleChoice'
  if (value === '申論題') return 'essay'
  if (options && options.length > 0) return 'multipleChoice'
  return 'essay'
}

const normalizeDifficulty = (value) => {
  if (value === 'medium') return 'normal'
  if (value === 'easy' || value === 'normal' || value === 'hard' || value === 'insane') return value
  return 'normal'
}

const normalizeYear = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeText = (value) => {
  if (value === null || value === undefined) return null
  const text = value.toString().trim()
  return text.length ? text : null
}

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return []
  return options
    .map((option, index) => ({
      content: option?.content?.toString().trim() || '',
      is_correct: Boolean(option?.is_correct),
      order: Number.isFinite(option?.order) ? option.order : index + 1
    }))
    .filter(option => option.content.length > 0)
}

const buildAddQuestionPayload = (questionData) => {
  const options = normalizeOptions(questionData?.options)
  return {
    content: normalizeText(questionData?.content),
    explanation: normalizeText(questionData?.explanation),
    question_type: normalizeType(questionData?.type ?? questionData?.question_type, options),
    difficulty: normalizeDifficulty(questionData?.difficulty),
    subject: normalizeText(questionData?.subject),
    category: normalizeText(questionData?.category),
    year: normalizeYear(questionData?.year),
    source: normalizeText(questionData?.source),
    options,
    tag_ids: Array.isArray(questionData?.tag_ids)
      ? questionData.tag_ids
      : Array.isArray(questionData?.tags)
        ? questionData.tags.map(tag => tag.id)
        : null
  }
}

const buildUpdateQuestionPayload = (questionId, questionData) => {
  const options = normalizeOptions(questionData?.options)
  return {
    p_id: Number(questionId),
    p_content: normalizeText(questionData?.content),
    p_explanation: normalizeText(questionData?.explanation),
    p_question_type: normalizeType(questionData?.type ?? questionData?.question_type, options),
    p_difficulty: normalizeDifficulty(questionData?.difficulty),
    p_subject: normalizeText(questionData?.subject),
    p_category: normalizeText(questionData?.category),
    p_year: normalizeYear(questionData?.year),
    p_source: normalizeText(questionData?.source),
    p_options: options,
    p_tag_ids: Array.isArray(questionData?.tag_ids)
      ? questionData.tag_ids
      : Array.isArray(questionData?.tags)
        ? questionData.tags.map(tag => tag.id)
        : null
  }
}

const questionService = {
  // Get questions with filters
  async getQuestions(params = {}) {
    const { data, error } = await supabase.rpc('get_questions', {
      p_subject: params.subject || null,
      p_difficulty: params.difficulty || null,
      p_type: params.type || null,
      p_year: params.year ? parseInt(params.year) : null,
      p_keyword: params.keyword || null,
      p_page: params.page || 1,
      p_page_size: params.page_size || 20
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Get single question detail
  async getQuestion(id) {
    const { data, error } = await supabase.rpc('get_question_detail', {
      p_id: parseInt(id)
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Toggle bookmark for a question
  async bookmarkQuestion(questionId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('請先登入')

    // Check if already bookmarked
    const { data: existing } = await supabase.from('bookmark')
      .select('id')
      .match({ user_id: user.id, question_id: questionId })
      .maybeSingle()

    if (existing) {
      // Remove bookmark
      await supabase.from('bookmark').delete().eq('id', existing.id)
      return { data: { bookmarked: false } }
    } else {
      // Add bookmark
      await supabase.from('bookmark').insert({ user_id: user.id, question_id: questionId })
      return { data: { bookmarked: true } }
    }
  },

  // Get user's bookmarked questions
  async getBookmarkedQuestions() {
    const { data, error } = await supabase.rpc('get_bookmarks')
    if (error) throw new Error(error.message)
    return { data: data || [] }
  },

  // Update a question (admin only)
  async updateQuestion(questionId, questionData) {
    const updatePayload = buildUpdateQuestionPayload(questionId, questionData)
    const { data, error } = await supabase.rpc('update_question', updatePayload)
    if (error) throw new Error(error.message)
    return { data }
  },

  // Create a new question (admin only)
  async createQuestion(questionData) {
    const payload = buildAddQuestionPayload(questionData)
    const { data, error } = await supabase.rpc('add_question', payload)
    if (error) throw new Error(error.message)
    return { data: { id: data } }
  },

  // Delete a question (admin only)
  async deleteQuestion(questionId) {
    const { data, error } = await supabase.rpc('delete_question', {
      p_id: Number(questionId)
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Get question options
  async getQuestionOptions(questionId) {
    const res = await this.getQuestion(questionId)
    return { data: res.data?.options || [] }
  },

  // Bulk create questions (admin only)
  async bulkCreateQuestions(questions) {
    const results = []
    for (let i = 0; i < questions.length; i += 1) {
      try {
        const payload = buildAddQuestionPayload(questions[i])
        const { data, error } = await supabase.rpc('add_question', payload)
        if (error) throw error
        results.push({ success: true, id: data, index: i })
      } catch (error) {
        results.push({ success: false, errors: error.message || error, index: i })
      }
    }
    return { data: results }
  },

  // Get next question (random from pool)
  async getNextQuestion(params = {}) {
    const result = await this.getQuestions({ ...params, page_size: 1 })
    const questions = result.data?.results || []
    return { data: questions[0] || null }
  },

  // Submit attempt (currently just returns success - can be enhanced later)
  async submitAttempt(questionId, attemptData) {
    // For now, we don't track individual attempts in Supabase
    // This can be added later with a question_attempt table
    return { data: { success: true, question_id: questionId } }
  },

  // Get attempts (placeholder - needs table)
  async getAttempts() {
    return { data: [] }
  }
}

export default questionService
