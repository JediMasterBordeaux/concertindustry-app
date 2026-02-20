'use client';

import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import type { UserRole, TourScale } from '@/types';
import { ROLE_LABELS, SCALE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const TOPICS = [
  { value: 'tour_management', label: 'Tour Management' },
  { value: 'accounting', label: 'Accounting & Settlement' },
  { value: 'production', label: 'Production' },
  { value: 'audio_engineering', label: 'Audio Engineering' },
  { value: 'international', label: 'International Touring' },
  { value: 'health', label: 'Health & Wellbeing' },
  { value: 'festival', label: 'Festivals' },
  { value: 'stage_management', label: 'Stage Management' },
  { value: 'backline', label: 'Backline' },
  { value: 'promotion', label: 'Promotion' },
];

const QUICK_SEARCHES = [
  'How does a standard venue settlement work?',
  'What is a "soft ticket" deal and how does it affect settlement?',
  'What should I advance with a venue I\'ve never worked before?',
  'How do per diems typically work on a touring budget?',
  'What are the key differences in touring in Japan vs. the US?',
  'How do I handle a touring mental health crisis in my crew?',
  'What\'s the difference between a guarantee and a vs. deal?',
  'How do I approach a promoter disputing the settlement numbers?',
  'What should a PA\'s daily check-in process look like?',
];

interface KnowledgeClientProps {
  defaultRole: UserRole;
  defaultScale: TourScale;
  isPro: boolean;
  remainingQueries: number | null;
}

export default function KnowledgeClient({ defaultRole, defaultScale, isPro, remainingQueries }: KnowledgeClientProps) {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [tourScale, setTourScale] = useState<TourScale>(defaultScale);
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(remainingQueries);

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery || query.trim();
    if (!q) return;

    setQuery(q);
    setLoading(true);
    setError(null);
    setAnswer('');

    try {
      const res = await fetch('/api/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, role, tourScale, topic: topic || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError('You\'ve reached your free query limit. Upgrade to Pro for unlimited access.');
        } else {
          setError(data.error || 'Search failed. Please try again.');
        }
        return;
      }

      setAnswer(data.answer);
      if (data.remainingQueries !== undefined) {
        setRemaining(data.remainingQueries);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered search across institutional touring knowledge. Get structured, reference-quality answers.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={tourScale}
          onChange={(e) => setTourScale(e.target.value as TourScale)}
          className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {(Object.entries(SCALE_LABELS) as [TourScale, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Topics</option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {!isPro && remaining !== null && (
          <span className="ml-auto text-xs text-muted-foreground">{remaining} queries left</span>
        )}
      </div>

      {/* Search input */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 flex items-center gap-2 border border-input rounded-lg px-4 py-3 bg-background focus-within:ring-1 focus-within:ring-ring">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search the knowledge base..."
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || loading}
          className="bg-foreground text-background px-4 py-3 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Answer */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {answer && (
        <div className="border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Knowledge Base Result</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {ROLE_LABELS[role]} · {SCALE_LABELS[tourScale]}
            </span>
          </div>
          <div className="prose-ci text-sm leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => navigator.clipboard.writeText(answer)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}

      {/* Quick search suggestions (shown when no answer yet) */}
      {!answer && !loading && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Common searches
          </p>
          <div className="space-y-1.5">
            {QUICK_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="w-full text-left text-sm border border-border rounded-md px-4 py-2.5 hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
