/**
 * RAG Service - Supabase RPC + Edge Functions
 * Handles RAG-based question analysis: embeddings, similarity search, concept groups
 */
import { supabase } from '@/lib/supabase'

const ragService = {
    // ============================================
    // Embedding Status
    // ============================================

    /**
     * Get embedding statistics
     */
    async getEmbeddingStats() {
        const { data, error } = await supabase.rpc('get_embedding_stats')
        if (error) throw new Error(error.message)
        return { data }
    },

    /**
     * Get list of question IDs without embeddings
     */
    async getUnembeddedQuestionIds(limit = 100) {
        const { data, error } = await supabase.rpc('get_unembedded_question_ids', {
            p_limit: limit
        })
        if (error) throw new Error(error.message)
        return { data: data || [] }
    },

    // ============================================
    // Embedding Generation (Admin Only)
    // ============================================

    /**
     * Trigger embedding generation for questions
     * @param {Object} options - { question_ids?: number[], batch_size?: number, all_missing?: boolean }
     */
    async embedQuestions(options = {}) {
        const { data, error } = await supabase.functions.invoke('embed-questions', {
            body: {
                question_ids: options.questionIds || [],
                batch_size: options.batchSize || 50,
                all_missing: options.allMissing ?? true
            }
        })

        if (error) throw new Error(error.message)
        return { data }
    },

    // ============================================
    // Similarity Search
    // ============================================

    /**
     * Find similar questions by question ID
     */
    async findSimilarById(questionId, threshold = 0.7, limit = 20) {
        const { data, error } = await supabase.rpc('find_similar_questions', {
            p_question_id: questionId,
            p_threshold: threshold,
            p_limit: limit
        })
        if (error) throw new Error(error.message)
        return { data: data || [] }
    },

    /**
     * Search for similar questions using text query
     * Note: This requires first generating an embedding for the query text
     * which would need to be done via Edge Function
     */
    async searchByText(queryText, threshold = 0.7, limit = 20, filters = {}) {
        // For MVP, we'll use the Edge Function to handle text-to-embedding
        const { data, error } = await supabase.functions.invoke('search-questions', {
            body: {
                query: queryText,
                threshold,
                limit,
                subject: filters.subject || null,
                year_from: filters.yearFrom || null,
                year_to: filters.yearTo || null
            }
        })
        if (error) throw new Error(error.message)
        return { data: data?.results || [] }
    },

    // ============================================
    // Concept Groups
    // ============================================

    /**
     * Get concept groups with filters and pagination
     */
    async getConceptGroups(params = {}) {
        const { data, error } = await supabase.rpc('get_concept_groups', {
            p_subject: params.subject || null,
            p_important_only: params.importantOnly ?? false,
            p_page: params.page || 1,
            p_page_size: params.pageSize || 20
        })
        if (error) throw new Error(error.message)
        return { data }
    },

    /**
     * Get questions in a specific concept group
     */
    async getConceptGroupQuestions(groupId) {
        const { data, error } = await supabase.rpc('get_concept_group_questions', {
            p_group_id: groupId
        })
        if (error) throw new Error(error.message)
        return { data }
    },

    /**
     * Create a new concept group (admin only)
     */
    async createConceptGroup(groupData) {
        const { data, error } = await supabase
            .from('concept_group')
            .insert({
                name: groupData.name,
                description: groupData.description,
                subject: groupData.subject,
                is_important: groupData.isImportant ?? false,
                is_high_priority: groupData.isHighPriority ?? false
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return { data }
    },

    /**
     * Add a question to a concept group
     */
    async addQuestionToGroup(groupId, questionId, similarityScore = null) {
        const { error } = await supabase
            .from('concept_group_question')
            .insert({
                group_id: groupId,
                question_id: questionId,
                similarity_score: similarityScore
            })

        if (error) throw new Error(error.message)

        // Update question count
        await this.updateGroupQuestionCount(groupId)
        return { success: true }
    },

    /**
     * Update concept group question count
     */
    async updateGroupQuestionCount(groupId) {
        const { count } = await supabase
            .from('concept_group_question')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId)

        await supabase
            .from('concept_group')
            .update({ question_count: count || 0 })
            .eq('id', groupId)
    },

    /**
     * Update concept group details
     */
    async updateConceptGroup(groupId, updates) {
        const { data, error } = await supabase
            .from('concept_group')
            .update({
                name: updates.name,
                description: updates.description,
                is_important: updates.isImportant,
                is_high_priority: updates.isHighPriority
            })
            .eq('id', groupId)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return { data }
    },

    /**
     * Delete a concept group
     */
    async deleteConceptGroup(groupId) {
        const { error } = await supabase
            .from('concept_group')
            .delete()
            .eq('id', groupId)

        if (error) throw new Error(error.message)
        return { success: true }
    }
}

export default ragService
