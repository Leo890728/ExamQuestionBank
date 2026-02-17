import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questionApi } from '@/api/test/question'

export const useQuestionStore = defineStore('question-v2', () => {
  // ========== 搜尋瀏覽區 ==========
  const questions = ref([])
  const totalCount = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const filters = ref({
    subject: null,
    difficulty: null,
    type: null,
    year: null,
    keyword: '',
    category: null,
    tag_ids: null,
    tag_mode: 'or'
  })
  const loading = ref(false)
  const error = ref(null)

  // --- Computed ---
  const hasFilters = computed(() =>
    Object.entries(filters.value).some(([k, v]) => {
      if (k === 'tag_mode') return false
      if (Array.isArray(v)) return v.length > 0
      return v !== null && v !== ''
    })
  )

  const totalPages = computed(() =>
    Math.ceil(totalCount.value / pageSize.value) || 0
  )

  const paginationState = computed(() => ({
    totalCount: totalCount.value,
    totalPages: totalPages.value,
    hasNext: page.value < totalPages.value,
    hasPrev: page.value > 1
  }))

  // --- Actions ---
  const search = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await questionApi.getQuestions({
        ...filters.value,
        page: page.value,
        page_size: pageSize.value
      })
      questions.value = data?.results || []
      totalCount.value = data?.count || 0
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setFilter = (name, value) => {
    filters.value[name] = value
  }

  const setFilters = (obj) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (k in filters.value) filters.value[k] = v
    })
  }

  const resetFilters = () => {
    filters.value = { subject: null, difficulty: null, type: null, year: null, keyword: '', category: null, tag_ids: null, tag_mode: 'or' }
    page.value = 1
  }

  const goToPage = (n) => {
    page.value = n
    return search()
  }

  const setPageSize = (n) => {
    pageSize.value = n
    page.value = 1
    return search()
  }

  // ========== 編輯追蹤區 (admin) ==========
  const currentQuestion = ref(null)
  const originQuestion = ref(null)
  const editLoading = ref(false)
  const editError = ref(null)

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  const loadQuestion = async (id) => {
    editLoading.value = true
    editError.value = null
    try {
      const data = await questionApi.getQuestionDetail(id)
      if (!data) throw new Error('Question not found')
      currentQuestion.value = data
      originQuestion.value = deepClone(data)
      return data
    } catch (err) {
      editError.value = err.message
      throw err
    } finally {
      editLoading.value = false
    }
  }

  // --- Computed: change detection ---
  const INFO_FIELDS = ['content', 'explanation', 'type', 'difficulty', 'subject', 'category', 'year', 'source']

  const infoChanged = computed(() => {
    if (!currentQuestion.value || !originQuestion.value) return false
    return INFO_FIELDS.some(
      key => currentQuestion.value[key] !== originQuestion.value[key]
    )
  })

  const optionsChanged = computed(() => {
    if (!currentQuestion.value || !originQuestion.value) return false
    return JSON.stringify(currentQuestion.value.options || []) !==
           JSON.stringify(originQuestion.value.options || [])
  })

  const tagsChanged = computed(() => {
    if (!currentQuestion.value || !originQuestion.value) return false
    const currentIds = (currentQuestion.value.tags || []).map(t => t.id).sort()
    const originIds = (originQuestion.value.tags || []).map(t => t.id).sort()
    return JSON.stringify(currentIds) !== JSON.stringify(originIds)
  })

  const hasEditChanges = computed(() =>
    infoChanged.value || optionsChanged.value || tagsChanged.value
  )

  const editChangeSummary = computed(() => {
    const parts = []
    if (infoChanged.value) parts.push('內容已變更')
    if (optionsChanged.value) parts.push('選項已變更')
    if (tagsChanged.value) parts.push('標籤已變更')
    return parts.join(' · ')
  })

  // --- Actions: CRUD ---
  const saveQuestion = async () => {
    if (!hasEditChanges.value || !currentQuestion.value?.id) return
    editLoading.value = true
    editError.value = null
    try {
      const q = currentQuestion.value
      await questionApi.updateQuestion(q.id, {
        content: q.content,
        explanation: q.explanation,
        question_type: q.type,
        difficulty: q.difficulty,
        subject: q.subject,
        category: q.category,
        year: q.year,
        source: q.source,
        options: q.options,
        tag_ids: (q.tags || []).map(t => t.id)
      })
      // Refresh origin
      await loadQuestion(q.id)
    } catch (err) {
      editError.value = err.message
      throw err
    } finally {
      editLoading.value = false
    }
  }

  const discardChanges = () => {
    if (originQuestion.value) {
      currentQuestion.value = deepClone(originQuestion.value)
    }
  }

  const createQuestion = async (payload) => {
    const newId = await questionApi.createQuestion(payload)
    return newId
  }

  const deleteQuestion = async (id) => {
    const result = await questionApi.deleteQuestion(id)
    questions.value = questions.value.filter(q => q.id !== Number(id))
    if (currentQuestion.value?.id === Number(id)) {
      currentQuestion.value = null
      originQuestion.value = null
    }
    return result
  }

  return {
    // 搜尋瀏覽
    questions, totalCount, page, pageSize, filters, loading, error,
    hasFilters, totalPages, paginationState,
    search, setFilter, setFilters, resetFilters, goToPage, setPageSize,
    // 編輯追蹤
    currentQuestion, originQuestion, editLoading, editError,
    loadQuestion, saveQuestion, discardChanges, createQuestion, deleteQuestion,
    infoChanged, optionsChanged, tagsChanged, hasEditChanges, editChangeSummary
  }
})
