import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KnowledgeClient from '@/components/KnowledgeClient';

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileResult, subResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('role, tour_scale').eq('id', user.id).single(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
    supabase.from('usage_metrics').select('total_queries').eq('user_id', user.id).single(),
  ]);

  const plan = subResult.data?.plan || 'free';
  const isPro = (plan === 'pro_monthly' || plan === 'pro_annual') && subResult.data?.status === 'active';
  const totalQueries = usageResult.data?.total_queries || 0;
  const remainingQueries = isPro ? null : Math.max(0, 75 - totalQueries);

  return (
    <KnowledgeClient
      defaultRole={profileResult.data?.role || 'tm'}
      defaultScale={profileResult.data?.tour_scale || 'theater'}
      isPro={isPro}
      remainingQueries={remainingQueries}
    />
  );
}
