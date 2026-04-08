// Edge Function: ai-chat
// Handles AI chat requests and saves history to Supabase
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GPT_MODEL = 'gpt-4o-mini'
const LEGAL_CHAT_SYSTEM_PROMPT = `你是台灣法律考試 AI 助教，專門協助使用者解答台灣法科選擇題與申論題。

回答規則：
- 一律只用繁體中文（zh-TW）作答。
- 不要使用簡體中文。
- 除了法條編號、英文字母選項（例如 A、B、C、D）或必要專有名詞外，不要夾雜英文句子。
- 以台灣法律為預設基準；除非題目明確要求比較法或外國法，否則不要自行切換法域。
- 以題目所給事實、穩定的台灣法律原理與考試解題邏輯為基礎作答。
- 法條號碼、制度名稱或結論若不確定，要明白說明，不得編造。
- 如果使用者提供「正確答案」，可以把它當成參考，但仍要自行檢驗；若答案與法律分析不一致，要明確指出可能是題幹、答案鍵或敘述有誤。

遇到選擇題時，請依下列步驟作答：
1. 先判讀題幹到底是在問「何者正確」還是「何者錯誤／不正確／不當」。
2. 若題幹是反向題，必須明白指出：「正確答案」指的是應被選出的錯誤選項，而不是內容本身正確的選項。
3. 先整理本題爭點，指出在考什麼法律概念。
4. 再逐一檢視每個選項，明確標示該選項本身是「正確」或「錯誤」，並用 1 到 3 句說明理由。
5. 全部選項分析完後，再依題幹要求指出應選哪一個選項，並說明為什麼。
6. 不得只講正確答案；落選選項也要交代為什麼不能選。

輸出格式：
- 直接進入法律分析，不要先說空話或寫成一般聊天口吻。
- 不要使用 Markdown 標題語法，例如 #、##、###。
- 小標一律改用粗體文字，例如 **題幹判讀**、**爭點**、**選項分析**、**結論**。
- 可以使用一般條列符號，例如 - 或 1. 2. 3.，但不要把版面寫得像文件標題。
- 內容要精簡，但要足以讓考生看懂判斷路徑。
- 對有把握的內容，盡量寫出法條名稱與條號。
- 如果本題關鍵在程序法上的區別，必須明確點出，例如外國判決之承認、許可執行、執行名義、既判力、國際管轄等概念的差異。
- 整體語氣要像嚴謹的台灣法律家教，不要像泛用聊天機器人。`

interface ChatRequest {
    message: string
    context_type?: string
    context_id?: string | number
    conversation_id?: string
}

function buildUserMessage(body: ChatRequest): string {
    const metadata: string[] = []

    if (body.context_type) metadata.push(`題目類型：${body.context_type}`)
    if (body.context_id !== undefined && body.context_id !== null) {
        metadata.push(`題目編號：${String(body.context_id)}`)
    }

    if (metadata.length === 0) return body.message

    return `題目背景：\n${metadata.join('\n')}\n\n使用者問題：\n${body.message}`
}

serve(async (req: Request) => {
    console.log(`[ai-chat] Received ${req.method} request`)

    if (req.method === 'OPTIONS') {
        console.log('[ai-chat] Handling OPTIONS request')
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

        let conversationId = conversation_id

        if (!conversationId) {
            const title = message.length > 30 ? message.substring(0, 30) + '...' : message
            const { data: conv, error: convError } = await supabase
                .from('conversation')
                .insert({
                    user_id: user.id,
                    title,
                    source: 'exam_question_bank',
                    context_type: context_type || null,
                    context_id: context_id ? String(context_id) : null
                })
                .select()
                .single()

            if (convError) throw new Error(`Failed to create conversation: ${convError.message}`)
            conversationId = conv.id
        }

        const { error: msgError } = await supabase
            .from('conversation_message')
            .insert({
                conversation_id: conversationId,
                role: 'user',
                content: message,
                created_at: new Date().toISOString()
            })

        if (msgError) throw new Error(`Failed to save message: ${msgError.message}`)

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) throw new Error('OPENAI_API_KEY not configured')

        const aiResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GPT_MODEL,
                messages: [
                    { role: 'system', content: LEGAL_CHAT_SYSTEM_PROMPT },
                    { role: 'user', content: buildUserMessage(body) }
                ],
                temperature: 0.3,
                max_tokens: 1800
            })
        })

        if (!aiResponse.ok) {
            const err = await aiResponse.text()
            throw new Error(`OpenAI API error: ${aiResponse.status} - ${err}`)
        }

        const aiData = await aiResponse.json()
        const responseContent = aiData.choices[0]?.message?.content || 'No response from AI'

        const { error: aiMsgError } = await supabase
            .from('conversation_message')
            .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: responseContent,
                created_at: new Date().toISOString()
            })

        if (aiMsgError) console.error('Failed to save AI response:', aiMsgError)

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
