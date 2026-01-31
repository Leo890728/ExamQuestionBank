/**
 * Exam Service - Supabase RPC with limited table fallbacks
 * Uses RPC functions defined in docs/supabase-rpc-api.md
 * Direct table operations are used only when RPC is not available.
 */
import { supabase } from '@/lib/supabase'

const toNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return []
  return options.map((opt, index) => ({
    ...opt,
    id: Number.isFinite(Number(opt?.id)) ? Number(opt.id) : opt?.id,
    order: Number.isFinite(Number(opt?.order)) ? Number(opt.order) : index + 1,
    is_correct: Boolean(opt?.is_correct ?? opt?.isCorrect),
    isCorrect: Boolean(opt?.isCorrect ?? opt?.is_correct)
  }))
}

const normalizeExamQuestion = (item, index) => {
  const source = item && typeof item === 'object' ? item : {}
  const questionId = toNumber(source.question_id ?? source.question ?? source.id)
  const examQuestionId = toNumber(
    source.exam_question_id ??
    (source.question_id || source.question ? source.id : null)
  )

  const order = Number.isFinite(Number(source.order)) ? Number(source.order) : index + 1
  const points = Number.isFinite(Number(source.points)) ? Number(source.points) : (source.points ?? null)
  const content = source.question_content ?? source.content ?? ''
  const subject = source.question_subject ?? source.subject ?? null
  const category = source.question_category ?? source.category ?? null
  const explanation = source.question_explanation ?? source.explanation ?? null
  const questionType = source.question_type ?? source.type ?? null
  const difficulty = source.question_difficulty ?? source.difficulty ?? null
  const options = normalizeOptions(source.options || [])

  return {
    ...source,
    id: examQuestionId ?? source.id ?? null,
    exam_question_id: examQuestionId ?? source.exam_question_id ?? null,
    question: questionId ?? source.question ?? source.question_id ?? null,
    question_id: questionId ?? source.question_id ?? source.question ?? null,
    order,
    points,
    question_content: content,
    question_subject: subject,
    question_category: category,
    question_explanation: explanation,
    question_type: questionType,
    question_difficulty: difficulty,
    options
  }
}

const mapExamQuestionsToQuestions = (examQuestions = []) => {
  if (!Array.isArray(examQuestions)) return []
  return examQuestions.map((eq, index) => ({
    id: eq.question ?? eq.question_id ?? eq.id ?? index + 1,
    order: eq.order ?? index + 1,
    content: eq.question_content ?? eq.content ?? '',
    explanation: eq.question_explanation ?? eq.explanation ?? null,
    type: eq.question_type ?? eq.type ?? null,
    difficulty: eq.question_difficulty ?? eq.difficulty ?? null,
    subject: eq.question_subject ?? eq.subject ?? null,
    category: eq.question_category ?? eq.category ?? null,
    points: eq.points ?? null,
    options: normalizeOptions(eq.options || [])
  }))
}

const normalizeExamDetail = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const sourceQuestions = Array.isArray(raw.exam_questions)
    ? raw.exam_questions
    : (Array.isArray(raw.questions) ? raw.questions : [])
  const examQuestions = sourceQuestions.map((item, index) => normalizeExamQuestion(item, index))
  const questions = Array.isArray(raw.questions)
    ? raw.questions
    : mapExamQuestionsToQuestions(examQuestions)

  return {
    ...raw,
    exam_questions: examQuestions,
    questions
  }
}

const normalizeExamList = (list = []) => {
  if (!Array.isArray(list)) return []
  return list.map((exam) => {
    if (!exam || typeof exam !== 'object') return exam
    if (exam.question_count !== undefined && exam.question_count !== null) return exam
    const rawCount = Array.isArray(exam.exam_question)
      ? exam.exam_question[0]?.count
      : exam.exam_question?.count
    if (rawCount === undefined) return exam
    return {
      ...exam,
      question_count: rawCount
    }
  })
}

