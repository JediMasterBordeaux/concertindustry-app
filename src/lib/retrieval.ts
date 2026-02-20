// ============================================================
// Vector retrieval — fetches relevant doc chunks for a query
// ============================================================
import { createAdminClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/openai';
import type { DocChunk } from '@/types';

export async function retrieveRelevantChunks(
  query: string,
  matchCount: number = 8,
  docType?: string
): Promise<DocChunk[]> {
  try {
    const supabase = createAdminClient();

    // Generate embedding for the user's query
    const embedding = await generateEmbedding(query);

    // Call the match_doc_chunks database function
    const { data, error } = await supabase.rpc('match_doc_chunks', {
      query_embedding: embedding,
      match_count: matchCount,
      filter_doc_type: docType || null,
    });

    if (error) {
      console.error('Vector search error:', error);
      return [];
    }

    return (data as DocChunk[]) || [];
  } catch (err) {
    console.error('Retrieval error:', err);
    return [];
  }
}
