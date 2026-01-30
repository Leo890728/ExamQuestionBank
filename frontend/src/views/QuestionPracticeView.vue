<template>
  <div class="split-view-container">
    <!-- Main Content Panel -->
    <div class="main-panel" :style="mainPanelStyle">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>載入題目中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="bi bi-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadQuestions">重試</button>
    </div>

    <!-- Quiz Content -->
    <div v-else-if="questions.length > 0" class="quiz-content">
      <!-- Quiz Header -->
      <div class="quiz-header">
        <div class="quiz-info">
          <button class="btn-back" @click="goBack" title="返回">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="quiz-title">
            <h2>題目練習</h2>
            <span class="quiz-progress">第 {{ currentIndex + 1 }} / {{ questions.length }} 題</span>
          </div>
        </div>
        <div class="quiz-tools">
          <button v-if="showAnswer" class="btn btn-ghost" @click="openAIChat" title="Ask AI">
            <i class="bi bi-robot"></i> Ask AI
          </button>
          <button class="btn btn-secondary" @click="confirmExit">結束練習</button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Question Navigator with Left/Right Arrows -->
      <div v-if="questions.length > 1" class="navigation-section">
        <!-- Left/Right Navigation -->
        <div class="nav-arrows">
          <button 
            class="arrow-btn prev" 
            @click="goToQuestion(currentIndex - 1)"
            :disabled="currentIndex === 0"
            title="上一題"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          
          <div class="question-navigator">
            <button
              v-for="(q, idx) in questions"
              :key="q.id"
              class="nav-btn"
              :class="{
                active: idx === currentIndex,
                answered: answeredQuestions.has(idx),
                correct: results[idx]?.correct,
                wrong: results[idx]?.correct === false
              }"
              @click="goToQuestion(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>
          
          <button 
            class="arrow-btn next" 
            @click="goToQuestion(currentIndex + 1)"
            :disabled="currentIndex === questions.length - 1"
            title="下一題"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        
        <!-- Answer Record Summary -->
        <div class="answer-record">
          <span class="record-label">作答紀錄：</span>
          <span class="record-stat correct">
            <i class="bi bi-check-circle-fill"></i> {{ correctCount }}
          </span>
          <span class="record-stat wrong">
            <i class="bi bi-x-circle-fill"></i> {{ totalCount - correctCount - unansweredCount }}
          </span>
          <span class="record-stat unanswered">
            <i class="bi bi-circle"></i> {{ unansweredCount }}
          </span>
        </div>
      </div>

      <!-- Question Display -->
      <div class="question-panel">
        <div class="question-meta">
          <span v-if="currentQuestion?.subject" class="meta-tag subject">
            {{ currentQuestion.subject }}
          </span>
          <span v-if="currentQuestion?.category" class="meta-tag category">
            {{ currentQuestion.category }}
          </span>
          <span v-if="currentQuestion?.difficulty" class="meta-tag difficulty" :class="currentQuestion.difficulty">
            {{ getDifficultyLabel(currentQuestion.difficulty) }}
          </span>
        </div>

        <div class="question-content">
          <p>{{ currentQuestion?.content }}</p>
        </div>

        <!-- Options -->
        <div class="options-list">
          <div
            v-for="(opt, idx) in currentOptions"
            :key="opt.id"
            class="option-item"
            :class="{
              selected: selectedAnswer === opt.id,
              correct: showAnswer && opt.is_correct,
              wrong: showAnswer && selectedAnswer === opt.id && !opt.is_correct,
              disabled: showAnswer
            }"
            @click="!showAnswer && selectAnswer(opt.id)"
          >
            <span class="option-label">{{ getOptionLabel(idx) }}</span>
            <span class="option-text">{{ opt.content }}</span>
            <span v-if="showAnswer && opt.is_correct" class="option-indicator correct">
              <i class="bi bi-check-circle-fill"></i>
            </span>
            <span v-else-if="showAnswer && selectedAnswer === opt.id && !opt.is_correct" class="option-indicator wrong">
              <i class="bi bi-x-circle-fill"></i>
            </span>
          </div>
        </div>

        <!-- Answer Feedback -->
        <div v-if="showAnswer" class="answer-feedback" :class="isCorrect ? 'correct' : 'wrong'">
          <div class="feedback-header">
            <i :class="isCorrect ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
            <span>{{ isCorrect ? '答對了！' : '答錯了' }}</span>
          </div>
          <p v-if="!isCorrect" class="correct-answer">
            正確答案：{{ correctAnswerText }}
          </p>
          <div v-if="currentQuestion?.explanation" class="explanation">
            <strong>解析：</strong>
            <p>{{ currentQuestion.explanation }}</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="quiz-actions">
        <button
          v-if="!showAnswer"
          class="btn btn-primary btn-lg"
          :disabled="!selectedAnswer"
          @click="checkAnswer"
        >
          確認答案
        </button>
        <template v-else>
          <button 
            class="btn btn-secondary" 
            :class="{ 'btn-flashcard-added': currentInFlashcard }"
            @click="addToFlashcard"
            :disabled="currentInFlashcard"
          >
            <i :class="currentInFlashcard ? 'bi bi-bookmark-check-fill' : 'bi bi-bookmark-plus'"></i>
            {{ currentInFlashcard ? '已加入快閃卡' : '加入快閃卡' }}
          </button>
          <button class="btn btn-primary btn-lg" @click="currentIndex < questions.length - 1 ? nextQuestion() : goBack()">
            {{ currentIndex < questions.length - 1 ? '下一題' : '完成' }}
          </button>
        </template>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="bi bi-question-circle"></i>
      <p>沒有選擇題目進行練習</p>
      <button class="btn btn-primary" @click="goBack">返回選擇題目</button>
    </div>

    <!-- Exit Confirmation Modal -->
    <div v-if="showExitModal" class="modal-overlay" @click.self="showExitModal = false">
      <div class="modal-content">
        <h3>確定要離開嗎？</h3>
        <p>您的練習進度將不會被保存。</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showExitModal = false">繼續練習</button>
          <button class="btn btn-primary" @click="exitPractice">確定離開</button>
        </div>
      </div>
    </div>
    </div>

    <!-- Draggable Divider -->
    <div v-if="isChatOpen" class="split-divider" @mousedown="startDrag" @touchstart="startDrag">
      <div class="divider-handle"></div>
    </div>

    <!-- AI Chat Panel (Split View) -->
    <div v-if="isChatOpen" class="chat-panel-split" :style="chatPanelStyle">
      <div class="chat-panel-header">
        <div class="chat-panel-title">
          <span class="chat-icon">AI</span>
          <span>Ask AI</span>
        </div>
        <button class="btn-close" @click="closeChat" aria-label="關閉">×</button>
      </div>
      <AIChatInterface :prefill="chatPrefill" class="chat-panel-content" />
    </div>

    <!-- Mobile Overlay Background -->
    <div v-if="isChatOpen" class="mobile-overlay" @click="closeChat"></div>

    <!-- Floating Ask AI Button (Draggable) -->
    <button
      v-if="!isChatOpen"
      class="floating-ai-btn"
      :style="floatingBtnStyle"
      @mousedown="startFloatingDrag"
      @touchstart="startFloatingDrag"
      aria-label="Ask AI"
    >
      <svg class="floating-ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Magnifying glass -->
        <circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2"/>
        <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <!-- Sparkles -->
        <path d="M18 4L18.5 5.5L20 6L18.5 6.5L18 8L17.5 6.5L16 6L17.5 5.5L18 4Z" fill="currentColor"/>
        <path d="M4 2L4.35 3L5 3.35L4.35 3.7L4 4.7L3.65 3.7L3 3.35L3.65 3L4 2Z" fill="currentColor"/>
        <path d="M5 14L5.25 14.75L6 15L5.25 15.25L5 16L4.75 15.25L4 15L4.75 14.75L5 14Z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import questionService from '@/services/questionService'
