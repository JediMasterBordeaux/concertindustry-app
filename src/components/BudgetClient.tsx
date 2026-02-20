'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DollarSign, Zap } from 'lucide-react';
import type { TourType, TourScale } from '@/types';

interface BudgetClientProps {
  isPro: boolean;
  tours: { id: string; name: string; artist_name: string }[];
}

export default function BudgetClient({ isPro, tours }: BudgetClientProps) {
  const [form, setForm] = useState({
    tour_type: 'headline' as TourType,
    tour_scale: 'theater' as TourScale,
    num_shows: '',
    avg_capacity: '',
    avg_guarantee: '',
    currency: 'USD',
    tour_id: '',
    regions: 'US',
  });

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult('');

    const prompt = `Generate a detailed budget template for the following tour:
- Tour type: ${form.tour_type}
- Scale: ${form.tour_scale}
- Number of shows: ${form.num_shows || 'unknown'}
- Average capacity: ${form.avg_capacity || 'unknown'}
- Average guarantee/expected gross: ${form.avg_guarantee ? `${form.currency} ${form.avg_guarantee}` : 'not specified'}
- Regions: ${form.regions}
- Currency: ${form.currency}

Provide a structured budget with all major categories, estimated ranges for each, and show the estimated margin range.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: 'tm',
          tourScale: form.tour_scale,
          mode: 'budget',
          tourId: form.tour_id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate budget');
      } else {
        setResult(data.message);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3">Budget Template Generator</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Generate structured tour budgets by tour type, scale, and expected numbers.
          Get AI-powered margin estimates and line-item breakdowns. Pro feature.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          All financial guidance is informational only — not financial or legal advice.
        </p>
        <Link
          href="/chat?upgrade=true"
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-medium hover:bg-foreground/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to Pro — $9/month
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Budget Template Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate a structured tour budget with estimated ranges. All figures are informational only.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Input form */}
        <div className="col-span-2">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tour Type</label>
              <select
                value={form.tour_type}
                onChange={(e) => setForm({ ...form, tour_type: e.target.value as TourType })}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="headline">Headline</option>
                <option value="support">Support</option>
                <option value="festival">Festival-Heavy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Tour Scale</label>
              <select
                value={form.tour_scale}
                onChange={(e) => setForm({ ...form, tour_scale: e.target.value as TourScale })}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="club">Club</option>
                <option value="theater">Theater</option>
                <option value="arena">Arena</option>
                <option value="stadium">Stadium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Number of Shows</label>
              <input
                type="number"
                value={form.num_shows}
                onChange={(e) => setForm({ ...form, num_shows: e.target.value })}
                placeholder="e.g. 24"
                min="1"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Average Capacity</label>
              <input
                type="number"
                value={form.avg_capacity}
                onChange={(e) => setForm({ ...form, avg_capacity: e.target.value })}
                placeholder="e.g. 2500"
                min="1"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Avg. Guarantee / Expected Gross</label>
              <input
                type="number"
                value={form.avg_guarantee}
                onChange={(e) => setForm({ ...form, avg_guarantee: e.target.value })}
                placeholder="e.g. 25000"
                min="0"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Regions</label>
                <input
                  value={form.regions}
                  onChange={(e) => setForm({ ...form, regions: e.target.value })}
                  placeholder="US, EU"
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {tours.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Attach to Tour (optional)</label>
                <select
                  value={form.tour_id}
                  onChange={(e) => setForm({ ...form, tour_id: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">No tour</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.artist_name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate Budget Template'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="col-span-3">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              Generating budget template...
            </div>
          )}

          {result && !loading && (
            <div className="border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  AI Budget Template
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="prose-ci text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⚠ These are estimates only. All figures are informational and not financial advice.
                  Verify all numbers with actual deal memos and contracts.
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Fill out the form and generate a budget template.</p>
              <p className="text-xs mt-1">Results include line items, estimated ranges, and margin guidance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
