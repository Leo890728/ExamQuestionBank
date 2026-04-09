/**
 * Flashcard Service - Supabase RPC Only
 * No Django fallback - uses RPC functions exclusively
 */
import { supabase } from '@/lib/supabase'

const normalizeFlashcardStatus = (status) => {
    if (status === 'review') return 'reviewing'
    return status || 'learning'
}

const normalizeFlashcard = (item = {}) => {
    const question = item.question || {}

    return {
        ...item,
        status: normalizeFlashcardStatus(item.status),
        interval: item.interval ?? item.interval_days ?? 1,
        interval_days: item.interval_days ?? item.interval ?? 1,
        question: typeof question === 'object' ? question.id ?? item.question_id ?? null : question ?? item.question_id ?? null,
        question_id: item.question_id ?? (typeof question === 'object' ? question.id ?? null : question ?? null),
        question_content: item.question_content ?? question.content ?? '',
        question_subject: item.question_subject ?? question.subject ?? question.subject_name ?? '',
        question_explanation: item.question_explanation ?? question.explanation ?? '',
        question_options: item.question_options ?? question.options ?? []
    }
}

const normalizeFlashcardStats = (stats = {}) => ({
    total_cards: stats.total_cards ?? stats.total ?? 0,
    due_cards: stats.due_cards ?? stats.due ?? 0,
    review_streak: stats.review_streak ?? stats.streak ?? 0,
    completion_percent: stats.completion_percent ?? stats.percent_complete ?? 0
})

const flashcardService = {
    // Get all flashcards for current user
    async getFlashcards() {
        const { data, error } = await supabase.rpc('get_flashcards')
        if (error) throw new Error(error.message)
        return (data || []).map(normalizeFlashcard)
    },

    // Get due flashcards for review
    async getDueFlashcards() {
        const { data, error } = await supabase.rpc('get_due_flashcards', { p_limit: 20 })
        if (error) throw new Error(error.message)
        return (data || []).map(normalizeFlashcard)
    },

    // Get flashcard statistics
    async getStatistics() {
        const { data, error } = await supabase.rpc('get_flashcard_stats')
        if (error) throw new Error(error.message)
        return normalizeFlashcardStats(data || {})
    },

    // Get flashcard history (placeholder)
    async getHistory() {
        // Supabase doesn't have a review history table yet
        return []
    },

    // Create flashcard from question
    async createFlashcard(payload) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('請先登入後再使用快閃卡功能')

        const questionId = payload?.question_id ?? payload?.question
        if (questionId === undefined || questionId === null) {
            throw new Error('question_id is required')
        }

        const { data, error } = await supabase.from('flashcard').insert({
            user_id: user.id,
            question_id: questionId,
            status: 'learning',
            ease_factor: 2.5,
            interval_days: 1,
            repetition: 0,
            review_count: 0,
            next_review_date: new Date().toISOString().split('T')[0]
        }).select().single()

        if (error) throw new Error(error.message)
        return data
    },

    // Review flashcard with SM2 rating (0=Again, 1=Hard, 2=Good, 3=Easy)
    async reviewFlashcard(flashcardId, rating) {
        const { data, error } = await supabase.rpc('review_flashcard', {
            p_flashcard_id: flashcardId,
            p_rating: rating
        })
        if (error) throw new Error(error.message)
        return data
    },

    // Delete flashcard
    async deleteFlashcard(flashcardId) {
        const { error } = await supabase.from('flashcard').delete().eq('id', flashcardId)
        if (error) throw new Error(error.message)
        return { success: true }
    }
}

export default flashcardService
