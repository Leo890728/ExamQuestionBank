import { defineStore } from 'pinia'
import { ref } from 'vue'
import essayAnalysisService from '@/services/essayAnalysisService'

export const useEssayAnalysisStore = defineStore('essayAnalysis', () => {
  const messages = ref([])
  const historyItems = ref([])
  const isLoading = ref(false)
  const isHistoryLoading = ref(false)
  const errorMessage = ref('')

  const analyze = async (questionText) => {
    if (!questionText.trim() || isLoading.value) return
    errorMessage.value = ''

    messages.value.push({
      role: 'user',
      content: questionText.trim(),
      timestamp: new Date()
    })

    isLoading.value = true
    try {
      const response = await essayAnalysisService.analyzeEssay(questionText.trim())
      messages.value.push({
        role: 'assistant',
        content: response?.analysis ?? response?.result ?? JSON.stringify(response),
        timestamp: new Date()
      })

      // Refresh history to sync with newly analyzed essay
      await loadHistory()

      return response
    } catch (error) {
      errorMessage.value = error.message || '分析時發生錯誤'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadHistory = async () => {
    isHistoryLoading.value = true
    try {
      const data = await essayAnalysisService.getHistory()
      historyItems.value = Array.isArray(data) ? data : (data?.results ?? [])
    } catch (error) {
      console.error('Failed to load essay analysis history:', error)
    } finally {
      isHistoryLoading.value = false
    }
  }

  const clearMessages = () => {
    messages.value = []
    errorMessage.value = ''
  }

  const restoreFromHistory = (historyItem) => {
    messages.value = [
      {
        role: 'user',
        content: historyItem.question_text,
        timestamp: new Date(historyItem.created_at)
      },
      {
        role: 'assistant',
        content: historyItem.analysis_response,
        timestamp: new Date(historyItem.created_at)
      }
    ]
    errorMessage.value = ''
  }

  const clearError = () => {
    errorMessage.value = ''
  }

  return {
    messages,
    historyItems,
    isLoading,
    isHistoryLoading,
    errorMessage,
    analyze,
    loadHistory,
    clearMessages,
    restoreFromHistory,
    clearError
  }
})
