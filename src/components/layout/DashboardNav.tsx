'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Profile, SubscriptionPlan } from '@/types';
import { MessageSquare, FolderOpen, BookOpen, DollarSign, Calculator, Settings, LogOut, Zap } from 'lucide-react';

interface DashboardNavProps {
  profile: Profile | null;
  plan: SubscriptionPlan;
  isPro: boolean;
  remainingQueries: number | null;
}

const NAV_ITEMS = [
  { href: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/tours', label: 'Tours', icon: FolderOpen, proOnly: true },
  { href: '/budget', label: 'Budget', icon: DollarSign, proOnly: true },
  { href: '/settlement', label: 'Settlement', icon: Calculator, proOnly: true },
];

export default function DashboardNav({ profile, plan, isPro, remainingQueries }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const FREE_LIMIT = 75;
  const usedQueries = remainingQueries !== null ? FREE_LIMIT - remainingQueries : 0;
  const pct = remainingQueries !== null ? (usedQueries / FREE_LIMIT) * 100 : 0;

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/chat" className="font-semibold text-base tracking-tight shrink-0">
          ConcertIndustry
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 mx-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const locked = item.proOnly && !isPro;
            return (
              <Link
                key={item.href}
                href={locked ? '/chat?upgrade=true' : item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  locked && 'opacity-50'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
                {locked && <span className="text-[10px] font-mono">PRO</span>}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Free tier usage bar */}
          {!isPro && remainingQueries !== null && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {remainingQueries} queries left
              </div>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct >= 90 ? 'bg-destructive' : pct >= 75 ? 'bg-yellow-500' : 'bg-foreground'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Upgrade button (free only) */}
          {!isPro && (
            <Link
              href="/chat?upgrade=true"
              className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 py-1.5 rounded-md hover:bg-foreground/90 transition-colors font-medium"
            >
              <Zap className="w-3 h-3" />
              Upgrade
            </Link>
          )}

          {/* Pro badge */}
          {isPro && (
            <span className="text-xs font-mono bg-foreground text-background px-2 py-0.5 rounded uppercase tracking-wider">
              Pro
            </span>
          )}

          {/* Settings */}
          <Link
            href="/settings"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
