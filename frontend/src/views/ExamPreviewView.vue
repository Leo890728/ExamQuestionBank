<template>
  <div class="exam-preview-container">
    <!-- Error Boundary Wrapper -->
    <ErrorBoundary
      ref="errorBoundaryRef"
      :recoverable="true"
      @retry="handleRetry"
      @error-captured="handleErrorCaptured"
    >
      <!-- Loading State -->
      <ExamPreloader
        v-if="isLoading && !exam"
        :is-loading="true"
        loading-text="Loading exam..."
        :on-retry="handleRetry"
      />

      <!-- Error State -->
      <ExamPreloader
        v-else-if="error && !exam"
        :is-loading="false"
        :error="error"
        :on-retry="handleRetry"
      />

      <!-- Exam Content -->
      <div v-else-if="exam" class="exam-preview">
        <!-- Exam Header (Preview Mode) -->
        <ExamHeader v-if="!isQuizActive && !showResults" :exam="normalizedExam">
          <template #actions>
            <button
              class="btn btn-primary"
              @click="handleStartExam"
              :disabled="starting"
              aria-label="Start exam"
            >
              {{ starting ? '準備中…' : '開始測驗' }}
            </button>
          </template>
        </ExamHeader>

        <!-- Quiz Message -->
        <div v-if="quizMessage" class="quiz-message" role="alert" aria-live="polite">
          {{ quizMessage }}
        </div>

        <!-- Testing Interface (Active Quiz) -->
        <section
          v-if="isQuizActive"
          class="testing-interface"
          role="main"
          aria-label="Exam testing interface"
          @keydown="handleKeyboardNavigation"
        >
          <div class="testing-header">
            <div class="testing-info">
              <strong>作答模式</strong>
              <span>第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 題</span>
            </div>
            <TimerComponent
              v-if="exam.time_limit"
              :time-limit="timeLimit"
              :is-active="isQuizActive"
              @time-warning="handleTimeWarning"
              @time-critical="handleTimeCritical"
              @time-expired="handleTimeExpired"
              ref="timerRef"
            />
          </div>

          <div class="testing-content">
            <div class="testing-sidebar">
              <QuestionNavigator
                :questions="normalizedQuestions"
                :current-index="currentQuestionIndex"
                :answered-questions="answeredQuestionsSet"
                :flagged-questions="flaggedQuestions"
                @navigate-to="navigateToQuestion"
              />
              <ProgressTracker
                :answered-questions="answeredQuestionsSet"
                :total-questions="totalQuestions"
              />
            </div>

            <div class="testing-main">
              <QuestionDisplay
                v-if="currentQuestion"
                :question="normalizedCurrentQuestion"
                :question-number="currentQuestionIndex + 1"
                :selected-answer="userAnswers[currentQuestionIndex]"
                @select-answer="selectAnswer"
              />

              <div class="quiz-actions" role="group" aria-label="Question navigation actions">
                <button
                  class="btn"
                  @click="prevQuestion"
                  :disabled="currentQuestionIndex === 0"
                  aria-label="Previous question"
                >
                  上一題
                </button>
                <button
                  class="btn"
                  :class="{ 'btn-flagged': isCurrentQuestionFlagged }"
                  @click="toggleFlag"
                  aria-label="Flag question for review"
                >
                  <i class="bi" :class="isCurrentQuestionFlagged ? 'bi-flag-fill' : 'bi-flag'"></i>
                  {{ isCurrentQuestionFlagged ? '取消標記' : '標記' }}
                </button>
                <button
                  class="btn"
                  @click="nextQuestion"
                  :disabled="currentQuestionIndex === totalQuestions - 1"
                  aria-label="Next question"
                >
                  下一題
                </button>
                <button
                  class="btn btn-secondary"
                  @click="handleSubmitExam"
                  aria-label="Submit exam"
                >
                  提交答案
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Results Panel -->
        <section
          v-if="showResults && examResults"
          class="results-panel"
          role="main"
          aria-label="Exam results"
        >
          <ScoreDisplay
            :results="normalizedResults"
            :exam-name="exam.name"
            :show-metadata="true"
          />

          <ResultsBreakdown
            :results="normalizedResults"
            :show-explanations="showExplanations"
            :show-actions="true"
            @toggle-explanations="toggleExplanations"
            @review-incorrect="reviewIncorrectQuestions"
          />

          <ResultsActions
            :results="normalizedResultsForActions"
            :exam-name="exam.name"
            @retake-exam="handleRetakeExam"
            @return-to-list="handleReturnToList"
            @questions-bookmarked="handleQuestionsBookmarked"
            @flashcards-created="handleFlashcardsCreated"
          />
        </section>

        <!-- Question List (Preview Mode) -->
        <div v-if="!isQuizActive && !showResults" class="question-list">
          <article
            v-for="question in exam.exam_questions"
            :key="question.id"
            class="question-card"
            tabindex="0"
          >
            <header>
              <span class="order">第 {{ question.order }} 題</span>
              <span class="points" v-if="question.points">{{ question.points }} 分</span>
            </header>
            <p class="content">{{ question.question_content }}</p>
            <div class="question-meta">
              <span>{{ question.question_subject || '未分類' }}</span>
              <span>{{ question.question_category || '未分類' }}</span>
            </div>
          </article>
        </div>

        <!-- Footer Actions (Preview Mode) -->
        <footer v-if="!isQuizActive && !showResults" class="actions">
          <button class="btn" @click="handleGoBack" aria-label="Go back">返回</button>
        </footer>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state" role="status" aria-live="polite">
        <p>{{ errorMessage || '載入考卷中...' }}</p>
      </div>
    </ErrorBoundary>

    <!-- Navigation Warning Modal -->
    <div
      v-if="showNavigationWarning"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-title"
    >
      <div class="modal-content">
        <h3 id="warning-title">離開測驗？</h3>
        <p>您的作答進度將會被保存，但計時器會繼續計時。確定要離開嗎？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="cancelNavigation">取消</button>
          <button class="btn btn-primary" @click="confirmNavigation">確定離開</button>
        </div>
      </div>
    </div>

    <!-- Submission Error Modal -->
    <div
      v-if="showSubmissionError"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-error-title"
    >
      <div class="modal-content error-modal">
        <h3 id="submission-error-title">提交失敗</h3>
        <p>{{ submissionErrorMessage }}</p>
        <p class="error-hint">您的答案已保存在本地，可以重新提交。</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="dismissSubmissionError">稍後再試</button>
          <button class="btn btn-primary" @click="retrySubmission">重新提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useExamStore } from '@/stores/examStore'
