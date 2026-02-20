import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, BookOpen, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight">ConcertIndustry</span>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">BETA</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors"
            >
              Start Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full mb-8 border border-border">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Built for working touring professionals — not fans
        </div>

        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          The AI Operations Assistant for Tour & Production Managers
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Settlements, budgets, advances, crew logistics, crisis protocols — everything a Tour Manager,
          Production Manager, or Production Assistant needs, in one professional tool.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md hover:bg-foreground/90 transition-colors font-medium"
          >
            Start Free — 75 Queries Included
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account?
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-4">No credit card required. 75 free AI queries to start.</p>
      </section>

      {/* Role Callout */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-3 gap-8">
          {[
            {
              role: 'Tour Manager',
              tag: 'TM',
              items: [
                'Settlement modeling & walkthroughs',
                'Budget templates by tour type',
                'Promoter deal analysis',
                'Per diem & cash flow tracking',
                'Crisis protocols & dispute guidance',
              ],
            },
            {
              role: 'Production Manager',
              tag: 'PM',
              items: [
                'Technical advance checklists',
                'Load-in / load-out workflows',
                'Crew scheduling guidance',
                'Truck pack & parking strategy',
                'Venue communication templates',
              ],
            },
            {
              role: 'Production Assistant',
              tag: 'PA',
              items: [
                'Clear, step-by-step task lists',
                'Travel & hotel list management',
                'Pass & laminate organization',
                'Day-of show paperwork',
                'How to support PM/TM effectively',
              ],
            },
          ].map((item) => (
            <div key={item.tag} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-foreground text-background px-2 py-0.5 rounded">
                  {item.tag}
                </span>
                <h3 className="font-semibold">{item.role}</h3>
              </div>
              <ul className="space-y-2">
                {item.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-foreground/60 mt-0.5 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Built for the job. Not for fans.</h2>
        <p className="text-muted-foreground mb-16 max-w-xl">
          ConcertIndustry.com treats you as the professional you are. Every tool, every answer is calibrated
          for real touring operations — from club tours to stadium runs.
        </p>

        <div className="grid grid-cols-2 gap-8">
          {[
            {
              icon: <Zap className="w-5 h-5" />,
              title: 'AI Operations Assistant',
              description:
                'Ask anything about touring operations. Get direct, practical answers grounded in real industry knowledge — not generic AI guesses.',
            },
            {
              icon: <BookOpen className="w-5 h-5" />,
              title: 'Institutional Knowledge Base',
              description:
                'Backed by a curated corpus of touring guides, production manuals, settlement frameworks, international logistics, and more.',
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: 'Budget & Settlement Tools',
              description:
                'Generate budget templates by tour type and walk through settlements step-by-step with watchout flags. Pro feature.',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: 'Crisis Mode',
              description:
                'When something goes wrong on show day, toggle Crisis Mode. Get short, numbered action steps — not essays. Fast answers when you need them most.',
            },
          ].map((f) => (
            <div key={f.title} className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-muted-foreground">{f.icon}</div>
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-center">Simple, professional pricing</h2>
          <p className="text-muted-foreground text-center mb-16">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  Professional Trial
                </p>
                <p className="text-3xl font-bold">Free</p>
                <p className="text-sm text-muted-foreground mt-1">75 lifetime queries</p>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  '75 AI queries (lifetime)',
                  'All advisory answers',
                  'Crisis Mode',
                  'Knowledge search',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center text-sm border border-border rounded-md px-4 py-2.5 hover:bg-muted transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Monthly */}
            <div className="border-2 border-foreground rounded-lg p-6 bg-background relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs bg-foreground text-background px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  Pro Monthly
                </p>
                <p className="text-3xl font-bold">$9<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground mt-1">Billed monthly</p>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  'Unlimited AI queries',
                  'Saved tours & projects',
                  'Budget template generator',
                  'Settlement helper',
                  'Per-tour conversation history',
                  'Multi-currency support',
                  'International checklists',
                  'Advanced crisis workflows',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro_monthly"
                className="block text-center text-sm bg-foreground text-background rounded-md px-4 py-2.5 hover:bg-foreground/90 transition-colors font-medium"
              >
                Start Pro
              </Link>
            </div>

            {/* Pro Annual */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  Pro Annual
                </p>
                <p className="text-3xl font-bold">$79<span className="text-base font-normal text-muted-foreground">/yr</span></p>
                <p className="text-sm text-green-600 mt-1">Save $29 vs. monthly</p>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  'Everything in Pro Monthly',
                  '2 months free',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro_annual"
                className="block text-center text-sm border border-border rounded-md px-4 py-2.5 hover:bg-muted transition-colors"
              >
                Start Annual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm font-semibold">ConcertIndustry.com</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>For touring professionals. Not fans.</span>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
