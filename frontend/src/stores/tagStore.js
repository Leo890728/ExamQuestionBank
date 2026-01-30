import { defineStore } from 'pinia'
import tagService from '@/services/tagService'

const buildKey = (params = {}) => {
  const normalized = {
    search: params.search ?? null,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  }
  return JSON.stringify(normalized)
}

export const useTagStore = defineStore('tagStore', {
  state: () => ({
    cache: {},
    inflight: {}
  }),

  actions: {
    async getTags(params = {}, options = {}) {
      const { force = false } = options
      const key = buildKey(params)

      if (!force && Object.prototype.hasOwnProperty.call(this.cache, key)) {
        return { data: this.cache[key] }
      }

      if (!force && this.inflight[key]) {
        return this.inflight[key]
      }

      const request = tagService.getTags(params)
        .then((res) => {
          this.cache[key] = res.data
          delete this.inflight[key]
          return res
        })
        .catch((error) => {
          delete this.inflight[key]
          throw error
        })

      this.inflight[key] = request
      return request
    },

    clearCache(key = null) {
      if (key) {
        delete this.cache[key]
        delete this.inflight[key]
        return
      }
      this.cache = {}
      this.inflight = {}
    }
  }
})
