import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { openai, buildSystemPrompt } from '@/lib/openai';
import { checkAndIncrementUsage } from '@/lib/usage';
import { retrieveRelevantChunks } from '@/lib/retrieval';
import type { UserRole, TourScale } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, role, tourScale, topic } = await req.json() as {
      query: string;
      role: UserRole;
      tourScale: TourScale;
      topic?: string;
    };

    if (!query || !role || !tourScale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Usage check
    const usageCheck = await checkAndIncrementUsage(user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, code: 'LIMIT_REACHED' },
        { status: 402 }
      );
    }

    // Retrieve chunks — filter by topic doc type if provided
    const chunks = await retrieveRelevantChunks(query, 10, topic);

    // Build knowledge-mode system prompt
    const systemPrompt = buildSystemPrompt(role, tourScale, 'knowledge', chunks);

    const knowledgeInstruction = `
The user is searching the knowledge base. Respond with a structured, article-style answer:
- Start with a clear, bold heading
- Use organized sections with subheadings where appropriate
- Include bullet points and numbered checklists
- Include a "Key Watchouts" or "Common Mistakes" section if relevant
- Be comprehensive but scannable — this is reference material
- If the topic has different implications for different tour scales, note them explicitly
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt + knowledgeInstruction },
        { role: 'user', content: query },
      ],
      max_tokens: 2500,
      temperature: 0.5,
    });

    const answer = completion.choices[0]?.message?.content || 'No response generated.';

    // Log
    const adminClient = createAdminClient();
    await adminClient.from('conversation_logs').insert({
      user_id: user.id,
      role,
      tour_scale: tourScale,
      mode: 'knowledge',
      user_message: query,
      assistant_message: answer,
      retrieved_chunk_ids: chunks.map((c) => c.id),
    });

    return NextResponse.json({
      answer,
      remainingQueries: usageCheck.remaining === Infinity ? null : usageCheck.remaining,
    });
  } catch (err) {
    console.error('Knowledge search error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
