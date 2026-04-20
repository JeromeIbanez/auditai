import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Zap, ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { ActivateButton } from '@/app/audit/[id]/_components/activate-button'
import { DeleteButton } from '@/components/delete-button'
import { AppShell } from '@/components/app-shell'

export const metadata = { title: 'Dashboard — AuditAI' }

const statusDot: Record<string, string> = {
  LIVE: 'bg-green-500',
  TESTING: 'bg-blue-500',
  DRAFT: 'bg-gray-400',
}
const workflowLeftBorder: Record<string, string> = {
  DRAFT: '',
  TESTING: '',
  LIVE: 'border-l-2 border-l-green-500',
}
const applicabilityColors: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-600',
}

async function getDashboardData(userId: string) {
  const audits = await prisma.audit.findMany({
    where: { userId },
    include: {
      tasks: {
        include: {
          workflows: {
            include: { steps: true, ratings: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyName: true },
  })

  const workflows = audits.flatMap((a) =>
    a.tasks.flatMap((t) =>
      t.workflows.map((w) => ({
        ...w,
        taskName: t.name,
        department: a.department,
        auditId: a.id,
      }))
    )
  ).sort((a, b) => {
    const order: Record<string, number> = { LIVE: 0, TESTING: 1, DRAFT: 2 }
    return order[a.status] - order[b.status]
  })

  const openOpportunities = audits.flatMap((a) =>
    a.tasks
      .filter((t) => t.applicability !== 'LOW' && t.workflows.length === 0)
      .map((t) => ({ ...t, auditId: a.id, department: a.department }))
  ).sort((a, b) => b.totalScore - a.totalScore)

  const totalHoursSaved = workflows.reduce(
    (sum, w) => sum + Math.round((w.timeSavedPerRun * w.runsCount) / 60),
    0
  )

  return { audits, workflows, openOpportunities, totalHoursSaved, companyName: user?.companyName }
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null
  let dbError = false

  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `user-${userId}@placeholder.com` },
    })
    if (!user.onboarded) redirect('/onboarding')
    data = await getDashboardData(userId)
  } catch (e) {
    console.error('[dashboard] DB error:', e)
    dbError = true
  }

  const isEmpty = data && data.audits.length === 0

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-8 py-10 space-y-10">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1814]">
              {data?.companyName ?? 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your AI workflow overview</p>
          </div>
          <Link href="/audit">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New audit
            </Button>
          </Link>
        </div>

        {dbError && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-amber-700 text-sm">
                Database not connected. Add <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code> to{' '}
                <code className="bg-amber-100 px-1 rounded">.env.local</code> and run{' '}
                <code className="bg-amber-100 px-1 rounded">npx prisma migrate dev --name init</code>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats strip */}
        {data && (
          <div className="grid grid-cols-3 divide-x divide-border rounded-xl border bg-card shadow-sm">
            <div className="px-6 py-5">
              <p className="text-xs text-muted-foreground mb-1.5">Audits</p>
              <p className="text-3xl font-bold tracking-tight text-[#1c1814]">{data.audits.length}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-muted-foreground mb-1.5">Workflows</p>
              <p className="text-3xl font-bold tracking-tight text-[#1c1814]">{data.workflows.length}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-muted-foreground mb-1.5">Hours saved</p>
              <p className={`text-3xl font-bold tracking-tight ${data.totalHoursSaved > 0 ? 'text-[#c4621a]' : 'text-[#1c1814]'}`}>
                {data.totalHoursSaved > 0 ? `${data.totalHoursSaved}h` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !dbError && (
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-20 flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-[#c4621a]/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-[#c4621a]" />
            </div>
            <div>
              <p className="font-semibold text-lg text-[#1c1814]">Run your first audit</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Find AI opportunities for your team. Takes about 15 minutes.
              </p>
            </div>
            <Link href="/audit">
              <Button className="gap-2 mt-2">
                Start your first audit <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Workflows */}
        {data && data.workflows.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-l-2 border-[#c4621a] pl-2.5">
              Workflows
            </p>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y divide-border">
              {data.workflows.map((w) => (
                <div key={w.id} className={`flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#c4621a]/[0.03] transition-colors ${workflowLeftBorder[w.status]}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[w.status]}`} />
                      <p className="font-medium text-sm truncate">{w.taskName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-4">
                      {w.department} · {w.steps.length} steps · {w.runsCount} runs
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/workflow/${w.id}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-[#c4621a]">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteButton endpoint={`/api/workflow/${w.id}`} label="Delete" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open opportunities */}
        {data && data.openOpportunities.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-l-2 border-[#c4621a] pl-2.5">
              Open opportunities
            </p>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y divide-border">
              {data.openOpportunities.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#c4621a]/[0.03] transition-colors">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      <Badge className={`text-xs shrink-0 ${applicabilityColors[t.applicability]}`}>
                        {t.applicability}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(t.totalScore / 42) * 100} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{t.totalScore}/42</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <ActivateButton auditId={t.auditId} taskId={t.id} />
                    <DeleteButton endpoint={`/api/task/${t.id}`} label="Delete" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Audits */}
        {data && data.audits.length > 0 && (
          <section className="space-y-3">
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1 border-l-2 border-border pl-2.5">
              Audits
            </p>
            <div className="space-y-0.5">
              {data.audits.map((a) => {
                const workflowCount = a.tasks.reduce((n, t) => n + t.workflows.length, 0)
                return (
                  <Link key={a.id} href={`/audit/${a.id}`}>
                    <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg hover:bg-[#c4621a]/[0.04] transition-colors group">
                      <span className="font-medium text-sm">{a.department}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{a.tasks.length} tasks · {workflowCount} workflows</span>
                        <span>{new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  )
}
