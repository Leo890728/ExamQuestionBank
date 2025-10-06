import { defineStore } from 'pinia'
import questionService from '@/services/questionService'

export const useQuestionBankStore = defineStore('questionBank', {
  state: () => ({
    // Questions list
    questions: [],
    currentQuestion: null,
    totalQuestions: 0,
    currentPage: 1,

    // Filters
    filters: {
      examSeries: null,
      year: null,
      subject: null,
      difficulty: null,
      keyword: ''
    },

    // Statistics
    statistics: {
      totalQuestions: 0,
      attempted: 0,
      correctRate: 0,
      toReview: 0
    },

    // Loading states
    loading: false,
    error: null
  }),

  getters: {
    hasFilters: (state) => {
      return Object.values(state.filters).some(v => v !== null && v !== '')
    }
  },

  actions: {
    async fetchQuestions(page = 1) {
      this.loading = true
      this.error = null

      try {
        const params = {
          ...this.filters,
          page
        }

        const response = await questionService.getQuestions(params)
        this.questions = response.data.results
        this.totalQuestions = response.data.count
        this.currentPage = page
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '獲取題目失敗'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchQuestion(id) {
      this.loading = true
      this.error = null

      try {
        const response = await questionService.getQuestion(id)
        this.currentQuestion = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '獲取題目詳情失敗'
        throw error
      } finally {
        this.loading = false
      }
    },

    async submitAnswer(questionId, answerData) {
      try {
        const response = await questionService.submitAttempt(questionId, answerData)

        // Update statistics
        this.statistics.attempted += 1
        if (response.data.is_correct) {
          this.statistics.correctRate =
            ((this.statistics.correctRate * (this.statistics.attempted - 1)) + 100) /
            this.statistics.attempted
        } else {
          this.statistics.correctRate =
            (this.statistics.correctRate * (this.statistics.attempted - 1)) /
            this.statistics.attempted
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '提交答案失敗'
        throw error
      }
    },

    async toggleBookmark(questionId) {
      try {
        const response = await questionService.bookmarkQuestion(questionId)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '收藏操作失敗'
        throw error
      }
    },

    setFilter(filterName, value) {
      this.filters[filterName] = value
    },

    resetFilters() {
      this.filters = {
        examSeries: null,
        year: null,
        subject: null,
        difficulty: null,
        keyword: ''
      }
    }
  }
})
