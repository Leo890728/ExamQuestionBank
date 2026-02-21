/**
 * Essay Analysis Service - Supabase Edge Function
 * Uses Edge Function for essay/case analysis (requires external AI API)
 */
import { supabase } from '@/lib/supabase'

const essayAnalysisService = {
  /**
   * Analyze essay text
   * @param {string} essayText - Essay text to analyze
   * @returns {Promise} Analysis result
   */
  async analyzeEssay(essayText) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        window.dispatchEvent(new Event('show-login'))
        throw new Error('請先登入以使用分析功能')
      }

      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: {
          case_text: essayText,
          analysis_type: 'essay'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        if (error.message?.includes('401')) {
          window.dispatchEvent(new Event('show-login'))
          throw new Error('請先登入以使用分析功能')
        }
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      // If Edge Function doesn't exist yet, return a helpful message
      if (error.message?.includes('Function not found')) {
        throw new Error('AI 分析功能尚未部署，請稍後再試')
      }
      throw error
    }
  },

  /**
   * Get analysis history from essay_analysis table
   * @param {number} limit - Max records (default 20)
   * @param {number} offset - Pagination offset (default 0)
   * @returns {Promise<Array>} List of { id, question_text, analysis_response, created_at }
   */
  async getHistory(limit = 20, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.dispatchEvent(new Event('show-login'))
      throw new Error('請先登入以查看歷史記錄')
    }

    const { data, error } = await supabase
      .from('essay_analysis')
      .select('id, question_text, analysis_response, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data ?? []
  }
}

export default essayAnalysisService
