import { defineStore } from 'pinia'
import questionService from '@/services/questionService'

export const useQuestionDetailStore = defineStore('questionDetail', {
  state: () => ({
    byId: {},
    inflight: {}
  }),

  actions: {
    async getQuestion(id, options = {}) {
      const { force = false } = options
      const key = Number(id)

      if (!Number.isFinite(key)) {
        throw new Error('Invalid question id')
      }

      if (!force && this.byId[key]) {
        return this.byId[key]
      }

      if (!force && this.inflight[key]) {
        return this.inflight[key]
      }

      const request = questionService.getQuestion(key)
        .then(({ data }) => {
          this.byId[key] = data
          delete this.inflight[key]
          return data
        })
        .catch((error) => {
          delete this.inflight[key]
          throw error
        })

      this.inflight[key] = request
      return request
    },

    setQuestion(question) {
      const key = Number(question?.id)
      if (!Number.isFinite(key)) return
      this.byId[key] = question
    },

    clearQuestion(id) {
      const key = Number(id)
      delete this.byId[key]
      delete this.inflight[key]
    },

    clearAll() {
      this.byId = {}
      this.inflight = {}
    }
  }
})
