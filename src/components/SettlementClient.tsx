'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, Zap } from 'lucide-react';

interface SettlementClientProps {
  isPro: boolean;
  tours: { id: string; name: string; artist_name: string }[];
}

export default function SettlementClient({ isPro, tours }: SettlementClientProps) {
  const [form, setForm] = useState({
    show_name: '',
    venue_name: '',
    venue_city: '',
    show_date: '',
    currency: 'USD',
    gross_tickets: '',
    total_taxes: '',
    total_fees: '',
    venue_rent: '',
    marketing_costs: '',
    production_reimbursements: '',
    artist_guarantee: '',
    overage_percentage: '85',
    merch_deal_details: '',
    tour_id: '',
  });

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult('');

    const prompt = `Walk me through the settlement for this show:

Show: ${form.show_name || 'Single Show'}
Venue: ${form.venue_name || 'Not specified'}, ${form.venue_city || ''}
Date: ${form.show_date || 'Not specified'}
Currency: ${form.currency}

Financial figures:
- Gross ticket sales: ${form.currency} ${form.gross_tickets || '0'}
- Total taxes: ${form.currency} ${form.total_taxes || '0'}
- Total facility/service fees: ${form.currency} ${form.total_fees || '0'}
- Venue rent: ${form.currency} ${form.venue_rent || '0'}
- Marketing costs: ${form.currency} ${form.marketing_costs || '0'}
- Production reimbursements: ${form.currency} ${form.production_reimbursements || '0'}
- Artist guarantee: ${form.currency} ${form.artist_guarantee || '0'}
- Overage split (artist percentage): ${form.overage_percentage}%
${form.merch_deal_details ? `- Merch deal: ${form.merch_deal_details}` : ''}

Provide:
1. Step-by-step settlement calculation
2. Final artist payment amount
3. Any watchouts or common issues to watch for with these numbers`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: 'tm',
          tourScale: 'theater',
          mode: 'settlement',
          tourId: form.tour_id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Settlement calculation failed');
      } else {
        setResult(data.message);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring';

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3">Settlement Helper</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Walk through venue settlements step-by-step. Input your show numbers and get a clear calculation
          with watchouts and deal analysis. Pro feature.
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Settlement Helper</h1>
        <p className="text-sm text-muted-foreground">
          Enter show financials for a step-by-step settlement walkthrough. All figures are informational only.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Input form */}
        <div className="col-span-2">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Show Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Show Name</label>
                  <input value={form.show_name} onChange={(e) => setForm({ ...form, show_name: e.target.value })} placeholder="e.g. NYC @ Webster Hall" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Venue</label>
                    <input value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} placeholder="Venue name" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">City</label>
                    <input value={form.venue_city} onChange={(e) => setForm({ ...form, venue_city: e.target.value })} placeholder="City" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Show Date</label>
                    <input type="date" value={form.show_date} onChange={(e) => setForm({ ...form, show_date: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Currency</label>
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Revenue & Costs</h3>
              <div className="space-y-3">
                {[
                  { key: 'gross_tickets', label: 'Gross Ticket Sales', required: true },
                  { key: 'total_taxes', label: 'Total Taxes' },
                  { key: 'total_fees', label: 'Facility / Service Fees' },
                  { key: 'venue_rent', label: 'Venue Rent' },
                  { key: 'marketing_costs', label: 'Marketing Costs' },
                  { key: 'production_reimbursements', label: 'Production Reimbursements' },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-xs text-muted-foreground mb-1">{label}{required && ' *'}</label>
                    <input
                      type="number"
                      value={(form as Record<string, string>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required={required}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Artist Deal</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Artist Guarantee *</label>
                  <input
                    type="number"
                    value={form.artist_guarantee}
                    onChange={(e) => setForm({ ...form, artist_guarantee: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Artist Overage % (of net)</label>
                  <input
                    type="number"
                    value={form.overage_percentage}
                    onChange={(e) => setForm({ ...form, overage_percentage: e.target.value })}
                    placeholder="85"
                    min="0"
                    max="100"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Merch Deal Notes</label>
                  <input
                    value={form.merch_deal_details}
                    onChange={(e) => setForm({ ...form, merch_deal_details: e.target.value })}
                    placeholder="e.g. 20% to house, hard count"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {tours.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Attach to Tour (optional)</label>
                <select value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })} className={inputClass}>
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
              {loading ? 'Calculating...' : 'Run Settlement'}
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
              Running settlement calculation...
            </div>
          )}

          {result && !loading && (
            <div className="border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Settlement Breakdown
                </span>
                <button onClick={() => navigator.clipboard.writeText(result)} className="text-xs text-muted-foreground hover:text-foreground">
                  Copy
                </button>
              </div>
              <div className="prose-ci text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⚠ These calculations are informational only and not financial or legal advice.
                  Always verify figures against the signed deal memo and venue contract.
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <Calculator className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Enter show details and run the settlement.</p>
              <p className="text-xs mt-1">Results include step-by-step calculations and watchouts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