import flashcardService from '@/services/flashcardService'
import { useExamStore } from '@/stores/examStore'
import AIChatInterface from '@/components/AIChatInterface.vue'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

// State
const isLoading = ref(true)
const error = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const currentOptions = ref([])
const selectedAnswer = ref(null)
const showAnswer = ref(false)
const isCorrect = ref(false)
const showResults = ref(false)
const showExitModal = ref(false)
const results = ref({}) // { index: { correct: boolean, selectedAnswer, correctAnswer } }
const answeredQuestions = ref(new Set())
const flashcardStatus = ref(new Set()) // Track which question IDs are in flashcard

// Computed
const currentQuestion = computed(() => questions.value[currentIndex.value])

const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((answeredQuestions.value.size / questions.value.length) * 100)
})

const correctCount = computed(() => {
  return Object.values(results.value).filter(r => r.correct).length
})

const totalCount = computed(() => questions.value.length)

const unansweredCount = computed(() => {
  return totalCount.value - answeredQuestions.value.size
})

const scoreClass = computed(() => {
  const percent = (correctCount.value / totalCount.value) * 100
  if (percent >= 80) return 'high'
  if (percent >= 60) return 'medium'
  return 'low'
})

const correctAnswerText = computed(() => {
  const correct = currentOptions.value.find(o => o.is_correct)
  if (!correct) return ''
  const idx = currentOptions.value.indexOf(correct)
  return `${getOptionLabel(idx)}. ${correct.content}`
})