import questionService from '@/services/questionService'

// Import components
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamPreloader from '@/components/exam/ExamPreloader.vue'
import TimerComponent from '@/components/exam/TimerComponent.vue'
import QuestionNavigator from '@/components/exam/QuestionNavigator.vue'
import ProgressTracker from '@/components/exam/ProgressTracker.vue'
import QuestionDisplay from '@/components/exam/QuestionDisplay.vue'
import ScoreDisplay from '@/components/exam/ScoreDisplay.vue'
import ResultsBreakdown from '@/components/exam/ResultsBreakdown.vue'
import ResultsActions from '@/components/exam/ResultsActions.vue'
import ErrorBoundary from '@/components/exam/ErrorBoundary.vue'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

// Local state
const exam = ref(null)
const errorMessage = ref('')
const error = ref(null)
const starting = ref(false)
const isQuizActive = ref(false)
const currentQuestionIndex = ref(0)
const quizMessage = ref('')
const userAnswers = ref({})
const questionDetails = ref({})
const showResults = ref(false)
const examResults = ref(null)
const startTime = ref(null)
const isLoading = ref(false)
const showExplanations = ref(false)
const showNavigationWarning = ref(false)
const pendingNavigation = ref(null)
const timerRef = ref(null)
const errorBoundaryRef = ref(null)
const showSubmissionError = ref(false)
const submissionErrorMessage = ref('')
const flaggedQuestions = ref(new Set())

// Computed properties
const totalQuestions = computed(() => exam.value?.exam_questions?.length || 0)

const timeLimit = computed(() => {
  if (!exam.value?.time_limit) return 30 * 60 // Default 30 minutes
  return exam.value.time_limit * 60 // Convert minutes to seconds
})

const currentQuestion = computed(() => {
  if (!exam.value) return null
  return exam.value.exam_questions[currentQuestionIndex.value] || null
})

