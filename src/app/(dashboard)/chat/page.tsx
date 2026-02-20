import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/chat/ChatInterface';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, subResult, usageResult, prefsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user!.id).single(),
    supabase.from('usage_metrics').select('total_queries').eq('user_id', user!.id).single(),
    supabase.from('user_preferences').select('*').eq('user_id', user!.id).single(),
  ]);

  const profile = profileResult.data;
  const subscription = subResult.data;
  const usage = usageResult.data;
  const prefs = prefsResult.data;

  const plan = subscription?.plan || 'free';
  const isPro = (plan === 'pro_monthly' || plan === 'pro_annual') && subscription?.status === 'active';
  const totalQueries = usage?.total_queries || 0;
  const remainingQueries = isPro ? null : Math.max(0, 75 - totalQueries);

  const defaultRole = prefs?.default_role || profile?.role || 'tm';
  const defaultScale = prefs?.default_tour_scale || profile?.tour_scale || 'theater';

  return (
    <ChatInterface
      userId={user!.id}
      defaultRole={defaultRole}
      defaultScale={defaultScale}
      isPro={isPro}
      remainingQueries={remainingQueries}
      plan={plan}
    />
  );
}
