import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BarChart3, Zap, Target, CheckCircle } from 'lucide-react'

const stages = [
  { icon: '🔍', label: 'Discover', desc: 'Map your department context and recurring tasks' },
  { icon: '📋', label: 'Map', desc: 'Inventory every task and assess AI applicability' },
  { icon: '📊', label: 'Score', desc: 'Prioritize opportunities across 6 weighted dimensions' },
  { icon: '⚡', label: 'Implement', desc: 'Get a workflow design and starter prompts, ready to run' },
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
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-lg">AuditAI</span>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-background to-muted/30">
        <Badge variant="secondary" className="mb-6">Free · No credit card required</Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          From AI opportunity<br />to working workflow
        </h1>
        <p className="mt-6 text-muted-foreground text-lg max-w-xl">
          Most companies know AI exists but don&apos;t know where to start. AuditAI maps your department, scores every task, and guides you from &ldquo;we found 5 opportunities&rdquo; to &ldquo;we have 5 working AI workflows.&rdquo;
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
      </section>

      <section className="py-20 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">A structured path from audit to implementation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stages.map((s, i) => (
              <Card key={s.label} className="relative">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">STAGE {i + 1}</div>
                  <div className="font-semibold mb-2">{s.label}</div>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
                {i < stages.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Not just an audit. An implementation OS.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Scored, not guessed</h3>
              <p className="text-sm text-muted-foreground">Every task is scored across 6 weighted dimensions. The audit output is consistent, auditable, and defensible.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Context-aware recommendations</h3>
              <p className="text-sm text-muted-foreground">Workflow designs and starter prompts are generated from your specific audit data — not generic templates.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Target className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Built to close the loop</h3>
              <p className="text-sm text-muted-foreground">Test prompts, rate outputs, iterate. Track time saved per workflow. The platform is done when the workflow is live.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">Works across every department</h2>
          <p className="text-center text-muted-foreground mb-12">The methodology adapts to your context. A sales team gets different recommendations than a finance team.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {useCases.map((uc) => (
              <Card key={uc.dept}>
                <CardContent className="pt-6">
                  <div className="font-semibold mb-3">{uc.dept}</div>
                  <ul className="space-y-2">
                    {uc.tasks.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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

      <section className="py-20 px-6 border-t bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Run your first audit in 15 minutes</h2>
          <p className="text-primary-foreground/80 mb-8">Free. No credit card. Takes one department from blank slate to prioritized opportunity report.</p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-6 px-6 text-center text-sm text-muted-foreground">
        AuditAI · AI Transition OS
      </footer>
    </div>
  )
}