const applyPagination = (list = [], params = {}) => {
  const page = toNumber(params.page ?? params.p_page) ?? 1
  const pageSize = toNumber(params.page_size ?? params.pageSize ?? params.p_page_size)
  if (!pageSize) {
    return list
  }

  const start = (page - 1) * pageSize
  return {
    results: list.slice(start, start + pageSize),
    count: list.length,
    page,
    page_size: pageSize
  }
}

const requireUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('隢??餃')
  return user
}

const examService = {
  // Get all available exams (published + user's own)
  async getExams(params = {}) {
    const { data, error } = await supabase.rpc('get_practice_exams')
    if (error) throw new Error(error.message)
    const list = normalizeExamList(data || [])
    const paged = applyPagination(list, params)
    return { data: paged }
  },

  // Get user's own exams only
  async getUserExams(params = {}) {
    const { data, error } = await supabase.rpc('get_user_exams')
    if (error) throw new Error(error.message)
    const list = normalizeExamList(data || [])
    const paged = applyPagination(list, params)
    return { data: paged }
  },

  // Get exam detail with questions
  async getExam(examId) {
    const { data, error } = await supabase.rpc('get_exam_detail', {
      p_id: toNumber(examId)
    })
    if (error) throw new Error(error.message)
    return { data: data ? normalizeExamDetail(data) : null }
  },

  // Create new exam (table fallback: no RPC available)
  async createExam(examData = {}) {
    const user = await requireUser()
    const payload = {
      name: examData.name,
      description: examData.description || ''
    }

    if (Number.isFinite(Number(examData.time_limit))) {
      payload.time_limit = Number(examData.time_limit)
    } else if (Number.isFinite(Number(examData.timeLimit))) {
      payload.time_limit = Number(examData.timeLimit)
    }

    if (examData.publish !== undefined) {
      payload.publish = Boolean(examData.publish)
    }

    payload.creator = user.id

    const { data, error } = await supabase.from('exam').insert(payload).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  // Update exam (table fallback: no RPC available)
  async updateExam(examId, examData = {}) {
    const payload = {}
    if (examData.name !== undefined) payload.name = examData.name
    if (examData.description !== undefined) payload.description = examData.description
    if (examData.time_limit !== undefined || examData.timeLimit !== undefined) {
      const timeLimit = examData.time_limit ?? examData.timeLimit
      if (Number.isFinite(Number(timeLimit))) {
        payload.time_limit = Number(timeLimit)
      }
    }
    if (examData.publish !== undefined) payload.publish = Boolean(examData.publish)

    const { data, error } = await supabase.from('exam')
      .update(payload)
      .eq('id', toNumber(examId))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { data }
  },

  // Delete exam (table fallback: no RPC available)
  async deleteExam(examId) {
    const { error } = await supabase.from('exam').delete().eq('id', toNumber(examId))
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Add question to exam (table fallback: no RPC available)
  async addQuestionToExam(examId, data = {}) {
    const questionId = toNumber(data.question_id ?? data.question ?? data.questionId)
    if (!questionId) throw new Error('question_id is required')

    const order = Number.isFinite(Number(data.order)) ? Number(data.order) : 1
    const points = Number.isFinite(Number(data.points)) ? Number(data.points) : 1

    const { error } = await supabase.from('exam_question').insert({
      exam_id: toNumber(examId),
      question_id: questionId,
      order,
      points
    })
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Update exam question settings (table fallback: no RPC available)
  async updateExamQuestion(examId, data = {}) {
    const examQuestionId = toNumber(data.exam_question_id ?? data.id)
    if (!examQuestionId) throw new Error('exam_question_id is required')

    const payload = {}
    if (data.order !== undefined) payload.order = data.order
    if (data.points !== undefined) payload.points = data.points

    let query = supabase.from('exam_question').update(payload).eq('id', examQuestionId)
    if (examId) {
      query = query.eq('exam_id', toNumber(examId))
    }
    const { error } = await query
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Remove question from exam (table fallback: no RPC available)
  async removeQuestionFromExam(examId, examQuestionId) {
    let query = supabase.from('exam_question').delete().eq('id', toNumber(examQuestionId))
    if (examId) {
      query = query.eq('exam_id', toNumber(examId))
    }
    const { error } = await query
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Get practice exams (same as getExams)
  async getPracticeExams(params = {}) {
    return this.getExams(params)
  },

  // Get historical exams (fallback to list + filter by year)
  async getHistoricalExams(params = {}) {
    const res = await this.getExams()
    const list = Array.isArray(res.data) ? res.data : (res.data?.results || [])
    let filtered = list
    if (params.year) {
      const yearNum = toNumber(params.year)
      if (yearNum) {
        filtered = list.filter((exam) => {
          const createdAt = exam?.created_at ? new Date(exam.created_at) : null
          return createdAt && createdAt.getFullYear() === yearNum
        })
      }
    }
    const paged = applyPagination(filtered, params)
    return { data: paged }
  },

  // Start exam (returns exam detail)
  async startExam(examId) {
    return this.getExam(examId)
  },

  // Save exam result
  async saveExamResult(resultData = {}) {
    const { data, error } = await supabase.rpc('save_exam_result', {
      p_exam_id: resultData.exam_id ?? null,
      p_exam_name: resultData.exam_name || '',
      p_score: resultData.score || 0,
      p_correct_count: resultData.correct_count || 0,
      p_total_count: resultData.total_count || 0,
      p_duration_seconds: resultData.duration_seconds || null,
      p_answers_json: resultData.answers || null,
      p_wrong_question_ids: resultData.wrong_question_ids || null
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Get exam results
  async getExamResults() {
    const { data, error } = await supabase.rpc('get_exam_results')
    if (error) throw new Error(error.message)
    return { data: data || [] }
  },

  // Get exam stats (aggregated from results)
  async getExamStats() {
    const { data, error } = await supabase.rpc('get_user_analytics')
    if (error) throw new Error(error.message)
    return { data }
  },

  // Get wrong questions
  async getWrongQuestions() {
    const { data, error } = await supabase.rpc('get_wrong_questions')
    if (error) throw new Error(error.message)
    return { data: data || [] }
  },

  // Mark wrong question as reviewed (table fallback: no RPC available)
  async markWrongQuestionReviewed(id, reviewed = true) {
    const { error } = await supabase.from('wrong_question')
      .update({ reviewed })
      .eq('id', toNumber(id))
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Delete wrong question record (table fallback: no RPC available)
  async deleteWrongQuestion(id) {
    const { error } = await supabase.from('wrong_question').delete().eq('id', toNumber(id))
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Record practice answer (table fallback: no RPC available)
  async recordAnswer(payload = {}) {
    const user = await requireUser()
    const questionId = toNumber(payload.question ?? payload.question_id)
    if (!questionId) throw new Error('question_id is required')

    if (payload.is_correct) {
      return { success: true }
    }

    const { data: existing, error: fetchError } = await supabase.from('wrong_question')
      .select('id, wrong_count')
      .match({ user_id: user.id, question_id: questionId })
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (existing) {
      const { error: updateError } = await supabase.from('wrong_question')
        .update({
          wrong_count: (existing.wrong_count || 0) + 1,
          last_wrong_at: new Date().toISOString(),
          reviewed: false
        })
        .eq('id', existing.id)
      if (updateError) throw new Error(updateError.message)
    } else {
      const { error: insertError } = await supabase.from('wrong_question').insert({
        user_id: user.id,
        question_id: questionId,
        wrong_count: 1,
        last_wrong_at: new Date().toISOString(),
        reviewed: false
      })
      if (insertError) throw new Error(insertError.message)
    }

    return { success: true }
  },

  // Get bookmarks
  async getBookmarks() {
    const { data, error } = await supabase.rpc('get_bookmarks')
    if (error) throw new Error(error.message)
    return { data: data || [] }
  },

  // Add bookmark (table fallback: no RPC available)
  async addBookmark(questionIds) {
    const user = await requireUser()
    const ids = Array.isArray(questionIds) ? questionIds : [questionIds]
    const inserts = ids
      .map((qid) => toNumber(qid))
      .filter((qid) => qid !== null)
      .map((qid) => ({ user_id: user.id, question_id: qid }))

    if (inserts.length === 0) return { success: true }

    const { error } = await supabase.from('bookmark')
      .upsert(inserts, { onConflict: 'user_id,question_id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Remove bookmark (table fallback: no RPC available)
  async removeBookmark(questionId) {
    const user = await requireUser()
    const { error } = await supabase.from('bookmark')
      .delete()
      .match({ user_id: user.id, question_id: toNumber(questionId) })
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // Create custom exam from question list (table fallback: no RPC available)
  async createCustomExam({ name, questionIds, timeLimit } = {}) {
    const user = await requireUser()
    const payload = {
      name,
      creator: user.id,
      publish: false
    }
    if (Number.isFinite(Number(timeLimit))) {
      payload.time_limit = Number(timeLimit)
    }

    const { data: exam, error: examError } = await supabase.from('exam')
      .insert(payload)
      .select()
      .single()
    if (examError) throw new Error(examError.message)

    const ids = Array.isArray(questionIds) ? questionIds : []
    const inserts = ids
      .map((qid) => toNumber(qid))
      .filter((qid) => qid !== null)
      .map((qid, idx) => ({
        exam_id: exam.id,
        question_id: qid,
        order: idx + 1,
        points: 1
      }))

    if (inserts.length > 0) {
      const { error: qError } = await supabase.from('exam_question').insert(inserts)
      if (qError) throw new Error(qError.message)
    }

    return { data: exam }
  },

  // Get exams that include a given question (table fallback: no RPC available)
  async getExamsByQuestion(questionId) {
    const qId = toNumber(questionId)
    if (!qId) return { data: [] }

    const { data: links, error } = await supabase.from('exam_question')
      .select('exam_id')
      .eq('question_id', qId)
    if (error) throw new Error(error.message)

    const examIds = Array.from(new Set((links || []).map((row) => row.exam_id).filter(Boolean)))
    if (examIds.length === 0) return { data: [] }

    const { data: exams, error: examError } = await supabase.from('exam')
      .select('*, exam_question(count)')
      .in('id', examIds)
      .order('created_at', { ascending: false })
    if (examError) throw new Error(examError.message)

    return { data: normalizeExamList(exams || []) }
  },

  // Get exams that include any of the given questions (table fallback: no RPC available)
  async getExamsByQuestions(questionIds = []) {
    const ids = (Array.isArray(questionIds) ? questionIds : [questionIds])
      .map((id) => toNumber(id))
      .filter((id) => id !== null)

    if (ids.length === 0) return { data: [] }

    const { data: links, error } = await supabase.from('exam_question')
      .select('exam_id')
      .in('question_id', ids)
    if (error) throw new Error(error.message)

    const examIds = Array.from(new Set((links || []).map((row) => row.exam_id).filter(Boolean)))
    if (examIds.length === 0) return { data: [] }

    const { data: exams, error: examError } = await supabase.from('exam')
      .select('*, exam_question(count)')
      .in('id', examIds)
      .order('created_at', { ascending: false })
    if (examError) throw new Error(examError.message)

    return { data: normalizeExamList(exams || []) }
  },

  // Get trends (from exam results)
  async getTrends() {
    const { data, error } = await supabase.rpc('get_exam_results')
    if (error) throw new Error(error.message)
    return { data: data || [] }
  }
}

export default examService