const currentQuestionOptions = computed(() => {
  if (!currentQuestion.value) return []
  const qId = currentQuestion.value.question
  return questionDetails.value[qId]?.options || []
})

const answeredQuestionsSet = computed(() => {
  return new Set(Object.keys(userAnswers.value).map(Number))
})

const isCurrentQuestionFlagged = computed(() => {
  return flaggedQuestions.value.has(currentQuestionIndex.value)
})

// Normalize exam data for ExamHeader component
const normalizedExam = computed(() => {
  if (!exam.value) return null
  return {
    name: exam.value.name,
    description: exam.value.description,
    timeLimit: exam.value.time_limit,
    questions: exam.value.exam_questions || []
  }
})

// Normalize questions for QuestionNavigator
const normalizedQuestions = computed(() => {
  if (!exam.value?.exam_questions) return []
  return exam.value.exam_questions.map((eq, index) => ({
    id: eq.id || eq.question,
    order: eq.order || index + 1,
    content: eq.question_content,
    subject: eq.question_subject,
    category: eq.question_category
  }))
})

// Normalize current question for QuestionDisplay
const normalizedCurrentQuestion = computed(() => {
  if (!currentQuestion.value) return null
  const qId = currentQuestion.value.question
  const details = questionDetails.value[qId]
  
  return {
    id: currentQuestion.value.id || qId,
    order: currentQuestion.value.order,
    content: currentQuestion.value.question_content,
    options: details?.options?.map(opt => ({
      id: opt.id,
      content: opt.content,
      isCorrect: opt.is_correct
    })) || [],
    subject: currentQuestion.value.question_subject,
    category: currentQuestion.value.question_category
  }
})

// Normalize results for ScoreDisplay and ResultsBreakdown
const normalizedResults = computed(() => {
  if (!examResults.value) return null
  return {
    examId: exam.value?.id?.toString() || '',
    score: examResults.value.score,
    correctCount: examResults.value.correct,
    totalCount: examResults.value.total,
    percentage: Math.round((examResults.value.correct / examResults.value.total) * 100),
    duration: examResults.value.duration || 0,
    details: examResults.value.details || [],
    wrongQuestionIds: examResults.value.wrongQuestionIds || []
  }
})

// Normalize results for ResultsActions (needs string examId)
const normalizedResultsForActions = computed(() => {
  if (!normalizedResults.value) return null
  return {
    ...normalizedResults.value,
    examId: exam.value?.id?.toString() || ''
  }
})

// Methods
const loadExam = async () => {
  isLoading.value = true
  error.value = null
  errorMessage.value = ''
  
  try {
    const { data } = await examStore.getExam(route.params.id)
    exam.value = data
    await loadAllQuestionDetails()
    
    // Try to restore state from localStorage
    restoreExamState()
  } catch (err) {
    const friendlyError = createUserFriendlyError(err)
    error.value = friendlyError.message
    errorMessage.value = friendlyError.message
  } finally {
    isLoading.value = false
  }
}

const loadAllQuestionDetails = async () => {
  if (!exam.value) return
  
  const loadPromises = exam.value.exam_questions.map(async (eq) => {
    if (!eq.question) return
    try {
      const { data } = await questionService.getQuestion(eq.question)
      questionDetails.value[eq.question] = data
    } catch (err) {
      console.error(`Failed to load question ${eq.question}`, err)
    }
  })
  
  await Promise.all(loadPromises)
}

const handleStartExam = async () => {
  if (!exam.value || starting.value) return
  
  starting.value = true
  quizMessage.value = ''
  userAnswers.value = {}
  showResults.value = false
  
  try {
    await examStore.startExam(exam.value.id)
    launchQuiz()
  } catch (err) {
    const friendlyError = createUserFriendlyError(err)
    errorMessage.value = friendlyError.message
    quizMessage.value = friendlyError.message
  } finally {
    starting.value = false
  }
}

const launchQuiz = () => {
  isQuizActive.value = true
  currentQuestionIndex.value = 0
  startTime.value = Date.now()
  persistExamState()
}

const selectAnswer = (optionId) => {
  if (!isQuizActive.value) return
  userAnswers.value[currentQuestionIndex.value] = optionId
  persistExamState()
}

