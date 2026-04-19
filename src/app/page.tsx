import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BarChart3, Zap, Target, CheckCircle } from 'lucide-react'

const stages = [
  { num: '01', label: 'Discover', desc: 'Map your department context and recurring tasks' },
  { num: '02', label: 'Map', desc: 'Inventory every task and assess AI applicability' },
  { num: '03', label: 'Score', desc: 'Prioritize opportunities across 6 weighted dimensions' },
  { num: '04', label: 'Implement', desc: 'Get a workflow design and starter prompts, ready to run' },
]

const useCases = [
  { dept: 'Sales', tasks: ['Outbound email drafting', 'Call note summarization', 'Proposal first drafts'] },
  { dept: 'Operations', tasks: ['Meeting summaries + action items', 'SOP documentation', 'Status report drafting'] },
  { dept: 'Finance', tasks: ['Report summarization', 'Data commentary', 'Policy document drafts'] },
  { dept: 'HR', tasks: ['Job description drafting', 'Onboarding material creation', 'Offer letter templates'] },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Dark top: header + hero ── */}
      <div className="bg-[#0b0d17] relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:56px_56px]" />
        {/* Soft glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full" />

        <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <span className="font-semibold tracking-tight text-white">AuditAI</span>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-none">
                Get started free
              </Button>
            </Link>
          </div>
        </header>

        <section className="relative z-10 flex flex-col items-center text-center px-6 py-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 tracking-wide">
            Free · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold tracking-tight max-w-3xl leading-[1.06] text-white">
            From AI opportunity<br />to working workflow
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-2xl leading-relaxed">
            Most companies know AI exists but don&apos;t know where to start. AuditAI maps your department,
            scores every task, and guides you from &ldquo;we found 5 opportunities&rdquo; to
            &ldquo;we have 5 working AI workflows.&rdquo;
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-0">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="ghost" className="h-12 text-slate-400 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* ── Stages ── */}
      <section className="py-20 px-6 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-3">How it works</p>
          <h2 className="text-2xl font-bold text-center mb-12">A structured path from audit to implementation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {stages.map((s, i) => (
              <Card key={s.label} className="relative border shadow-sm">
                <CardContent className="pt-6 pb-5">
                  <p className="text-3xl font-bold text-primary/20 mb-3 leading-none">{s.num}</p>
                  <p className="font-semibold mb-1.5">{s.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
                {i < stages.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-muted/40 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-3">Why AuditAI</p>
          <h2 className="text-2xl font-bold text-center mb-12">Not just an audit. An implementation OS.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Scored, not guessed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Every task is scored across 6 weighted dimensions. The audit output is consistent, auditable, and defensible.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Context-aware recommendations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Workflow designs and starter prompts are generated from your specific audit data — not generic templates.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Built to close the loop</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Test prompts, rate outputs, iterate. Track time saved per workflow. The platform is done when the workflow is live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-20 px-6 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-3">Use cases</p>
          <h2 className="text-2xl font-bold text-center mb-4">Works across every department</h2>
          <p className="text-center text-muted-foreground mb-12 text-sm max-w-lg mx-auto">The methodology adapts to your context. A sales team gets different recommendations than a finance team.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {useCases.map((uc) => (
              <Card key={uc.dept} className="border shadow-sm">
                <CardContent className="pt-5 pb-5">
                  <p className="font-semibold text-sm mb-3">{uc.dept}</p>
                  <ul className="space-y-2">
                    {uc.tasks.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#0b0d17] relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/10 blur-[80px] rounded-full" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4 text-white">Run your first audit in 15 minutes</h2>
          <p className="text-slate-400 mb-8 text-sm">Free. No credit card. Takes one department from blank slate to prioritized opportunity report.</p>
          <Link href="/sign-up">
            <Button size="lg" className="h-12 px-8 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-0">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-6 px-6 text-center text-sm text-muted-foreground bg-background">
        AuditAI · AI Transition OS
      </footer>
    </div>
  )
}