const currentInFlashcard = computed(() => {
  if (!currentQuestion.value?.id) return false
  return flashcardStatus.value.has(currentQuestion.value.id) || currentQuestion.value.is_in_flashcard
})

// Methods
const getOptionLabel = (idx) => String.fromCharCode(65 + idx) // A, B, C, D...

const getDifficultyLabel = (difficulty) => {
  const labels = { easy: '簡單', medium: '中等', hard: '困難' }
  return labels[difficulty] || difficulty
}

const loadQuestions = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Get question IDs from route query
    const idsParam = route.query.ids
    if (!idsParam) {
      error.value = '未指定題目'
      isLoading.value = false
      return
    }

    const questionIds = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (questionIds.length === 0) {
      error.value = '無效的題目 ID'
      isLoading.value = false
      return
    }

    // Load all questions
    const loadPromises = questionIds.map(async (id) => {
      try {
        const [questionRes, optionsRes] = await Promise.all([
          questionService.getQuestion(id),
          questionService.getQuestionOptions(id)
        ])
        return {
          ...questionRes.data,
          options: optionsRes.data || []
        }
      } catch (e) {
        console.error(`Failed to load question ${id}:`, e)
        return null
      }
    })

    const loadedQuestions = await Promise.all(loadPromises)
    questions.value = loadedQuestions.filter(q => q !== null)

    if (questions.value.length === 0) {
      error.value = '無法載入題目'
      return
    }

    // Load first question options
    currentOptions.value = questions.value[0].options || []

  } catch (e) {
    console.error('Failed to load questions:', e)
    error.value = '載入題目失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

const selectAnswer = (optionId) => {
  selectedAnswer.value = optionId
}

const checkAnswer = async () => {
  if (!selectedAnswer.value) return

  const selected = currentOptions.value.find(o => o.id === selectedAnswer.value)
  isCorrect.value = selected?.is_correct || false
  showAnswer.value = true

  // Store result
  results.value[currentIndex.value] = {
    correct: isCorrect.value,
    selectedAnswer: selectedAnswer.value,
    correctAnswer: currentOptions.value.find(o => o.is_correct)?.id
  }
  answeredQuestions.value.add(currentIndex.value)

  // Record answer to backend (for wrong question tracking)
  try {
    if (!isCorrect.value && currentQuestion.value?.id) {
      // This will add to wrong questions if answer is wrong
        await examStore.saveExamResult({
          exam_id: null, // Single question practice, no exam
          score: 0,
          correct_count: 0,
          total_count: 1,
          wrong_question_ids: [currentQuestion.value.id]
        }).catch(() => {}) // Silent fail for practice mode
    }
  } catch (e) {
    // Silent fail, don't interrupt the practice flow
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    resetQuestionState()
    currentOptions.value = questions.value[currentIndex.value].options || []
  } else {
    // Show results
    showResults.value = true
  }
}

const goToQuestion = (idx) => {
  if (idx >= 0 && idx < questions.value.length) {
    currentIndex.value = idx

    // Restore state for this question if already answered
    if (results.value[idx]) {
      selectedAnswer.value = results.value[idx].selectedAnswer
      showAnswer.value = true
      isCorrect.value = results.value[idx].correct
    } else {
      resetQuestionState()
    }

    currentOptions.value = questions.value[idx].options || []
  }
}

const resetQuestionState = () => {
  selectedAnswer.value = null
  showAnswer.value = false
  isCorrect.value = false
}

const addToFlashcard = async () => {
  if (!currentQuestion.value?.id) return
  if (currentInFlashcard.value) return // Already in flashcard

  try {
    await flashcardService.createFlashcard({ question: currentQuestion.value.id })
    flashcardStatus.value.add(currentQuestion.value.id)
    alert('已加入快閃卡！')
  } catch (e) {
    const errorMsg = e.message || ''
    // Check if error indicates already exists (message contains "已" meaning already)
    if (errorMsg.includes('已') || errorMsg.includes('already') || e.response?.status === 400) {
      // Mark as already in flashcard
      flashcardStatus.value.add(currentQuestion.value.id)
      alert('此題目已在快閃卡中')
    } else {
      console.error('Failed to add to flashcard:', e)
      alert('加入快閃卡失敗')
    }
  }
}

const openAIChat = () => {
  // Open AI chat sidebar instead of navigating
  const content = currentQuestion.value?.content || ''
  const optionsText = currentOptions.value.map((o, idx) => `${getOptionLabel(idx)}. ${o.content}`).join('\n')
  const correct = currentOptions.value.find(o => o.is_correct)
  const correctIdx = currentOptions.value.indexOf(correct)
  const correctText = correct ? `${getOptionLabel(correctIdx)}. ${correct.content}` : ''

  const prefillText = `題目：${content}\n\n選項：\n${optionsText}\n\n正確答案：${correctText}\n\n請幫我解析這道題目，解釋為什麼正確答案是對的？`

  chatPrefill.value = { text: prefillText, stamp: Date.now() }
  isChatOpen.value = true
}

// Split View State
const isChatOpen = ref(false)
const chatPrefill = ref({ text: '', stamp: Date.now() })
const splitRatio = ref(0.6) // Main panel takes 60% by default
const isDragging = ref(false)
const minPanelWidth = 300 // Minimum width for each panel in pixels

// Floating button draggable state
const floatingBtnPos = ref({ x: null, y: null }) // null means use default position
const isFloatingDragging = ref(false)
const floatingDragStart = ref({ x: 0, y: 0 })
const floatingBtnStartPos = ref({ x: 0, y: 0 })
const hasDragged = ref(false)

// Computed style for floating button
const floatingBtnStyle = computed(() => {
  if (floatingBtnPos.value.x === null || floatingBtnPos.value.y === null) {
    return {} // Use default CSS position
  }
  return {
    left: `${floatingBtnPos.value.x}px`,
    top: `${floatingBtnPos.value.y}px`,
    right: 'auto',
    bottom: 'auto',
    transition: floatingBtnPos.value.snapping ? 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s ease' : 'none'
  }
})

// Computed styles for split view
const mainPanelStyle = computed(() => {
  if (!isChatOpen.value) {
    return { width: '100%' }
  }
  return { width: `calc(${splitRatio.value * 100}% - 4px)` }
})

const chatPanelStyle = computed(() => {
  if (!isChatOpen.value) {
    return { display: 'none' }
  }
  return { width: `calc(${(1 - splitRatio.value) * 100}% - 4px)` }
})

// Drag handlers for the divider
const startDrag = (e) => {
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const containerWidth = window.innerWidth

  let newRatio = clientX / containerWidth

  // Enforce minimum panel widths
  const minRatio = minPanelWidth / containerWidth
  const maxRatio = 1 - minRatio

  newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))
  splitRatio.value = newRatio
}

