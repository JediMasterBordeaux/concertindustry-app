'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole, TourScale } from '@/types';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'tm', label: 'Tour Manager', description: 'Handles accounting, settlements, and tour operations' },
  { value: 'pm', label: 'Production Manager', description: 'Oversees technical production and crew logistics' },
  { value: 'pa', label: 'Production Assistant', description: 'Supports PM and TM with daily operations' },
];

const SCALES: { value: TourScale; label: string }[] = [
  { value: 'club', label: 'Club (under 1,500 cap)' },
  { value: 'theater', label: 'Theater (1,500–5,000 cap)' },
  { value: 'arena', label: 'Arena (5,000–20,000 cap)' },
  { value: 'stadium', label: 'Stadium (20,000+ cap)' },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('tm');
  const [tourScale, setTourScale] = useState<TourScale>('theater');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          tour_scale: tourScale,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Update profile with role and scale
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ role, tour_scale: tourScale, full_name: fullName })
          .eq('id', user.id);
      }
      router.push('/chat');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-semibold text-xl tracking-tight">ConcertIndustry</Link>
          <p className="text-sm text-muted-foreground mt-2">Create your professional account</p>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-foreground' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-foreground' : 'bg-muted'}`} />
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup}>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mb-4">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-base mb-4">Account details</h2>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-foreground text-background py-2.5 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-semibold text-base mb-1">Tell us about your role</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This tailors all AI responses to your specific job. You can change this anytime.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Role</label>
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full text-left border rounded-md p-3 transition-colors ${
                          role === r.value
                            ? 'border-foreground bg-muted'
                            : 'border-border hover:border-foreground/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-foreground text-background px-1.5 py-0.5 rounded uppercase">
                            {r.value}
                          </span>
                          <span className="text-sm font-medium">{r.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-10">{r.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Typical Tour Scale</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCALES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setTourScale(s.value)}
                        className={`text-left border rounded-md p-2.5 text-sm transition-colors ${
                          tourScale === s.value
                            ? 'border-foreground bg-muted'
                            : 'border-border hover:border-foreground/40'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-border py-2.5 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-foreground text-background py-2.5 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          75 free queries included. No credit card required.
        </p>
      </div>
    </div>
  );
}
