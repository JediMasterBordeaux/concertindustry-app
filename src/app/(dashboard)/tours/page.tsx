import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ToursClient from '@/components/tours/ToursClient';

export default async function ToursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_annual') && sub?.status === 'active';

  let tours = [];
  if (isPro) {
    const { data } = await supabase
      .from('tours')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    tours = data || [];
  }

  return <ToursClient initialTours={tours} isPro={isPro} />;
}
