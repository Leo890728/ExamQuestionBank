import api from './api'

export default {
  /**
   * Get questions with filters
   * @param {Object} params - Filter parameters (examSeries, year, subject, difficulty, keyword)
   */
  getQuestions(params = {}) {
    return api.get('/questions/', { params })
  },

  /**
   * Get single question detail
   * @param {number} id - Question ID
   */
  getQuestion(id) {
    return api.get(`/questions/${id}/`)
  },

  /**
   * Submit an answer attempt
   * @param {number} questionId - Question ID
   * @param {Object} data - Answer data (selected_options, answer_text, time_spent)
   */
  submitAttempt(questionId, data) {
    return api.post(`/questions/${questionId}/attempt/`, data)
  },

  /**
   * Toggle bookmark for a question
   * @param {number} questionId - Question ID
   */
  bookmarkQuestion(questionId) {
    return api.post(`/questions/${questionId}/bookmark/`)
  },

  /**
   * Get next question based on preferences
   * @param {Object} params - Filter parameters
   */
  getNextQuestion(params = {}) {
    return api.get('/questions/next/', { params })
  },

  /**
   * Get user's bookmarked questions
   */
  getBookmarkedQuestions() {
    return api.get('/questions/bookmarks/')
  },

  /**
   * Get question attempts history
   * @param {Object} params - Filter parameters
   */
  getAttempts(params = {}) {
    return api.get('/questions/attempts/', { params })
  }
}
