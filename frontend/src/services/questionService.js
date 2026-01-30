/**
 * Question Service - Supabase RPC Only
 * No Django fallback - uses RPC functions exclusively
 */
import { supabase } from '@/lib/supabase'
import { QuestionModel } from '@/models/Question'

const toQuestionModel = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  return QuestionModel.fromRpcWithExtras(raw)
}

const mapQuestionList = (list) => {
  if (!Array.isArray(list)) return []
  return list
    .map(item => toQuestionModel(item))
    .filter(Boolean)
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
    if (data?.results) {
      return { data: { ...data, results: mapQuestionList(data.results) } }
    }
    if (Array.isArray(data)) {
      return { data: mapQuestionList(data) }
    }
    return { data }
  },

  // Get single question detail
  async getQuestion(id) {
    const { data, error } = await supabase.rpc('get_question_detail', {
      p_id: parseInt(id)
    })
    if (error) throw new Error(error.message)
    return { data: data ? toQuestionModel(data) : null }
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
    return { data: mapQuestionList(data || []) }
  },

  // Update a question (admin only)
  async updateQuestion(questionId, questionData) {
    const updatePayload = QuestionModel.toUpdatePayload(questionId, questionData)
    const { data, error } = await supabase.rpc('update_question', updatePayload)
    if (error) throw new Error(error.message)
    return { data }
  },

  // Create a new question (admin only)
  async createQuestion(questionData) {
    const payload = QuestionModel.toAddPayload(questionData)
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
        const payload = QuestionModel.toAddPayload(questions[i])
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
  },

  // Bulk update questions (admin only)
  async bulkUpdateQuestions(updates = []) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return { data: { results: [] } }
    }

    const results = []

    for (let i = 0; i < updates.length; i += 1) {
      const update = updates[i]
      try {
        if (!update || update.id === undefined || update.id === null) {
          throw new Error('id is required')
        }

        const existing = await this.getQuestion(update.id)
        if (!existing?.data) {
          throw new Error('question not found')
        }

        const merged = { ...existing.data }
        Object.keys(update).forEach((key) => {
          if (update[key] !== undefined) {
            merged[key] = update[key]
          }
        })

        await this.updateQuestion(update.id, merged)
        results.push({ success: true, id: update.id, index: i })
      } catch (error) {
        results.push({ success: false, id: update?.id, index: i, errors: error?.message || error })
      }
    }

    return { data: { results } }
  }
}

export default questionService
