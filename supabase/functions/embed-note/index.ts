import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmbedNoteRequest {
  note_id: string;
  content: string;
  table?: 'exam_note' | 'legal_note';
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { note_id, content, table = 'exam_note' }: EmbedNoteRequest = await req.json();

    if (!note_id || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: note_id, content' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    // Generate embedding via OpenAI
    console.log(`Generating embedding for note ${note_id} (${content.length} chars)`);

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content.substring(0, 8000), // Limit to ~8k chars for token safety
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Store embedding in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const embeddingTable = table === 'exam_note'
      ? 'exam_note_embedding'
      : 'legal_note_embedding';

    const { error: dbError } = await supabase
      .from(embeddingTable)
      .upsert({
        note_id,
        embedding,
        model: 'text-embedding-3-small',
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'note_id',
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`Successfully stored embedding for note ${note_id} in ${embeddingTable}`);

    return new Response(
      JSON.stringify({
        success: true,
        note_id,
        table: embeddingTable,
        embedding_dimensions: embedding.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in embed-note function:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