const stopDrag = () => {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Floating AI button drag handlers
const startFloatingDrag = (e) => {
  e.preventDefault()
  isFloatingDragging.value = true
  hasDragged.value = false

  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  floatingDragStart.value = { x: clientX, y: clientY }

  // Get current button position
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  floatingBtnStartPos.value = { x: rect.left, y: rect.top }

  // If this is first drag and position is null, initialize from current position
  if (floatingBtnPos.value.x === null) {
    floatingBtnPos.value = { x: rect.left, y: rect.top, side: 'right', snapping: false }
  }
  floatingBtnPos.value.snapping = false

  document.addEventListener('mousemove', onFloatingDrag)
  document.addEventListener('mouseup', stopFloatingDrag)
  document.addEventListener('touchmove', onFloatingDrag, { passive: false })
  document.addEventListener('touchend', stopFloatingDrag)
}

const onFloatingDrag = (e) => {
  if (!isFloatingDragging.value) return
  e.preventDefault()

  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  const deltaX = clientX - floatingDragStart.value.x
  const deltaY = clientY - floatingDragStart.value.y

  // Check if user has moved enough to count as a drag
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasDragged.value = true
  }

  const btnSize = 56
  const padding = 16

  // Allow free movement during drag
  let newX = floatingBtnStartPos.value.x + deltaX
  let newY = floatingBtnStartPos.value.y + deltaY

  // Constrain to viewport
  newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, newX))
  newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, newY))

  floatingBtnPos.value = { ...floatingBtnPos.value, x: newX, y: newY, snapping: false }
}

