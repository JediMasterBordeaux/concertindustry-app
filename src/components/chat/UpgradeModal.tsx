'use client';

import { useState } from 'react';
import { X, Zap, CheckCircle } from 'lucide-react';

interface UpgradeModalProps {
  reason?: string;
  onClose: () => void;
}

export default function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  async function handleUpgrade(plan: 'monthly' | 'annual') {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <h2 className="font-semibold">Upgrade to Pro</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {reason && (
            <div className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2.5 mb-5">
              {reason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Monthly */}
            <div className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Pro Monthly</p>
              <p className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
                className="mt-3 w-full border border-border rounded-md py-2 text-sm hover:bg-muted transition-colors disabled:opacity-60"
              >
                {loading === 'monthly' ? 'Redirecting...' : 'Start Monthly'}
              </button>
            </div>

            {/* Annual */}
            <div className="border-2 border-foreground rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Pro Annual</p>
              <p className="text-2xl font-bold">$79<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
              <p className="text-xs text-green-600 mb-0">Save $29</p>
              <button
                onClick={() => handleUpgrade('annual')}
                disabled={loading !== null}
                className="mt-2 w-full bg-foreground text-background rounded-md py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
              >
                {loading === 'annual' ? 'Redirecting...' : 'Start Annual'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {[
              'Unlimited AI queries',
              'Saved tours & conversation history',
              'Budget template generator',
              'Settlement helper',
              'Multi-currency support',
              'Advanced crisis workflows',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-foreground shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
