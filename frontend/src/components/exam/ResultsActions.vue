<template>
  <div class="results-actions">
    <div class="actions-header">
      <h3 class="actions-title">What would you like to do next?</h3>
      <p class="actions-subtitle" v-if="wrongQuestionCount > 0">
        You got {{ wrongQuestionCount }} question{{ wrongQuestionCount > 1 ? 's' : '' }} wrong. 
        Consider bookmarking them for review or creating flashcards to improve.
      </p>
    </div>

    <div class="actions-grid">
      <!-- Bookmark Wrong Questions -->
      <div class="action-card" v-if="wrongQuestionCount > 0">
        <div class="action-icon bookmark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="action-content">
          <h4 class="action-title">Bookmark Wrong Questions</h4>
          <p class="action-description">
            Save the {{ wrongQuestionCount }} incorrect question{{ wrongQuestionCount > 1 ? 's' : '' }} 
            to your bookmarks for easy review later.
          </p>
          <button 
            class="action-button primary"
            @click="handleBookmarkWrongQuestions"
            :disabled="isBookmarking"
            :aria-label="`Bookmark ${wrongQuestionCount} wrong questions`"
          >
            <span v-if="isBookmarking">Bookmarking...</span>
            <span v-else>Bookmark Questions</span>
          </button>
        </div>
      </div>

      <!-- Create Flashcards -->
      <div class="action-card" v-if="wrongQuestionCount > 0">
        <div class="action-icon flashcard">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M7 8H17M7 12H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <rect x="5" y="6" width="14" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
          </svg>
        </div>
        <div class="action-content">
          <h4 class="action-title">Create Flashcards</h4>
          <p class="action-description">
            Turn the {{ wrongQuestionCount }} incorrect question{{ wrongQuestionCount > 1 ? 's' : '' }} 
            into flashcards for spaced repetition learning.
          </p>
          <button 
            class="action-button primary"
            @click="handleCreateFlashcards"
            :disabled="isCreatingFlashcards"
            :aria-label="`Create flashcards for ${wrongQuestionCount} wrong questions`"
          >
            <span v-if="isCreatingFlashcards">Creating...</span>
            <span v-else>Create Flashcards</span>
          </button>
        </div>
      </div>

      <!-- Retake Exam -->
      <div class="action-card">
        <div class="action-icon retake">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20.49 9C19.9828 7.56678 19.1209 6.28392 17.9845 5.27304C16.8482 4.26216 15.4745 3.55682 13.9917 3.21834C12.5089 2.87986 10.9652 2.91902 9.50481 3.33329C8.04437 3.74757 6.70779 4.52433 5.64 5.59L1 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.51 15C4.01719 16.4332 4.87906 17.7161 6.01547 18.727C7.15189 19.7378 8.52547 20.4432 10.0083 20.7817C11.4911 21.1201 13.0348 21.081 14.4952 20.6667C15.9556 20.2524 17.2922 19.4757 18.36 18.41L23 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="action-content">
          <h4 class="action-title">Retake Exam</h4>
          <p class="action-description">
            Take this exam again to improve your score and reinforce your learning.
          </p>
          <button 
            class="action-button secondary"
            @click="handleRetakeExam"
            aria-label="Retake this exam"
          >
            Retake Exam
          </button>
        </div>
      </div>

      <!-- Return to Exam List -->
      <div class="action-card">
        <div class="action-icon return">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="2"/>
            <path d="M8 9L12 13L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="action-content">
          <h4 class="action-title">Back to Exam List</h4>
          <p class="action-description">
            Return to the main exam list to choose another exam or review your progress.
          </p>
          <button 
            class="action-button secondary"
            @click="handleReturnToList"
            aria-label="Return to exam list"
          >
            Back to Exams
          </button>
        </div>
      </div>
    </div>

    <!-- Success Messages -->
    <div class="success-messages" v-if="successMessages.length > 0">
      <div 
        v-for="(message, index) in successMessages" 
        :key="index"
        class="success-message"
        role="alert"
        aria-live="polite"
      >
        <div class="success-icon">✓</div>
        <div class="success-text">{{ message }}</div>
      </div>
    </div>

    <!-- Error Messages -->
    <div class="error-messages" v-if="errorMessages.length > 0">
      <div 
        v-for="(message, index) in errorMessages" 
        :key="index"
        class="error-message"
        role="alert"
        aria-live="assertive"
      >
        <div class="error-icon">⚠</div>
        <div class="error-text">{{ message }}</div>
        <button 
          class="error-dismiss"
          @click="dismissError(index)"
          aria-label="Dismiss error message"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useExamStore } from '@/stores/examStore'
import flashcardService from '@/services/flashcardService'

