import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/layout/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile, subscription, and usage in parallel
  const [profileResult, subResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
    supabase.from('usage_metrics').select('total_queries').eq('user_id', user.id).single(),
  ]);

  const profile = profileResult.data;
  const subscription = subResult.data;
  const usage = usageResult.data;

  const plan = subscription?.plan || 'free';
  const isPro = (plan === 'pro_monthly' || plan === 'pro_annual') && subscription?.status === 'active';
  const totalQueries = usage?.total_queries || 0;
  const remainingQueries = isPro ? null : Math.max(0, 75 - totalQueries);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav
        profile={profile}
        plan={plan}
        isPro={isPro}
        remainingQueries={remainingQueries}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
