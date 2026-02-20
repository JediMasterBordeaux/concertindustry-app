import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BudgetClient from '@/components/BudgetClient';

export default async function BudgetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_annual') && sub?.status === 'active';

  const { data: tours } = isPro
    ? await supabase.from('tours').select('id, name, artist_name').eq('user_id', user.id).eq('is_archived', false)
    : { data: [] };

  return <BudgetClient isPro={isPro} tours={tours || []} />;
}
