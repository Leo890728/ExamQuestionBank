import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import examService from '@/services/examService'
import { ExamModel } from '@/models/Exam'

export const useExamStore = defineStore('exam', () => {
  // State
  const exam = ref(null)
  const currentQuestionIndex = ref(0)
  const userAnswers = ref({})
  const timeLeft = ref(0)
  const isActive = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const results = ref(null)
  const lastSaved = ref(null)

  // Getters
  const currentQuestion = computed(() => {
    if (!exam.value || !exam.value.questions) return null
    return exam.value.questions[currentQuestionIndex.value]
  })

  const answeredQuestions = computed(() => {
    return new Set(Object.keys(userAnswers.value).map(Number))
  })

  const totalQuestions = computed(() => {
    return exam.value?.questions?.length || 0
  })

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return (answeredQuestions.value.size / totalQuestions.value) * 100
  })

  const getExamTimeLimit = (examData) => {
    const limit = examData?.timeLimit ?? examData?.time_limit
    const num = Number(limit)
    return Number.isFinite(num) && num > 0 ? num : null
  }

  const normalizeExamForStore = (raw) => {
    if (!raw) return null
    return ExamModel.fromRpcDetail(raw)
  }

  const findCorrectOption = (options = []) => {
    if (!Array.isArray(options)) return null
    return options.find((opt) => opt?.isCorrect || opt?.is_correct) || null
  }

  // Actions
  const loadExam = async (examId) => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await examService.getExam(examId)
      exam.value = data ? normalizeExamForStore(data) : null
      isLoading.value = false
      return exam.value
    } catch (err) {
      const errorState = createUserFriendlyError(err)
      error.value = errorState.message
      isLoading.value = false
      throw err
    }
  }

  const startExam = async (examId = null) => {
    if (examId) {
      await examService.startExam(examId)
    }

    isActive.value = true
    currentQuestionIndex.value = 0
    userAnswers.value = {}
    results.value = null
    error.value = null

    // Set timer if exam has time limit
    const limit = getExamTimeLimit(exam.value)
    if (limit) {
      timeLeft.value = limit * 60 // Convert minutes to seconds
    } else {
      timeLeft.value = 0
    }
  }

  const handleTimeExpired = async () => {
    // Auto-submit exam when time expires
    try {
      await submitExam()
    } catch (err) {
      console.error('Auto-submission failed:', err)
      // Even if submission fails, prevent further modifications
      isActive.value = false
    }
  }

  const updateTimeLeft = (newTimeLeft) => {
    timeLeft.value = newTimeLeft
    // Persist state when time changes
    persistExamState()
  }

  const selectAnswer = (questionIndex, optionId) => {
    if (!isActive.value) return
    userAnswers.value[questionIndex] = optionId
    
    // Persist to localStorage for recovery with timestamp
    persistExamState()
  }

  const navigateToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions.value) {
      currentQuestionIndex.value = index
    }
  }

  const submitExam = async ({ persist = false } = {}) => {
    try {
      isActive.value = false
      isLoading.value = true
      
      // Calculate comprehensive results
      results.value = calculateExamResults()

      if (persist && exam.value?.id) {
        await examService.saveExamResult({
          exam_id: exam.value.id,
          score: results.value.score,
          correct_count: results.value.correctCount,
          total_count: results.value.totalCount,
          duration_seconds: results.value.duration,
          wrong_question_ids: results.value.wrongQuestionIds
        })
      }
      
      // Clear localStorage after successful submission
      clearPersistedState()
      isLoading.value = false
    } catch (err) {
      const errorState = createUserFriendlyError(err)
      error.value = errorState.message
      isLoading.value = false
      
      // Keep exam active if submission failed
      isActive.value = true
      throw err
    }
  }

  const resetExam = () => {
    exam.value = null
    currentQuestionIndex.value = 0
    userAnswers.value = {}
    timeLeft.value = 0
    isActive.value = false
    isLoading.value = false
    error.value = null
    results.value = null
    lastSaved.value = null
    clearPersistedState()
  }

  const restoreFromStorage = () => {
    try {
      const savedState = localStorage.getItem('exam-state')
      if (savedState) {
        const state = JSON.parse(savedState)
        
        // Only restore if the state is recent (within 24 hours)
        const savedTime = new Date(state.timestamp)
        const now = new Date()
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60)
        
        const sameExam = !state.examId || state.examId === exam.value?.id
        if (hoursDiff < 24 && sameExam) {
          userAnswers.value = state.userAnswers || {}
          currentQuestionIndex.value = state.currentQuestionIndex || 0
          timeLeft.value = state.timeLeft || 0
          isActive.value = state.isActive || false
          lastSaved.value = savedTime
          
          return true // Successfully restored
        } else {
          // Clear old state
          clearPersistedState()
        }
      }
    } catch (err) {
      console.warn('Failed to restore exam state from localStorage:', err)
      clearPersistedState()
    }
    return false // No state restored
  }

  // Helper functions
  const calculateCorrectAnswers = () => {
    if (!exam.value?.questions) return 0
    
    let correct = 0
    exam.value.questions.forEach((question, index) => {
      const userAnswer = userAnswers.value[index]
      const correctOption = findCorrectOption(question.options)
      if (userAnswer === correctOption?.id) {
        correct++
      }
    })
    return correct
  }

  const generateQuestionResults = () => {
    if (!exam.value?.questions) return []
    
    return exam.value.questions.map((question, index) => {
      const userAnswer = userAnswers.value[index]
      const correctOption = findCorrectOption(question.options)
      const userOption = question.options?.find(opt => opt.id === userAnswer)
      
      return {
        questionId: question.id,
        question: question.content,
        userAnswer: userOption?.content || null,
        correctAnswer: correctOption?.content || '',
        isCorrect: userAnswer === correctOption?.id,
        timeSpent: 0 // This would be tracked separately in a real implementation
      }
    })
  }

  const getWrongQuestionIds = () => {
    if (!exam.value?.questions) return []
    
    return exam.value.questions
      .filter((question, index) => {
        const userAnswer = userAnswers.value[index]
        const correctOption = findCorrectOption(question.options)
        return userAnswer !== correctOption?.id
      })
      .map(question => question.id)
  }

  // Enhanced results calculation with comprehensive logic
  const calculateExamResults = () => {
    if (!exam.value?.questions) {
      return {
        examId: exam.value?.id || '',
        score: 0,
        correctCount: 0,
        totalCount: 0,
        percentage: 0,
        duration: 0,
        details: [],
        wrongQuestionIds: []
      }
    }

    const totalCount = exam.value.questions.length
    const correctCount = calculateCorrectAnswers()
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    const limit = getExamTimeLimit(exam.value)
    const duration = limit ? (limit * 60) - timeLeft.value : 0
    const details = generateQuestionResults()
    const wrongQuestionIds = getWrongQuestionIds()

    return {
      examId: exam.value.id,
      score: correctCount,
      correctCount,
      totalCount,
      percentage,
      duration: Math.max(0, duration), // Ensure duration is never negative
      details,
      wrongQuestionIds
    }
  }

  // State persistence helpers
  const persistExamState = () => {
    try {
      const state = {
        examId: exam.value?.id ?? null,
        userAnswers: userAnswers.value,
        currentQuestionIndex: currentQuestionIndex.value,
        timeLeft: timeLeft.value,
        isActive: isActive.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('exam-state', JSON.stringify(state))
      lastSaved.value = new Date()
    } catch (err) {
      console.warn('Failed to persist exam state:', err)
    }
  }

  const clearPersistedState = () => {
    try {
      localStorage.removeItem('exam-state')
      localStorage.removeItem('exam-answers') // Legacy cleanup
      lastSaved.value = null
    } catch (err) {
      console.warn('Failed to clear persisted state:', err)
    }
  }

  // Error handling helper
  const createUserFriendlyError = (error) => {
    let message = 'An unexpected error occurred. Please try again.'
    let type = 'network'
    let recoverable = true

    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      message = 'Unable to connect to the server. Please check your internet connection and try again.'
      type = 'network'
      recoverable = true
    } else if (error.status === 404) {
      message = 'The requested exam could not be found. Please check the exam ID and try again.'
      type = 'data'
      recoverable = false
    } else if (error.status === 403) {
      message = 'You do not have permission to access this exam. Please contact your instructor.'
      type = 'user'
      recoverable = false
    } else if (error.status >= 500) {
      message = 'The server is currently experiencing issues. Please try again in a few minutes.'
      type = 'network'
      recoverable = true
    } else if (error.message && !containsTechnicalTerms(error.message)) {
      // Only show custom error messages that don't contain technical details
      message = error.message
    }

    function containsTechnicalTerms(message) {
      const technicalTerms = [
        'fetch',
        'XMLHttpRequest',
        'TypeError',
        'ReferenceError',
        'undefined is not a function',
        'Cannot read property',
        'stack trace',
        'at Object.',
        'at Function.',
        'webpack',
        'node_modules'
      ]
      
      const lowerMessage = message.toLowerCase()
      return technicalTerms.some(term => lowerMessage.includes(term.toLowerCase()))
    }

    return {
      type,
      message,
      recoverable,
      retryAction: recoverable ? () => loadExam(exam.value?.id) : undefined
    }
  }

  return {
    // State
    exam,
    currentQuestionIndex,
    userAnswers,
    timeLeft,
    isActive,
    isLoading,
    error,
    results,
    lastSaved,
    
    // Getters
    currentQuestion,
    answeredQuestions,
    totalQuestions,
    progress,
    
    // Actions
    loadExam,
    startExam,
    selectAnswer,
    navigateToQuestion,
    submitExam,
    resetExam,
    restoreFromStorage,
    persistExamState,
    clearPersistedState,
    createUserFriendlyError,
    handleTimeExpired,
    updateTimeLeft,
    calculateExamResults,
    // Exam API wrappers (use examService under the hood)
    getExams: (params) => examService.getExams(params),
    getUserExams: (params) => examService.getUserExams(params),
    getExam: (examId) => examService.getExam(examId),
    createExam: (payload) => examService.createExam(payload),
    updateExam: (examId, payload) => examService.updateExam(examId, payload),
    deleteExam: (examId) => examService.deleteExam(examId),
    addQuestionToExam: (examId, payload) => examService.addQuestionToExam(examId, payload),
    updateExamQuestion: (examId, payload) => examService.updateExamQuestion(examId, payload),
    removeQuestionFromExam: (examId, examQuestionId) => examService.removeQuestionFromExam(examId, examQuestionId),
    batchUpdateExamQuestions: (examId, updates) => examService.batchUpdateExamQuestions(examId, updates),
    getPracticeExams: (params) => examService.getPracticeExams(params),
    getHistoricalExams: (params) => examService.getHistoricalExams(params),
    saveExamResult: (payload) => examService.saveExamResult(payload),
    getExamResults: () => examService.getExamResults(),
    getExamStats: () => examService.getExamStats(),
    getWrongQuestions: () => examService.getWrongQuestions(),
    markWrongQuestionReviewed: (id, reviewed) => examService.markWrongQuestionReviewed(id, reviewed),
    deleteWrongQuestion: (id) => examService.deleteWrongQuestion(id),
    recordAnswer: (payload) => examService.recordAnswer(payload),
    getBookmarks: () => examService.getBookmarks(),
    addBookmark: (questionIds) => examService.addBookmark(questionIds),
    removeBookmark: (questionId) => examService.removeBookmark(questionId),
    createCustomExam: (payload) => examService.createCustomExam(payload),
    getExamsByQuestion: (questionId) => examService.getExamsByQuestion(questionId),
    getExamsByQuestions: (questionIds) => examService.getExamsByQuestions(questionIds),
    getTrends: () => examService.getTrends()
  }
})