const navigateToQuestion = (index) => {
  if (index >= 0 && index < totalQuestions.value) {
    currentQuestionIndex.value = index
    persistExamState()
  }
}

const nextQuestion = () => {
  if (!exam.value) return
  currentQuestionIndex.value = Math.min(
    currentQuestionIndex.value + 1,
    totalQuestions.value - 1
  )
  persistExamState()
}

const prevQuestion = () => {
  currentQuestionIndex.value = Math.max(currentQuestionIndex.value - 1, 0)
  persistExamState()
}

const toggleFlag = () => {
  const index = currentQuestionIndex.value
  const newFlagged = new Set(flaggedQuestions.value)
  if (newFlagged.has(index)) {
    newFlagged.delete(index)
  } else {
    newFlagged.add(index)
  }
  flaggedQuestions.value = newFlagged
  persistExamState()
}

const handleSubmitExam = async () => {
  if (!confirm('確定要提交答案嗎？')) return
  await submitExam(false)
}

const submitExam = async (autoSubmit = false) => {
  // Stop timer
  if (timerRef.value) {
    timerRef.value.stopTimer()
  }
  
  isQuizActive.value = false
  
  let correct = 0
  const total = totalQuestions.value
  const results = []
  const wrongQuestionIds = []
  
  exam.value.exam_questions.forEach((eq, index) => {
    const qId = eq.question
    const questionData = questionDetails.value[qId]
    
    if (!questionData) {
      results.push({
        questionId: qId,
        question: eq.question_content,
        isCorrect: false,
        userAnswer: null,
        correctAnswer: null
      })
      wrongQuestionIds.push(qId)
      return
    }
    
    const userAnswerId = userAnswers.value[index]
    const correctOption = questionData.options.find(opt => opt.is_correct)
    const userOption = questionData.options.find(opt => opt.id === userAnswerId)
    
    const isCorrect = correctOption && userAnswerId === correctOption.id
    if (isCorrect) {
      correct++
    } else {
      wrongQuestionIds.push(qId)
    }
    
    results.push({
      questionId: qId,
      question: eq.question_content,
      isCorrect,
      userAnswer: userOption?.content || '未作答',
      correctAnswer: correctOption?.content || '無正確答案'
    })
  })
  
  const score = Math.round((correct / total) * 100)
  const durationSeconds = startTime.value
    ? Math.round((Date.now() - startTime.value) / 1000)
    : null
  
  examResults.value = {
    correct,
    total,
    score,
    details: results,
    wrongQuestionIds,
    duration: durationSeconds
  }
  
  // Show results immediately (don't wait for backend)
  showResults.value = true
  quizMessage.value = autoSubmit ? '時間到！測驗已自動提交' : '測驗已提交'
  
  // Save results to backend in background (non-blocking)
  saveResultsToBackend(score, correct, total, durationSeconds, wrongQuestionIds)
}

// Separate function to save results to backend (non-blocking)
const saveResultsToBackend = async (score, correct, total, durationSeconds, wrongQuestionIds) => {
  try {
    await examStore.saveExamResult({
      exam_id: exam.value.id,
      score,
      correct_count: correct,
      total_count: total,
      duration_seconds: durationSeconds,
      wrong_question_ids: wrongQuestionIds
    })
    // Clear persisted state after successful submission
    clearPersistedState()
  } catch (err) {
    console.error('Failed to save exam result:', err)
    // Show submission error modal but results are already shown
    const friendlyError = createUserFriendlyError(err)
    submissionErrorMessage.value = friendlyError.message
    showSubmissionError.value = true
    // Keep the state persisted for retry
  }
}

// Retry submission
const retrySubmission = async () => {
  showSubmissionError.value = false
  
  if (!examResults.value) return
  
  try {
    await examStore.saveExamResult({
      exam_id: exam.value.id,
      score: examResults.value.score,
      correct_count: examResults.value.correct,
      total_count: examResults.value.total,
      duration_seconds: examResults.value.duration,
      wrong_question_ids: examResults.value.wrongQuestionIds
    })
    clearPersistedState()
    quizMessage.value = '成績已成功保存'
  } catch (err) {
    const friendlyError = createUserFriendlyError(err)
    submissionErrorMessage.value = friendlyError.message
    showSubmissionError.value = true
  }
}

