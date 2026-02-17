import { supabase } from '@/lib/supabase'

const rpc = async (fn, params = {}) => {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) throw new Error(error.message)
  return data
}

export const examApi = {
  getExamDetail: (id) =>
    rpc('get_exam_detail', { p_id: Number(id) }),

  getUserExams: () =>
    rpc('get_user_exams'),

  getPracticeExams: () =>
    rpc('get_practice_exams'),

  createExam: ({ name, description, time_limit, publish }) =>
    rpc('create_exam', {
      p_name: name,
      p_description: description ?? null,
      p_time_limit: time_limit ?? 60,
      p_publish: publish ?? false
    }),

  updateExam: (id, { name, description, time_limit, publish }) =>
    rpc('update_exam', {
      p_id: Number(id),
      p_name: name ?? null,
      p_description: description ?? null,
      p_time_limit: time_limit ?? null,
      p_publish: publish ?? null
    }),

  deleteExam: (id) =>
    rpc('delete_exam', { p_id: Number(id) }),

  addExamQuestion: (examId, { question_id, order, points }) =>
    rpc('add_exam_question', {
      p_exam_id: Number(examId),
      p_question_id: Number(question_id),
      p_order: order ?? 1,
      p_points: points ?? 1
    }),

  removeExamQuestion: (examId, examQuestionId) =>
    rpc('remove_exam_question', {
      p_exam_id: Number(examId),
      p_exam_question_id: Number(examQuestionId)
    }),

  batchUpdateExamQuestions: (examId, updates) =>
    rpc('batch_update_exam_questions', {
      p_exam_id: Number(examId),
      p_updates: updates
    })
}
