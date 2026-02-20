'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Subscription, UsageMetrics, UserRole, TourScale } from '@/types';
import { ROLE_LABELS, SCALE_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';

interface SettingsClientProps {
  profile: Profile | null;
  subscription: Subscription | null;
  usage: UsageMetrics | null;
}

export default function SettingsClient({ profile, subscription, usage }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [role, setRole] = useState<UserRole>(profile?.role || 'tm');
  const [tourScale, setTourScale] = useState<TourScale>(profile?.tour_scale || 'theater');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const plan = subscription?.plan || 'free';
  const isPro = (plan === 'pro_monthly' || plan === 'pro_annual') && subscription?.status === 'active';
  const totalQueries = usage?.total_queries || 0;
  const FREE_LIMIT = 75;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, role, tour_scale: tourScale })
      .eq('id', profile?.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }

    setSaving(false);
  }

  async function handleUpgrade(plan: 'monthly' | 'annual') {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Profile */}
        <section className="border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Default Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Default Tour Scale</label>
                <select
                  value={tourScale}
                  onChange={(e) => setTourScale(e.target.value as TourScale)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {(Object.entries(SCALE_LABELS) as [TourScale, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Subscription */}
        <section className="border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Subscription</h2>

          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="font-medium capitalize">
                {isPro ? (plan === 'pro_annual' ? 'Pro Annual' : 'Pro Monthly') : 'Free — Professional Trial'}
              </p>
              {isPro && subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
              {!isPro && (
                <p className="text-sm text-muted-foreground">
                  {Math.max(0, FREE_LIMIT - totalQueries)} of {FREE_LIMIT} free queries remaining
                </p>
              )}
            </div>
          </div>

          {!isPro && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade for unlimited queries, saved tours, budget tools, and settlement helpers.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade('monthly')}
                  className="border border-border rounded-md px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Pro Monthly — $9/mo
                </button>
                <button
                  onClick={() => handleUpgrade('annual')}
                  className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Pro Annual — $79/yr
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Usage Stats */}
        <section className="border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Usage</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold">{totalQueries}</p>
              <p className="text-sm text-muted-foreground">Total AI queries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{usage?.queries_this_month || 0}</p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
            {!isPro && (
              <div>
                <p className="text-2xl font-bold">{Math.max(0, FREE_LIMIT - totalQueries)}</p>
                <p className="text-sm text-muted-foreground">Free queries left</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