const dismissSubmissionError = () => {
  showSubmissionError.value = false
}

// Timer event handlers
const handleTimeWarning = (timeLeft) => {
  console.log('Time warning:', timeLeft, 'seconds remaining')
}

const handleTimeCritical = (timeLeft) => {
  console.log('Time critical:', timeLeft, 'seconds remaining')
}

const handleTimeExpired = () => {
  submitExam(true)
}

// Results actions handlers
const handleRetakeExam = () => {
  showResults.value = false
  examResults.value = null
  userAnswers.value = {}
  quizMessage.value = ''
  handleStartExam()
}

const handleReturnToList = () => {
  router.back()
}

const handleGoBack = () => {
  router.back()
}

const handleQuestionsBookmarked = ({ questionIds, count }) => {
  console.log(`Bookmarked ${count} questions:`, questionIds)
}

const handleFlashcardsCreated = ({ flashcards, count }) => {
  console.log(`Created ${count} flashcards:`, flashcards)
}

const toggleExplanations = () => {
  showExplanations.value = !showExplanations.value
}

const reviewIncorrectQuestions = () => {
  // Navigate to first incorrect question in results
  const firstIncorrect = examResults.value?.details?.findIndex(d => !d.isCorrect)
  if (firstIncorrect !== undefined && firstIncorrect >= 0) {
    // Scroll to that question in the breakdown
    const element = document.querySelector(`[data-question-index="${firstIncorrect}"]`)
    element?.scrollIntoView({ behavior: 'smooth' })
  }
}

// Keyboard navigation
const handleKeyboardNavigation = (event) => {
  if (!isQuizActive.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      if (!event.target.closest('button')) {
        prevQuestion()
      }
      break
    case 'ArrowRight':
      if (!event.target.closest('button')) {
        nextQuestion()
      }
      break
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      const optionIndex = parseInt(event.key) - 1
      const options = currentQuestionOptions.value
      if (options[optionIndex]) {
        selectAnswer(options[optionIndex].id)
      }
      break
  }
}

// State persistence
const persistExamState = () => {
  try {
    const state = {
      examId: exam.value?.id,
      userAnswers: userAnswers.value,
      currentQuestionIndex: currentQuestionIndex.value,
      isQuizActive: isQuizActive.value,
      startTime: startTime.value,
      flaggedQuestions: Array.from(flaggedQuestions.value),
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('exam-preview-state', JSON.stringify(state))
  } catch (err) {
    console.warn('Failed to persist exam state:', err)
  }
}

const restoreExamState = () => {
  try {
    const savedState = localStorage.getItem('exam-preview-state')
    if (!savedState) return
    
    const state = JSON.parse(savedState)
    
    // Only restore if same exam and recent (within 24 hours)
    if (state.examId !== exam.value?.id) {
      clearPersistedState()
      return
    }
    
    const savedTime = new Date(state.timestamp)
    const hoursDiff = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff >= 24) {
      clearPersistedState()
      return
    }
    
    // Restore state
    userAnswers.value = state.userAnswers || {}
    currentQuestionIndex.value = state.currentQuestionIndex || 0
    isQuizActive.value = state.isQuizActive || false
    startTime.value = state.startTime || null
    flaggedQuestions.value = new Set(state.flaggedQuestions || [])
    
    if (isQuizActive.value) {
      quizMessage.value = '已恢復上次的作答進度'
    }
  } catch (err) {
    console.warn('Failed to restore exam state:', err)
    clearPersistedState()
  }
}

const clearPersistedState = () => {
  try {
    localStorage.removeItem('exam-preview-state')
  } catch (err) {
    console.warn('Failed to clear persisted state:', err)
  }
}

// Error handling
const createUserFriendlyError = (err) => {
  let message = '發生未預期的錯誤，請稍後再試。'
  let recoverable = true
  
  if (err.name === 'NetworkError' || !navigator.onLine) {
    message = '無法連接到伺服器，請檢查您的網路連線後再試。'
    recoverable = true
  } else if (err.response?.status === 404) {
    message = '找不到此考卷，請確認考卷編號是否正確。'
    recoverable = false
  } else if (err.response?.status === 403) {
    message = '您沒有權限存取此考卷，請聯繫管理員。'
    recoverable = false
  } else if (err.response?.status >= 500) {
    message = '伺服器目前發生問題，請稍後再試。'
    recoverable = true
  }
  
  return { message, recoverable }
}

