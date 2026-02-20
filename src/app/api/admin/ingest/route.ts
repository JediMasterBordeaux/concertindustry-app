import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/openai';

// Admin-only route for ingesting documents into the knowledge base.
// Protect this endpoint — call it only from your backend scripts or admin UI.
// Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}

function chunkText(text: string, maxChunkSize: number = 800): string[] {
  const chunks: string[] = [];

  // Try paragraph-based chunking first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + '\n\n' + trimmed).length <= maxChunkSize) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());

      // If single paragraph is too long, split by sentences
      if (trimmed.length > maxChunkSize) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/);
        let sentenceChunk = '';
        for (const sentence of sentences) {
          if ((sentenceChunk + ' ' + sentence).length <= maxChunkSize) {
            sentenceChunk = sentenceChunk ? sentenceChunk + ' ' + sentence : sentence;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk.trim());
            sentenceChunk = sentence;
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk.trim();
        else currentChunk = '';
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.filter((c) => c.length > 50); // Skip tiny chunks
}

export async function POST(req: NextRequest) {
  // Simple token-based auth for admin route
  const authHeader = req.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { file_name, doc_type, raw_text } = await req.json() as {
      file_name: string;
      doc_type: string;
      raw_text: string;
    };

    if (!file_name || !raw_text) {
      return NextResponse.json({ error: 'file_name and raw_text are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Insert or update core doc
    const { data: doc, error: docError } = await adminClient
      .from('core_docs')
      .upsert(
        {
          file_name,
          doc_type: doc_type || 'general',
          raw_text,
          word_count: raw_text.split(/\s+/).length,
          char_count: raw_text.length,
        },
        { onConflict: 'file_name' }
      )
      .select('id')
      .single();

    if (docError || !doc) {
      throw new Error(`Failed to insert doc: ${docError?.message}`);
    }

    // Delete old chunks for this doc
    await adminClient.from('doc_chunks').delete().eq('doc_id', doc.id);

    // Chunk the text
    const chunks = chunkText(raw_text);
    console.log(`Chunked "${file_name}" into ${chunks.length} chunks`);

    // Generate embeddings and insert chunks (batched to avoid rate limits)
    const BATCH_SIZE = 10;
    let successCount = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const chunkRecords = await Promise.all(
        batch.map(async (chunkText, batchIdx) => {
          const chunkIndex = i + batchIdx;
          const embedding = await generateEmbedding(chunkText);
          return {
            doc_id: doc.id,
            chunk_index: chunkIndex,
            chunk_text: chunkText,
            embedding,
            token_count: Math.ceil(chunkText.length / 4), // rough estimate
          };
        })
      );

      const { error: insertError } = await adminClient
        .from('doc_chunks')
        .insert(chunkRecords);

      if (insertError) {
        console.error(`Batch ${i / BATCH_SIZE} failed:`, insertError);
      } else {
        successCount += batch.length;
      }

      // Small delay to avoid OpenAI rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      success: true,
      doc_id: doc.id,
      chunks_created: successCount,
      total_chunks: chunks.length,
    });
  } catch (err) {
    console.error('Ingest error:', err);
    return NextResponse.json({ error: 'Ingestion failed', details: String(err) }, { status: 500 });
  }
}
