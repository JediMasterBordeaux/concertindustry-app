// ============================================================
// Usage metering — server-side enforcement
// All checks happen here before any AI call is made.
// ============================================================
import { createAdminClient } from '@/lib/supabase/server';
import type { SubscriptionPlan } from '@/types';

const FREE_LIMIT = parseInt(process.env.FREE_TIER_QUERY_LIMIT || '75');

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  totalQueries: number;
  remaining: number;
  plan: SubscriptionPlan;
  softWarning?: 1 | 2;
}

export async function checkAndIncrementUsage(userId: string): Promise<UsageCheckResult> {
  const supabase = createAdminClient();

  // 1. Get subscription plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const plan: SubscriptionPlan = sub?.plan || 'free';
  const isProActive = (plan === 'pro_monthly' || plan === 'pro_annual') && sub?.status === 'active';

  // Pro users have unlimited queries
  if (isProActive) {
    // Still log the query for analytics
    await incrementUsage(userId, supabase);
    return { allowed: true, totalQueries: 0, remaining: Infinity, plan };
  }

  // 2. Get current usage
  const { data: usage } = await supabase
    .from('usage_metrics')
    .select('total_queries')
    .eq('user_id', userId)
    .single();

  const totalQueries = usage?.total_queries || 0;

  // 3. Hard limit check
  if (totalQueries >= FREE_LIMIT) {
    return {
      allowed: false,
      reason: `You've used all ${FREE_LIMIT} free queries. Upgrade to Pro for unlimited access.`,
      totalQueries,
      remaining: 0,
      plan,
    };
  }

  // 4. Increment usage
  await incrementUsage(userId, supabase);

  const newTotal = totalQueries + 1;
  const remaining = FREE_LIMIT - newTotal;

  // 5. Soft warnings
  let softWarning: 1 | 2 | undefined;
  if (newTotal >= 70) softWarning = 2;
  else if (newTotal >= 60) softWarning = 1;

  return {
    allowed: true,
    totalQueries: newTotal,
    remaining,
    plan,
    softWarning,
  };
}

async function incrementUsage(userId: string, supabase: ReturnType<typeof createAdminClient>) {
  // Upsert usage record
  const { data: existing } = await supabase
    .from('usage_metrics')
    .select('id, total_queries, queries_this_month')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase
      .from('usage_metrics')
      .update({
        total_queries: (existing.total_queries || 0) + 1,
        queries_this_month: (existing.queries_this_month || 0) + 1,
        last_query_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('usage_metrics')
      .insert({
        user_id: userId,
        total_queries: 1,
        queries_this_month: 1,
        last_query_at: new Date().toISOString(),
      });
  }
}

export async function getUserUsage(userId: string) {
  const supabase = createAdminClient();

  const [{ data: usage }, { data: sub }] = await Promise.all([
    supabase.from('usage_metrics').select('*').eq('user_id', userId).single(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single(),
  ]);

  const plan: SubscriptionPlan = sub?.plan || 'free';
  const isProActive = (plan === 'pro_monthly' || plan === 'pro_annual') && sub?.status === 'active';
  const totalQueries = usage?.total_queries || 0;
  const remaining = isProActive ? Infinity : Math.max(0, FREE_LIMIT - totalQueries);

  return {
    plan,
    isProActive,
    totalQueries,
    remaining,
    limit: FREE_LIMIT,
  };
}