const stopFloatingDrag = () => {
  isFloatingDragging.value = false

  document.removeEventListener('mousemove', onFloatingDrag)
  document.removeEventListener('mouseup', stopFloatingDrag)
  document.removeEventListener('touchmove', onFloatingDrag)
  document.removeEventListener('touchend', stopFloatingDrag)

  // If not dragged, treat as click
  if (!hasDragged.value) {
    openAIChat()
    return
  }

  // Snap to nearest side with animation
  const btnSize = 56
  const padding = 16
  const currentX = floatingBtnPos.value.x
  const midPoint = window.innerWidth / 2

  // Determine which side to snap to
  const side = (currentX + btnSize / 2) < midPoint ? 'left' : 'right'
  const targetX = side === 'left' ? padding : window.innerWidth - btnSize - padding

  // Enable snapping animation and set target position
  floatingBtnPos.value = {
    ...floatingBtnPos.value,
    x: targetX,
    side,
    snapping: true
  }
}

const closeChat = () => {
  isChatOpen.value = false
}

const handleResize = () => {
  // Ensure split ratio respects minimum widths on resize
  const containerWidth = window.innerWidth
  const minRatio = minPanelWidth / containerWidth
  const maxRatio = 1 - minRatio

  if (splitRatio.value < minRatio) splitRatio.value = minRatio
  if (splitRatio.value > maxRatio) splitRatio.value = maxRatio
}

const confirmExit = () => {
  if (answeredQuestions.value.size > 0 && !showResults.value) {
    showExitModal.value = true
  } else {
    exitPractice()
  }
}

const exitPractice = () => {
  showExitModal.value = false
  goBack()
}

const goBack = () => {
  // Check if we came from a specific page
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/practice')
  }
}

const reviewQuestions = () => {
  showResults.value = false
  currentIndex.value = 0
  goToQuestion(0)
}

