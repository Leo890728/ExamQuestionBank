import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { examApi } from '@/api/test/exam'

export const useExamStore = defineStore('exam-v2', () => {
  // ========== 列表區 ==========
  const exams = ref([])
  const listLoading = ref(false)

  const loadExams = async () => {
    listLoading.value = true
    try {
      exams.value = await examApi.getUserExams() || []
    } finally {
      listLoading.value = false
    }
  }

  const loadPracticeExams = async () => {
    listLoading.value = true
    try {
      exams.value = await examApi.getPracticeExams() || []
    } finally {
      listLoading.value = false
    }
  }

  const createExam = async (payload) => {
    const newExam = await examApi.createExam(payload)
    exams.value.push(newExam)
    return newExam
  }

  const deleteExam = async (id) => {
    await examApi.deleteExam(id)
    exams.value = exams.value.filter(e => e.id !== Number(id))
  }

  // ========== 編輯區 ==========
  const examInfo = ref(null)
  const originInfo = ref(null)
  const examQuestions = ref([])
  const originQuestions = ref([])
  const editLoading = ref(false)
  const error = ref(null)

  const loadExam = async (id) => {
    editLoading.value = true
    error.value = null
    try {
      const data = await examApi.getExamDetail(id)
      if (!data) throw new Error('Exam not found')

      examInfo.value = {
        id: data.id,
        name: data.name,
        description: data.description,
        time_limit: data.time_limit,
        publish: data.publish
      }
      originInfo.value = { ...examInfo.value }

      const questions = (data.questions || []).map((q, i) => ({
        ...q,
        exam_question_id: q.exam_question_id ?? null,
        order: q.order ?? i + 1,
        points: q.points ?? 1
      }))
      examQuestions.value = questions
      originQuestions.value = JSON.parse(JSON.stringify(questions))

      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      editLoading.value = false
    }
  }

  const initNewExam = () => {
    examInfo.value = { id: null, name: '', description: '', time_limit: null, publish: false }
    originInfo.value = { ...examInfo.value }
    examQuestions.value = []
    originQuestions.value = []
    error.value = null
  }

  // --- Computed: change detection ---
  const infoChanged = computed(() => {
    if (!originInfo.value || !examInfo.value) return false
    return (
      originInfo.value.name !== examInfo.value.name ||
      originInfo.value.description !== examInfo.value.description ||
      originInfo.value.time_limit !== examInfo.value.time_limit
    )
  })

  const questionChanges = computed(() => {
    const current = examQuestions.value.map(({ id, order, points }) => ({ id, order, points }))
    const originMap = new Map(originQuestions.value.map(q => [q.id, q]))
    const currentMap = new Map(current.map(q => [q.id, q]))

    return {
      addedQuestions: current.filter(q => !originMap.has(q.id)),
      removedQuestions: originQuestions.value.filter(q => !currentMap.has(q.id)),
      orderChanged: current.filter(q => {
        const o = originMap.get(q.id)
        return o && o.order !== q.order
      }),
      scoreChanged: current.filter(q => {
        const o = originMap.get(q.id)
        return o && o.points !== q.points
      })
    }
  })

  const hasChanges = computed(() => {
    const c = questionChanges.value
    return infoChanged.value ||
      c.addedQuestions.length > 0 ||
      c.removedQuestions.length > 0 ||
      c.orderChanged.length > 0 ||
      c.scoreChanged.length > 0
  })

  const unsavedSummary = computed(() => {
    const parts = []
    if (infoChanged.value) parts.push('考卷資訊已變更')
    const c = questionChanges.value
    if (c.addedQuestions.length) parts.push(`新增 ${c.addedQuestions.length} 題`)
    if (c.removedQuestions.length) parts.push(`移除 ${c.removedQuestions.length} 題`)
    if (c.orderChanged.length) parts.push(`${c.orderChanged.length} 題順序變更`)
    if (c.scoreChanged.length) parts.push(`${c.scoreChanged.length} 題分數變更`)
    return parts.join(' · ')
  })

  // --- Actions: question manipulation ---
  const addQuestion = (question) => {
    if (examQuestions.value.some(q => q.id === question.id)) return
    const nextOrder = examQuestions.value.length
      ? Math.max(...examQuestions.value.map(q => q.order)) + 1
      : 1
    examQuestions.value.push({
      ...question,
      order: nextOrder,
      points: question.points ?? 1,
      exam_question_id: null
    })
  }

  const removeQuestion = (questionId) => {
    examQuestions.value = examQuestions.value.filter(q => q.id !== questionId)
  }

  const reorderQuestions = (fromIndex, toIndex) => {
    const list = [...examQuestions.value]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    list.forEach((q, i) => { q.order = i + 1 })
    examQuestions.value = list
  }

  const updateQuestionPoints = (questionId, points) => {
    const q = examQuestions.value.find(q => q.id === questionId)
    if (q && points >= 0) q.points = Number(points)
  }

  const discardChanges = () => {
    if (originInfo.value) {
      examInfo.value = { ...originInfo.value }
    }
    examQuestions.value = JSON.parse(JSON.stringify(originQuestions.value))
  }

  // --- Actions: save ---
  const saveExam = async () => {
    if (!hasChanges.value || !examInfo.value) return
    editLoading.value = true
    error.value = null

    try {
      let eid = examInfo.value.id

      // If no id, create a new exam first
      if (!eid) {
        const newExam = await examApi.createExam({
          name: examInfo.value.name,
          description: examInfo.value.description,
          time_limit: examInfo.value.time_limit
        })
        eid = newExam.id
        examInfo.value.id = eid
        exams.value.push(newExam)
      } else if (infoChanged.value) {
        // 1. Update exam info if changed
        await examApi.updateExam(eid, {
          name: examInfo.value.name,
          description: examInfo.value.description,
          time_limit: examInfo.value.time_limit
        })
      }

      const { addedQuestions, removedQuestions } = questionChanges.value

      // Reindex orders
      examQuestions.value.forEach((q, i) => { q.order = i + 1 })

      // 2. Remove questions
      for (const q of removedQuestions) {
        if (q.exam_question_id) {
          await examApi.removeExamQuestion(eid, q.exam_question_id)
        }
      }

      // 3. Add new questions
      for (const q of addedQuestions) {
        const current = examQuestions.value.find(eq => eq.id === q.id)
        await examApi.addExamQuestion(eid, {
          question_id: q.id,
          order: current?.order ?? q.order,
          points: current?.points ?? q.points ?? 1
        })
      }

      // 4. Batch update existing questions (order + points)
      const existing = examQuestions.value.filter(q => q.exam_question_id)
      if (existing.length > 0) {
        await examApi.batchUpdateExamQuestions(eid, existing.map(q => ({
          exam_question_id: q.exam_question_id,
          order: q.order,
          points: q.points
        })))
      }

      // 5. Refresh from server to get fresh exam_question_ids
      await loadExam(eid)

      // 6. Update list cache if present
      const idx = exams.value.findIndex(e => e.id === Number(eid))
      if (idx !== -1 && examInfo.value) {
        exams.value[idx] = { ...exams.value[idx], ...examInfo.value }
      }

      return eid
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      editLoading.value = false
    }
  }

  return {
    // 列表區
    exams, listLoading,
    loadExams, loadPracticeExams, createExam, deleteExam,

    // 編輯區
    examInfo, examQuestions, editLoading, error,
    loadExam, initNewExam, saveExam, discardChanges,
    addQuestion, removeQuestion, reorderQuestions, updateQuestionPoints,

    // Computed
    infoChanged, questionChanges, hasChanges, unsavedSummary
  }
})
