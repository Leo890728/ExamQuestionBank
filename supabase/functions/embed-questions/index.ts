// Edge Function: embed-questions
// Generates embeddings for questions using OpenAI API and stores them in Supabase
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSION = 1536
const DEFAULT_BATCH_SIZE = 50
const BATCH_DELAY_MS = 500

interface EmbedRequest {
    question_ids?: number[]
    batch_size?: number
    all_missing?: boolean
}

interface EmbeddingResult {
    processed: number
    failed: number
    errors: string[]
}

declare const Deno: {
    env: { get(key: string): string | undefined }
}

serve(async (req: Request) => {
    // Handle CORS
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        // Require admin authentication
        const authHeader = req.headers.get('Authorization')
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { global: { headers: { Authorization: authHeader! } } }
        )

        // Verify admin status
        const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Check admin status
        const { data: isAdmin } = await supabase.rpc('is_admin')
        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Parse request body
        const body: EmbedRequest = await req.json()
        const batchSize = body.batch_size || DEFAULT_BATCH_SIZE

        // Get question IDs to process
        let questionIds: number[] = body.question_ids || []

        if (body.all_missing || questionIds.length === 0) {
            // Get unembedded questions
            const { data: missingIds, error: fetchError } = await supabase
                .rpc('get_unembedded_question_ids', { p_limit: batchSize })

            if (fetchError) {
                throw new Error(`Failed to fetch unembedded questions: ${fetchError.message}`)
            }
            questionIds = missingIds || []
        }

        if (questionIds.length === 0) {
            return new Response(JSON.stringify({
                processed: 0,
                failed: 0,
                errors: [],
                message: 'No questions to embed'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Fetch question content
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, content')
            .in('id', questionIds)

        if (questionsError) {
            throw new Error(`Failed to fetch questions: ${questionsError.message}`)
        }

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY not configured')
        }

        // Process in batches
        const result: EmbeddingResult = { processed: 0, failed: 0, errors: [] }

        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize)
            const texts = batch.map(q => q.content)

            try {
                // Call OpenAI Embeddings API
                const embeddingResponse = await fetch(OPENAI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: EMBEDDING_MODEL,
                        input: texts,
                        dimensions: EMBEDDING_DIMENSION
                    })
                })

                if (!embeddingResponse.ok) {
                    const errorText = await embeddingResponse.text()
                    throw new Error(`OpenAI API error: ${embeddingResponse.status} - ${errorText}`)
                }

                const embeddingData = await embeddingResponse.json()

                // Store embeddings
                for (let j = 0; j < batch.length; j++) {
                    const question = batch[j]
                    const embedding = embeddingData.data[j].embedding

                    try {
                        // Convert embedding array to pgvector format
                        const embeddingStr = `[${embedding.join(',')}]`

                        const { error: upsertError } = await supabase.rpc('upsert_question_embedding', {
                            p_question_id: question.id,
                            p_embedding: embeddingStr,
                            p_model: EMBEDDING_MODEL
                        })

                        if (upsertError) {
                            result.failed++
                            result.errors.push(`Question ${question.id}: ${upsertError.message}`)
                        } else {
                            result.processed++
                        }
                    } catch (storeError) {
                        result.failed++
                        result.errors.push(`Question ${question.id}: ${storeError.message}`)
                    }
                }

                // Delay between batches to avoid rate limiting
                if (i + batchSize < questions.length) {
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
                }

            } catch (batchError) {
                // Mark entire batch as failed
                result.failed += batch.length
                result.errors.push(`Batch starting at ${i}: ${batchError.message}`)
            }
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
