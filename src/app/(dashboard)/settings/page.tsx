import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileResult, subResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('usage_metrics').select('*').eq('user_id', user.id).single(),
  ]);

  return (
    <SettingsClient
      profile={profileResult.data}
      subscription={subResult.data}
      usage={usageResult.data}
    />
  );
}
