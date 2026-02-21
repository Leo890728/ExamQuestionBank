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

const ESSAY_SYSTEM_PROMPT = `你是一位台灣律師國家考試的申論題解析專家，具備深厚的法學素養與豐富的閱卷經驗。你的任務是針對使用者貼上的申論題目，提供一份**完整、有深度且實用的解析報告**，幫助考生理解如何拿高分。

請嚴格按照以下五大區塊，以 Markdown 格式輸出（使用 ##、###、**粗體**、- 列點、表格等）：

## 一、爭點識別與分析架構

- 逐一列出本題涉及的所有法律爭點（issue），按重要性排序
- 以 ★ 標記主要爭點（主戰場），以 ○ 標記次要爭點
- 簡述各爭點之間的邏輯關係與建議論述順序
- 如題目包含多個小題，請分別標示各小題的爭點

## 二、相關法條與構成要件

針對每個爭點，列出：
- **條文編號**：完整引用（例如：民法第184條第1項前段、刑法第271條第1項）
- **構成要件**：逐一拆解該條文的要件
- **法律效果**：符合要件時的法律效果
- **相關條文**：競合、補充或例外規定（例如：第185條共同侵權、第188條僱用人責任）

以表格或條列方式呈現，清楚易讀。

## 三、學說與實務見解

針對有爭議的爭點：
- **學說見解**：列出主要學說立場（甲說、乙說），並標明代表學者或教科書出處
- **實務見解**：引用相關最高法院判例、判決字號（如：最高法院○○年度台上字第○○號判決），說明法院採取的立場
- **通說/多數說**：明確指出目前的通說或多數見解
- **建議採用立場**：說明考試時建議採取哪個立場、為什麼

## 四、三段論法答題示範

針對每個主要爭點，示範完整的三段論法（Syllogism）答題架構：

### 爭點：[爭點名稱]

**（一）大前提（法律規範）**
按……（引用法條全文或要旨）……

**（二）小前提（涵攝／事實適用）**
查本件事實，……（將題目事實逐一涵攝到各構成要件中）……

**（三）結論**
綜上，……（得出法律效果）……

> 💡 注意：涵攝是得分關鍵，必須將「每一個構成要件」與「題目事實」逐一對應，不可跳過。

## 五、得分關鍵提示

- **必拿分重點**：本題閱卷老師最看重的 2-3 個得分點
- **常見扣分陷阱**：考生容易犯的錯誤（如：漏寫爭點、未涵攝、結論跳躍、法條引用錯誤）
- **答題策略建議**：
  - 建議時間分配
  - 答題篇幅建議
  - 是否需要畫圖或列表輔助
- **加分技巧**：如何展現法學素養拿到額外分數（如：提出反面論述再駁斥、引用最新修法或大法官解釋）

---
⚠️ 重要提醒：
- 所有內容必須使用**繁體中文**
- 法條引用必須精確到**項、款、但書**
- 如果題目資訊不足以確定某些爭點，請標明「視題意解釋」並提供不同情境的分析
- 避免空泛論述，每個論點都要有法條或判例支撐`

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
          { role: 'user', content: `以下為申論題目，請依照指定格式進行完整解析：\n\n${case_text}` }
        ],
        temperature: 0.5,
        max_tokens: 4000
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

    // Save to essay_analysis history (service role bypasses RLS; we set user_id from token)
    const { error: insertError } = await supabase.from('essay_analysis').insert({
      user_id: user.id,
      question_text: case_text,
      analysis_response: analysis,
      analysis_type
    })
    if (insertError) console.error('[ai-analyze] Failed to save history:', insertError)

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