const handleRetry = () => {
  // Reset error boundary if it exists
  if (errorBoundaryRef.value) {
    errorBoundaryRef.value.reset()
  }
  loadExam()
}

const handleErrorCaptured = ({ error, errorInfo }) => {
  console.error('Error captured by boundary:', error, errorInfo)
}

// Navigation guard
const pendingNavigationTo = ref(null)

const cancelNavigation = () => {
  showNavigationWarning.value = false
  pendingNavigation.value = null
  pendingNavigationTo.value = null
}

const confirmNavigation = () => {
  showNavigationWarning.value = false
  // Save the destination before clearing
  const destination = pendingNavigationTo.value
  pendingNavigation.value = null
  pendingNavigationTo.value = null
  
  // Navigate to the saved destination
  if (destination) {
    // Temporarily disable quiz active to allow navigation
    isQuizActive.value = false
    router.push(destination)
  }
}

// Route leave guard
onBeforeRouteLeave((to, from, next) => {
  if (isQuizActive.value && !pendingNavigationTo.value) {
    showNavigationWarning.value = true
    pendingNavigationTo.value = to.fullPath
    pendingNavigation.value = () => next()
    next(false)
  } else {
    next()
  }
})

// Lifecycle hooks
onMounted(() => {
  loadExam()
  
  // Handle browser refresh/close warning
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const handleBeforeUnload = (event) => {
  if (isQuizActive.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

// Expose for testing
defineExpose({
  exam,
  isQuizActive,
  userAnswers,
  examResults,
  loadExam,
  submitExam,
  examStore
})
</script>

<style scoped>
.exam-preview-container {
  min-height: 100vh;
  background: #f9fafb;
}

.exam-preview {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.quiz-message {
  margin: 16px 0;
  background: #fef3c7;
  color: #92400e;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
}

/* Testing Interface */
.testing-interface {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.testing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.testing-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.testing-info strong {
  color: #1f2937;
  font-size: 16px;
}

.testing-info span {
  color: #6b7280;
  font-size: 14px;
}

.testing-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 500px;
}

.testing-sidebar {
  padding: 16px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
}

.testing-main {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.quiz-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* Results Panel */
.results-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Question List (Preview Mode) */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
}

.question-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.question-card:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.question-card header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #4b5563;
}

.question-card .order {
  font-weight: 600;
}

.question-card .points {
  color: #2563eb;
  font-weight: 500;
}

.question-card .content {
  color: #1f2937;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.question-meta {
  display: flex;
  gap: 12px;
  color: #9ca3af;
  font-size: 13px;
}

/* Footer Actions */
.actions {
  margin-top: 32px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Buttons */
.btn {
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-flagged {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #f97316;
}

.btn-flagged:hover:not(:disabled) {
  background: #ffedd5;
}

.btn i {
  margin-right: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px;
  color: #6b7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
}

.modal-content p {
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Error Modal */
.error-modal h3 {
  color: #dc2626;
}

.error-hint {
  font-size: 14px;
  color: #059669;
  background: #ecfdf5;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .testing-content {
    grid-template-columns: 1fr;
  }
  
  .testing-sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .testing-sidebar > * {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .exam-preview {
    padding: 16px;
  }
  
  .testing-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
  }
  
  .testing-main {
    padding: 16px;
  }
  
  .quiz-actions {
    flex-wrap: wrap;
  }
  
  .quiz-actions .btn {
    flex: 1;
    min-width: 100px;
  }
  
  .question-card {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .exam-preview {
    padding: 12px;
  }
  
  .testing-sidebar {
    flex-direction: column;
  }
  
  .testing-sidebar > * {
    min-width: 100%;
  }
  
  .quiz-actions {
    flex-direction: column;
  }
  
  .quiz-actions .btn {
    width: 100%;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .testing-interface {
    border: 2px solid #1f2937;
  }
  
  .question-card {
    border: 2px solid #1f2937;
  }
  
  .quiz-message {
    border: 2px solid #92400e;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .btn,
  .question-card {
    transition: none;
  }
}

/* Focus Visible */
.btn:focus-visible,
.question-card:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
