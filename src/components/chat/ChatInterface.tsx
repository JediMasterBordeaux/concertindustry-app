'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, Zap, Star, ThumbsUp, ThumbsDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole, TourScale, SubscriptionPlan, ChatMessage, ChatMode } from '@/types';
import { ROLE_LABELS, SCALE_LABELS, FREE_TIER_LIMIT } from '@/types';
import UpgradeModal from '@/components/chat/UpgradeModal';

interface ChatInterfaceProps {
  userId: string;
  defaultRole: UserRole;
  defaultScale: TourScale;
  isPro: boolean;
  remainingQueries: number | null;
  plan: SubscriptionPlan;
  tourId?: string;
  tourName?: string;
}

const MODE_LABELS: Record<ChatMode, string> = {
  chat: 'Operational Q&A',
  knowledge: 'Knowledge Base',
  budget: 'Budget',
  settlement: 'Settlement',
  crisis: 'Crisis Mode',
};

const STARTER_PROMPTS: Partial<Record<UserRole, string[]>> = {
  tm: [
    'Walk me through a standard venue settlement for a theater show',
    'What should be in a standard per diem policy for a 30-day tour?',
    'Promoter is claiming force majeure on a cancellation. What are my options?',
  ],
  pm: [
    'What should I advance with a new venue I\'ve never worked before?',
    'Give me a load-in call sheet template for an arena show',
    'How do I handle a last-minute stage plot change from support act?',
  ],
  pa: [
    'What\'s the best way to organize a hotel rooming list?',
    'How do I set up a travel sheet for a 10-person tour party?',
    'What does a day-of-show checklist look like for a PA?',
  ],
};

export default function ChatInterface({
  userId,
  defaultRole,
  defaultScale,
  isPro,
  remainingQueries,
  plan,
  tourId,
  tourName,
}: ChatInterfaceProps) {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [tourScale, setTourScale] = useState<TourScale>(defaultScale);
  const [mode, setMode] = useState<ChatMode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(remainingQueries);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isCrisisMode = mode === 'crisis';

  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || loading) return;

    // Check remaining queries client-side (server also checks)
    if (!isPro && remaining !== null && remaining <= 0) {
      setUpgradeReason('You\'ve used all your free queries.');
      setShowUpgrade(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    // Build conversation history (last 6 exchanges)
    const history = messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role,
          tourScale,
          mode,
          tourId,
          conversationHistory: history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setUpgradeReason(data.error || 'Upgrade required');
          setShowUpgrade(true);
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.remainingQueries !== undefined) {
        setRemaining(data.remainingQueries);
      }

      // Soft warning modals
      if (!isPro && data.remainingQueries !== undefined) {
        if (data.remainingQueries <= 5 && data.remainingQueries > 0) {
          setUpgradeReason(`Only ${data.remainingQueries} free queries remaining. Upgrade for unlimited access.`);
          setShowUpgrade(true);
        }
      }
    } catch {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function starMessage(messageId: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isStarred: !m.isStarred } : m))
    );
  }

  return (
    <div className={cn('flex h-[calc(100vh-3.5rem)]', isCrisisMode && 'bg-red-50/20')}>
      {/* Left sidebar — context controls */}
      <aside className="w-56 border-r border-border flex flex-col bg-muted/20 shrink-0">
        <div className="p-4 space-y-4 flex-1">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-input rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              Tour Scale
            </label>
            <select
              value={tourScale}
              onChange={(e) => setTourScale(e.target.value as TourScale)}
              className="w-full border border-input rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(Object.entries(SCALE_LABELS) as [TourScale, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              Mode
            </label>
            <div className="space-y-1">
              {(Object.entries(MODE_LABELS) as [ChatMode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setMode(val)}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    mode === val
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    val === 'crisis' && mode !== 'crisis' && 'border border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  {val === 'crisis' && <span className="mr-1">⚠</span>}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tourName && (
            <div className="pt-2 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Tour Context
              </label>
              <p className="text-sm font-medium">{tourName}</p>
            </div>
          )}
        </div>

        {/* Usage display */}
        {!isPro && remaining !== null && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-1.5">Free queries remaining</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    remaining <= 5 ? 'bg-destructive' : remaining <= 15 ? 'bg-yellow-500' : 'bg-foreground'
                  )}
                  style={{ width: `${((FREE_TIER_LIMIT - remaining) / FREE_TIER_LIMIT) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-medium">{remaining}</span>
            </div>
            {remaining <= 15 && (
              <button
                onClick={() => { setUpgradeReason('Upgrade for unlimited queries.'); setShowUpgrade(true); }}
                className="mt-2 w-full flex items-center justify-center gap-1 text-xs bg-foreground text-background rounded-md py-1.5 hover:bg-foreground/90 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Crisis mode banner */}
        {isCrisisMode && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm font-medium">
            <Shield className="w-4 h-4" />
            Crisis Mode active — responses are short, action-focused, and prioritize immediate steps.
            <button onClick={() => setMode('chat')} className="ml-auto text-xs underline">
              Exit Crisis Mode
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto">
              <h2 className="font-semibold text-lg mb-1">
                {ROLE_LABELS[role]} · {SCALE_LABELS[tourScale]} Tour
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ask anything about touring operations. Use the sidebar to switch roles, tour scale, or mode.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick starts</p>
                {(STARTER_PROMPTS[role] || STARTER_PROMPTS.tm)!.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left border border-border rounded-md px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-3xl',
                message.role === 'user' ? 'ml-auto' : 'mr-auto w-full'
              )}
            >
              {message.role === 'user' ? (
                <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                  {message.content}
                </div>
              ) : (
                <div className="group">
                  <div className="prose-ci text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {/* Message actions */}
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => starMessage(message.id)}
                      className={cn(
                        'flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted transition-colors',
                        message.isStarred ? 'text-yellow-500' : 'text-muted-foreground'
                      )}
                    >
                      <Star className="w-3 h-3" />
                      {message.isStarred ? 'Starred' : 'Star'}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Analyzing...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 max-w-3xl">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border px-6 py-4">
          <div className="max-w-3xl mx-auto">
            {!isPro && remaining !== null && remaining <= 10 && remaining > 0 && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {remaining <= 5
                  ? `Only ${remaining} free queries left. Upgrade to continue without interruption.`
                  : `${remaining} free queries remaining. Consider upgrading to Pro for unlimited access.`}
                <button
                  onClick={() => { setUpgradeReason(''); setShowUpgrade(true); }}
                  className="ml-auto text-yellow-700 font-medium hover:underline"
                >
                  Upgrade
                </button>
              </div>
            )}

            <div className={cn(
              'flex items-end gap-3 border border-input rounded-lg p-3 bg-background focus-within:ring-1 focus-within:ring-ring',
              isCrisisMode && 'border-destructive/50 focus-within:ring-destructive/50'
            )}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isCrisisMode
                    ? 'Describe the crisis — get immediate action steps...'
                    : `Ask your ${ROLE_LABELS[role].toLowerCase()} question...`
                }
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground max-h-32 overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center w-8 h-8 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Shift+Enter for new line · Responses are advisory only, not legal or financial advice
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <UpgradeModal
          reason={upgradeReason}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
