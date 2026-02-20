import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { openai, buildSystemPrompt } from '@/lib/openai';
import { checkAndIncrementUsage } from '@/lib/usage';
import { retrieveRelevantChunks } from '@/lib/retrieval';
import type { AIRequestBody } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body: AIRequestBody = await req.json();
    const { message, role, tourScale, mode, tourId, conversationHistory = [] } = body;

    if (!message || !role || !tourScale || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Usage check & increment (server-side, cannot be bypassed)
    const usageCheck = await checkAndIncrementUsage(user.id);

    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, code: 'LIMIT_REACHED' },
        { status: 402 }
      );
    }

    // 4. Retrieve relevant doc chunks (RAG)
    const chunks = await retrieveRelevantChunks(message, 8);

    // 5. Build system prompt
    const systemPrompt = buildSystemPrompt(role, tourScale, mode, chunks);

    // 6. Fetch user preferences for context
    const adminClient = createAdminClient();
    const { data: prefs } = await adminClient
      .from('user_preferences')
      .select('default_currency')
      .eq('user_id', user.id)
      .single();

    const currency = prefs?.default_currency || 'USD';
    const fullSystemPrompt = `${systemPrompt}\n\nUser's preferred currency: ${currency}`;

    // 7. Call OpenAI
    const messages = [
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...messages,
      ],
      max_tokens: mode === 'crisis' ? 800 : 2000,
      temperature: mode === 'crisis' ? 0.3 : 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'No response generated.';

    // 8. Log conversation
    const { data: logEntry } = await adminClient
      .from('conversation_logs')
      .insert({
        user_id: user.id,
        tour_id: tourId || null,
        role,
        tour_scale: tourScale,
        mode,
        user_message: message,
        assistant_message: assistantMessage,
        retrieved_chunk_ids: chunks.map((c) => c.id),
      })
      .select('id')
      .single();

    return NextResponse.json({
      message: assistantMessage,
      remainingQueries: usageCheck.remaining === Infinity ? null : usageCheck.remaining,
      softWarning: usageCheck.softWarning,
      conversationLogId: logEntry?.id,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