const retryPractice = () => {
  showResults.value = false
  currentIndex.value = 0
  results.value = {}
  answeredQuestions.value.clear()
  resetQuestionState()
  currentOptions.value = questions.value[0]?.options || []
}

// Lifecycle
onMounted(() => {
  loadQuestions()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // Clean up any lingering drag state
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
/* Split View Container */
.split-view-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #f8fafc;
}

/* Main Content Panel */
.main-panel {
  height: 100vh;
  overflow-y: auto;
  background: #f8fafc;
  transition: width 0.1s ease;
}

/* Draggable Divider */
.split-divider {
  width: 8px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
  position: relative;
}

.split-divider:hover,
.split-divider:active {
  background: #d3d8df;
}

.divider-handle {
  width: 4px;
  height: 40px;
  background: #9ca3af;
  border-radius: 2px;
  transition: background 0.2s;
}

.split-divider:hover .divider-handle,
.split-divider:active .divider-handle {
  background: #6b7280;
}

/* AI Chat Split Panel */
.chat-panel-split {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  overflow: hidden;
  transition: width 0.1s ease;
}

.chat-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #f6f8fb;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.chat-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.chat-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  font-size: 13px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #eef1f5;
  color: #1e293b;
}

.chat-panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
}

/* Floating AI Button */
.floating-ai-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4A90D9, #3B7FCC);
  box-shadow: 0 4px 16px rgba(74, 144, 217, 0.4);
  border: none;
  cursor: grab;
  display: grid;
  place-items: center;
  transition: box-shadow 0.2s, transform 0.2s;
  z-index: 100;
  touch-action: none;
  user-select: none;
}

.floating-ai-btn:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.floating-ai-btn:hover {
  box-shadow: 0 6px 24px rgba(74, 144, 217, 0.5);
}

