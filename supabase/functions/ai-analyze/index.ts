// Edge Function: ai-analyze
// AI Essay / Case analysis for the exam question bank
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GPT_MODEL = 'gpt-4o-mini'

interface AnalyzeRequest {
  case_text: string
  analysis_type?: 'essay' | 'case'
}

const ESSAY_SYSTEM_PROMPT = `You are an expert legal assistant for the Taiwan Bar Exam. The user will paste essay or case text. Provide a clear, structured analysis in Traditional Chinese: (1) identify key legal issues, (2) applicable law and principles, (3) reasoning and application to the facts, (4) conclusion. Be concise but thorough.`

serve(async (req: Request) => {
  console.log(`[ai-analyze] Received ${req.method} request`)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: AnalyzeRequest = await req.json()
    const { case_text, analysis_type = 'essay' } = body

    if (!case_text || typeof case_text !== 'string') {
      return new Response(JSON.stringify({ error: 'case_text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: 'system', content: ESSAY_SYSTEM_PROMPT },
          { role: 'user', content: case_text }
        ],
        temperature: 0.5
      })
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      console.error('[ai-analyze] OpenAI error:', err)
      return new Response(JSON.stringify({ error: `AI service error: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiData = await aiResponse.json()
    const analysis = aiData.choices[0]?.message?.content ?? 'No response from AI'

    return new Response(
      JSON.stringify({
        analysis,
        analysis_type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('[ai-analyze] Error:', error)
    return new Response(
      JSON.stringify({
        error: error?.message ?? 'Internal server error',
        stack: error?.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
