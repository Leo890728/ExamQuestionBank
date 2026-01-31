// Edge Function: ai-chat
// Handles AI chat requests and saves history to Supabase
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GPT_MODEL = 'gpt-4o-mini'

interface ChatRequest {
    message: string
    context_type?: string
    context_id?: string | number
    conversation_id?: string
}

serve(async (req: Request) => {
    // Log request details
    console.log(`[ai-chat] Received ${req.method} request`)

    // Handle CORS explicitly
    if (req.method === 'OPTIONS') {
        console.log('[ai-chat] Handling OPTIONS request')
        return new Response('ok', { headers: corsHeaders })
    }

    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        // Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const body: ChatRequest = await req.json()
        const { message, context_type, context_id, conversation_id } = body

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 1. Get or Create Conversation
        let conversationId = conversation_id

        if (!conversationId) {
            // Create new conversation
            const title = message.length > 30 ? message.substring(0, 30) + '...' : message
            const { data: conv, error: convError } = await supabase
                .from('conversation')
                .insert({
                    user_id: user.id,
                    title: title,
                    source: 'exam_question_bank',
                    context_type: context_type || null,
                    context_id: context_id ? String(context_id) : null
                })
                .select()
                .single()

            if (convError) throw new Error(`Failed to create conversation: ${convError.message}`)
            conversationId = conv.id
        }

        // 2. Save User Message
        const { error: msgError } = await supabase
            .from('conversation_message')
            .insert({
                conversation_id: conversationId,
                role: 'user',
                content: message,
                created_at: new Date().toISOString()
            })

        if (msgError) throw new Error(`Failed to save message: ${msgError.message}`)

        // 3. Call OpenAI
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) throw new Error('OPENAI_API_KEY not configured')

        const aiResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GPT_MODEL,
                messages: [
                    { role: 'system', content: 'You are a helpful legal assistant for the Taiwan Bar Exam.' },
                    { role: 'user', content: message }
                ], // Future: include history?
                temperature: 0.7
            })
        })

        if (!aiResponse.ok) {
            const err = await aiResponse.text()
            throw new Error(`OpenAI API error: ${aiResponse.status} - ${err}`)
        }

        const aiData = await aiResponse.json()
        const responseContent = aiData.choices[0]?.message?.content || 'No response from AI'

        // 4. Save AI Response
        const { error: aiMsgError } = await supabase
            .from('conversation_message')
            .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: responseContent,
                created_at: new Date().toISOString()
            })

        if (aiMsgError) console.error('Failed to save AI response:', aiMsgError)

        // 5. Return Response
        return new Response(JSON.stringify({
            role: 'assistant',
            content: responseContent,
            conversation_id: conversationId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