.floating-ai-icon {
  width: 32px;
  height: 32px;
  color: #fff;
  pointer-events: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .split-view-container {
    display: block;
  }

  .main-panel {
    width: 100% !important;
    height: auto;
    min-height: 100vh;
  }

  .chat-panel-split {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100% !important;
    max-width: 400px;
    z-index: 1000;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .split-divider {
    display: none;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
  }
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: #64748b;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state i,
.empty-state i {
  font-size: 48px;
  color: #94a3b8;
}

.quiz-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

/* Quiz Header */
.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quiz-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #64748b;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.quiz-title h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.quiz-progress {
  font-size: 14px;
  color: #64748b;
}

.quiz-tools {
  display: flex;
  gap: 8px;
}

/* Progress Bar */
.progress-bar-container {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s;
}

/* Question Navigator */
/* Navigation Section */
.navigation-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.nav-arrows {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.arrow-btn {
  width: 44px;
  height: 44px;
  border: 2px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  font-size: 20px;
  color: var(--primary, #476996);
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  place-items: center;
}

.arrow-btn:hover:not(:disabled) {
  background: var(--primary, #476996);
  border-color: var(--primary, #476996);
  color: #fff;
}

.arrow-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.question-navigator {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 400px;
}

/* Answer Record Summary */
.answer-record {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
}

.record-label {
  color: #64748b;
  font-weight: 500;
}

.record-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.record-stat.correct {
  color: #22c55e;
}

.record-stat.wrong {
  color: #ef4444;
}

.record-stat.unanswered {
  color: #94a3b8;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  border-color: var(--primary, #476996);
  color: var(--primary, #476996);
}

.nav-btn.active {
  background: var(--primary, #476996);
  border-color: var(--primary, #476996);
  color: #fff;
}

.nav-btn.answered {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.nav-btn.correct {
  background: #dcfce7;
  border-color: #22c55e;
  color: #16a34a;
}

.nav-btn.wrong {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

/* Question Panel */
.question-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}

.question-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.meta-tag.subject {
  background: #eff6ff;
  color: #2563eb;
}

.meta-tag.category {
  background: #f0fdf4;
  color: #16a34a;
}

.meta-tag.difficulty {
  background: #fef3c7;
  color: #d97706;
}

.meta-tag.difficulty.easy {
  background: #dcfce7;
  color: #16a34a;
}

.meta-tag.difficulty.hard {
  background: #fee2e2;
  color: #dc2626;
}

.question-content {
  font-size: 18px;
  line-height: 1.7;
  color: #1e293b;
  margin-bottom: 24px;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.option-item:hover:not(.disabled) {
  border-color: var(--primary, #476996);
  background: #f8fafc;
}

.option-item.selected {
  border-color: var(--primary, #476996);
  background: #eff6ff;
}

.option-item.correct {
  border-color: #22c55e;
  background: #f0fdf4;
}

.option-item.wrong {
  border-color: #ef4444;
  background: #fef2f2;
}

.option-item.disabled {
  cursor: default;
}

.option-label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
}

.option-item.selected .option-label {
  background: var(--primary, #476996);
  color: #fff;
}

.option-item.correct .option-label {
  background: #22c55e;
  color: #fff;
}

.option-item.wrong .option-label {
  background: #ef4444;
  color: #fff;
}

.option-text {
  flex: 1;
  line-height: 1.5;
  color: #1e293b;
}

.option-indicator {
  font-size: 20px;
}

.option-indicator.correct {
  color: #22c55e;
}

.option-indicator.wrong {
  color: #ef4444;
}

/* Answer Feedback */
.answer-feedback {
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
}

.answer-feedback.correct {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.answer-feedback.wrong {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
}

.answer-feedback.correct .feedback-header {
  color: #16a34a;
}

.answer-feedback.wrong .feedback-header {
  color: #dc2626;
}

.correct-answer {
  color: #64748b;
  margin: 8px 0;
}

.explanation {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.1);
  color: #475569;
  line-height: 1.6;
}

/* Quiz Actions */
.quiz-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Results Panel */
.results-panel {
  max-width: 500px;
  margin: 60px auto;
  padding: 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  text-align: center;
}

.results-header {
  margin-bottom: 24px;
}

.results-header i {
  font-size: 48px;
  color: #f59e0b;
  margin-bottom: 12px;
}

.results-header h2 {
  font-size: 24px;
  color: #1e293b;
  margin: 0;
}

.results-score {
  margin-bottom: 24px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  border: 4px solid;
}

.score-circle.high {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #16a34a;
}

.score-circle.medium {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.score-circle.low {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.score-value {
  font-size: 36px;
  font-weight: 800;
}

.score-total {
  font-size: 18px;
  opacity: 0.7;
}

.score-label {
  color: #64748b;
  font-size: 16px;
}

.results-breakdown {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.breakdown-item.correct {
  color: #16a34a;
}

.breakdown-item.wrong {
  color: #dc2626;
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary, #476996), #35527a);
  color: #fff;
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(71, 105, 150, 0.35);
}

.btn-secondary {
  background: #64748b;
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.btn-flashcard-added {
  background: #E0E7FF;
  color: #4338CA;
  border: 1px solid #C7D2FE;
  cursor: default;
}

.btn-flashcard-added:hover:not(:disabled) {
  background: #E0E7FF;
  transform: none;
}

.btn-ghost {
  background: transparent;
  color: var(--primary, #476996);
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #f1f5f9;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 12px;
  color: #1e293b;
}

.modal-content p {
  color: #64748b;
  margin: 0 0 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* Responsive */
@media (max-width: 640px) {
  .quiz-content {
    padding: 16px;
  }

  .quiz-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quiz-tools {
    width: 100%;
    justify-content: flex-end;
  }

  .question-panel {
    padding: 16px;
  }

  .question-content {
    font-size: 16px;
  }

  .option-item {
    padding: 12px;
  }

  .results-panel {
    margin: 24px 16px;
    padding: 24px;
  }

  .results-breakdown {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
