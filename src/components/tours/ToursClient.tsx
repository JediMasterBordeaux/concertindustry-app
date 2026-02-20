'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Zap, Calendar, MapPin } from 'lucide-react';
import type { Tour, TourScale, TourType } from '@/types';
import { formatDate } from '@/lib/utils';

interface ToursClientProps {
  initialTours: Tour[];
  isPro: boolean;
}

const SCALE_COLORS: Record<TourScale, string> = {
  club: 'bg-slate-100 text-slate-700',
  theater: 'bg-blue-100 text-blue-700',
  arena: 'bg-purple-100 text-purple-700',
  stadium: 'bg-amber-100 text-amber-700',
};

export default function ToursClient({ initialTours, isPro }: ToursClientProps) {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    artist_name: '',
    tour_scale: 'theater' as TourScale,
    tour_type: 'headline' as TourType,
    start_date: '',
    end_date: '',
    regions: 'US',
    currency: 'USD',
    num_shows: '',
    avg_capacity: '',
    notes: '',
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          regions: form.regions.split(',').map((r) => r.trim()).filter(Boolean),
          num_shows: form.num_shows ? parseInt(form.num_shows) : null,
          avg_capacity: form.avg_capacity ? parseInt(form.avg_capacity) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTours((prev) => [data.tour, ...prev]);
        setShowCreate(false);
        setForm({
          name: '', artist_name: '', tour_scale: 'theater', tour_type: 'headline',
          start_date: '', end_date: '', regions: 'US', currency: 'USD', num_shows: '', avg_capacity: '', notes: '',
        });
      }
    } finally {
      setCreating(false);
    }
  }

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3">Saved Tours</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Organize your work by tour. Save conversation history, budgets, and settlements to specific projects.
          Available on Pro.
        </p>

        {/* Demo tour */}
        <div className="border border-border rounded-lg p-5 text-left max-w-sm mx-auto mb-8 opacity-60 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Theater</span>
            <span className="text-xs text-muted-foreground">Headline</span>
          </div>
          <h3 className="font-semibold">Spring 2024 NA Tour</h3>
          <p className="text-sm text-muted-foreground">Example Artist</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>24 shows</span>
            <span>US, CA</span>
          </div>
        </div>

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Tours</h1>
          <p className="text-sm text-muted-foreground mt-1">{tours.length} active tour{tours.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Tour
        </button>
      </div>

      {tours.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No tours yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first tour to start organizing your work.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm border border-border rounded-md px-4 py-2 hover:bg-muted transition-colors"
          >
            Create a Tour
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/tours/${tour.id}`}
              className="border border-border rounded-lg p-5 hover:border-foreground/40 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SCALE_COLORS[tour.tour_scale]}`}>
                      {tour.tour_scale}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{tour.tour_type}</span>
                  </div>
                  <h3 className="font-semibold group-hover:underline">{tour.name}</h3>
                  <p className="text-sm text-muted-foreground">{tour.artist_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {(tour.start_date || tour.end_date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(tour.start_date)} – {formatDate(tour.end_date)}
                  </span>
                )}
                {tour.regions && tour.regions.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {tour.regions.join(', ')}
                  </span>
                )}
                {tour.num_shows && <span>{tour.num_shows} shows</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Tour Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
              <h2 className="font-semibold">New Tour</h2>
              <button onClick={() => setShowCreate(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tour Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Spring 2024 NA Tour"
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Artist Name *</label>
                  <input
                    value={form.artist_name}
                    onChange={(e) => setForm({ ...form, artist_name: e.target.value })}
                    placeholder="Artist Name"
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-sm font-medium mb-1.5">Tour Type</label>
                  <select
                    value={form.tour_type}
                    onChange={(e) => setForm({ ...form, tour_type: e.target.value as TourType })}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="headline">Headline</option>
                    <option value="support">Support</option>
                    <option value="festival">Festival</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Regions (comma-separated)</label>
                  <input
                    value={form.regions}
                    onChange={(e) => setForm({ ...form, regions: e.target.value })}
                    placeholder="US, EU, UK"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
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
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Number of Shows</label>
                  <input
                    type="number"
                    value={form.num_shows}
                    onChange={(e) => setForm({ ...form, num_shows: e.target.value })}
                    placeholder="24"
                    min="1"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Avg. Capacity</label>
                  <input
                    type="number"
                    value={form.avg_capacity}
                    onChange={(e) => setForm({ ...form, avg_capacity: e.target.value })}
                    placeholder="2500"
                    min="1"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this tour..."
                  rows={2}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-border rounded-md py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-foreground text-background rounded-md py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