export default {
  name: 'ResultsActions',
  props: {
    results: {
      type: Object,
      required: true,
      validator(value) {
        return value && 
               Array.isArray(value.details) &&
               Array.isArray(value.wrongQuestionIds) &&
               typeof value.examId === 'string'
      }
    },
    examName: {
      type: String,
      default: ''
    }
  },
  emits: ['retake-exam', 'return-to-list', 'questions-bookmarked', 'flashcards-created'],
  data() {
    return {
      isBookmarking: false,
      isCreatingFlashcards: false,
      successMessages: [],
      errorMessages: []
    }
  },
  computed: {
    wrongQuestionCount() {
      return this.results?.wrongQuestionIds?.length || 0
    },
    wrongQuestionDetails() {
      return this.results?.details?.filter(detail => !detail.isCorrect && detail.userAnswer) || []
    }
  },
  methods: {
    async handleBookmarkWrongQuestions() {
      if (this.wrongQuestionCount === 0) return

      this.isBookmarking = true
      this.clearMessages()

      try {
        const examStore = useExamStore()
        await examStore.addBookmark(this.results.wrongQuestionIds)
        
        const message = `Successfully bookmarked ${this.wrongQuestionCount} question${this.wrongQuestionCount > 1 ? 's' : ''} for review.`
        this.showSuccessMessage(message)
        
        // Emit event for parent components to handle if needed
        this.$emit('questions-bookmarked', {
          questionIds: this.results.wrongQuestionIds,
          count: this.wrongQuestionCount
        })
      } catch (error) {
        console.error('Failed to bookmark questions:', error)
        this.showErrorMessage(
          error.message || 'Failed to bookmark questions. Please try again.'
        )
      } finally {
        this.isBookmarking = false
      }
    },

    async handleCreateFlashcards() {
      if (this.wrongQuestionCount === 0) return

      this.isCreatingFlashcards = true
      this.clearMessages()

      try {
        const flashcardPromises = this.wrongQuestionDetails.map(detail => {
          return flashcardService.createFlashcard({
            question: detail.questionId
          })
        })

        const createdFlashcards = await Promise.all(flashcardPromises)
        
        const message = `Successfully created ${createdFlashcards.length} flashcard${createdFlashcards.length > 1 ? 's' : ''} from wrong questions.`
        this.showSuccessMessage(message)
        
        // Emit event for parent components to handle if needed
        this.$emit('flashcards-created', {
          flashcards: createdFlashcards,
          count: createdFlashcards.length
        })
      } catch (error) {
        console.error('Failed to create flashcards:', error)
        this.showErrorMessage(
          error.message || 'Failed to create flashcards. Please try again.'
        )
      } finally {
        this.isCreatingFlashcards = false
      }
    },

    handleRetakeExam() {
      this.$emit('retake-exam', {
        examId: this.results.examId,
        examName: this.examName
      })
    },

    handleReturnToList() {
      this.$emit('return-to-list')
    },

    showSuccessMessage(message) {
      this.successMessages.push(message)
      // Auto-dismiss success messages after 5 seconds
      setTimeout(() => {
        const index = this.successMessages.indexOf(message)
        if (index > -1) {
          this.successMessages.splice(index, 1)
        }
      }, 5000)
    },

    showErrorMessage(message) {
      this.errorMessages.push(message)
    },

    dismissError(index) {
      this.errorMessages.splice(index, 1)
    },

    clearMessages() {
      this.successMessages = []
      this.errorMessages = []
    }
  }
}
</script>

<style scoped>
.results-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions-header {
  margin-bottom: 2rem;
  text-align: center;
}

.actions-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.actions-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.action-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.action-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.action-icon.bookmark {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  color: #92400e;
}

.action-icon.flashcard {
  background: linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%);
  color: #1e40af;
}

.action-icon.retake {
  background: linear-gradient(135deg, #d1fae5 0%, #10b981 100%);
  color: #065f46;
}

.action-icon.return {
  background: linear-gradient(135deg, #e5e7eb 0%, #6b7280 100%);
  color: #374151;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.action-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 140px;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.primary {
  background: #3b82f6;
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.action-button.secondary:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.success-messages,
.error-messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.success-message {
  background: #ecfdf5;
  border: 1px solid #10b981;
  color: #065f46;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #ef4444;
  color: #991b1b;
}

.success-icon,
.error-icon {
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.success-text,
.error-text {
  flex: 1;
}

.error-dismiss {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.error-dismiss:hover {
  background: rgba(153, 27, 27, 0.1);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .results-actions {
    padding: 1rem;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .action-card {
    padding: 1rem;
  }
  
  .action-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .action-button {
    width: 100%;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .action-card {
    border-width: 2px;
  }
  
  .action-card:hover {
    border-width: 2px;
  }
  
  .action-icon.bookmark {
    background: #fbbf24;
    color: #000;
  }
  
  .action-icon.flashcard {
    background: #3b82f6;
    color: #fff;
  }
  
  .action-icon.retake {
    background: #10b981;
    color: #fff;
  }
  
  .action-icon.return {
    background: #6b7280;
    color: #fff;
  }
  
  .success-message {
    border-width: 2px;
  }
  
  .error-message {
    border-width: 2px;
  }
}

/* Focus styles for accessibility */
.action-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.error-dismiss:focus {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

.action-card:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .action-card,
  .action-button,
  .error-dismiss {
    transition: none;
  }
  
  .action-card:hover,
  .action-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
