import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Zap, Clock, FileText, ArrowRight } from 'lucide-react'
import { ActivateButton } from '@/app/audit/[id]/_components/activate-button'
import { DeleteButton } from '@/components/delete-button'
import { AppShell } from '@/components/app-shell'

export const metadata = { title: 'Dashboard — AuditAI' }

const workflowStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  TESTING: 'bg-blue-100 text-blue-800',
  LIVE: 'bg-green-100 text-green-800',
}
const workflowStatusBorder: Record<string, string> = {
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
            include: {
              steps: true,
              ratings: true,
            },
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
      <main className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {data?.companyName ? `${data.companyName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your AI workflow overview</p>
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

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audits</p>
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{data.audits.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workflows</p>
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{data.workflows.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hours saved</p>
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{data.totalHoursSaved > 0 ? `${data.totalHoursSaved}h` : '—'}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !dbError && (
          <Card className="border-dashed">
            <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
              <Zap className="h-12 w-12 text-muted-foreground/20" />
              <div>
                <p className="font-semibold text-lg">Run your first audit</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Find AI opportunities for your team. Takes about 15 minutes.
                </p>
              </div>
              <Link href="/audit">
                <Button className="gap-2 mt-2">
                  Start your first audit <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Workflows */}
        {data && data.workflows.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workflows</p>
            <div className="space-y-2">
              {data.workflows.map((w) => (
                <Card key={w.id} className={`transition-shadow hover:shadow-sm ${workflowStatusBorder[w.status]}`}>
                  <CardContent className="py-3 px-5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{w.taskName}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">{w.department}</Badge>
                        <Badge className={`text-xs shrink-0 ${workflowStatusColors[w.status]}`}>{w.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {w.steps.length} steps · {w.ratings.length} ratings · {w.runsCount} runs
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/workflow/${w.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <DeleteButton endpoint={`/api/workflow/${w.id}`} label="Delete" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Open opportunities */}
        {data && data.openOpportunities.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Open opportunities</p>
            <div className="space-y-2">
              {data.openOpportunities.map((t) => (
                <Card key={t.id}>
                  <CardContent className="py-3 px-5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{t.name}</p>
                        <Badge className={`text-xs shrink-0 ${applicabilityColors[t.applicability]}`}>
                          {t.applicability}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground">{t.department} · {t.totalScore}/42</p>
                        <Progress value={(t.totalScore / 42) * 100} className="h-1 flex-1 max-w-[80px]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ActivateButton auditId={t.auditId} taskId={t.id} />
                      <DeleteButton endpoint={`/api/task/${t.id}`} label="Delete" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Audits */}
        {data && data.audits.length > 0 && (
          <section className="space-y-3">
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Audits</p>
            <div className="space-y-0.5">
              {data.audits.map((a) => {
                const workflowCount = a.tasks.reduce((n, t) => n + t.workflows.length, 0)
                return (
                  <div key={a.id} className="flex items-center justify-between gap-4 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    <Link href={`/audit/${a.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-sm truncate">{a.department}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{a.department}</Badge>
                    </Link>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span>{a.tasks.length} tasks · {workflowCount} workflows</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <Link href={`/audit/${a.id}`}><ArrowRight className="h-3.5 w-3.5" /></Link>
                      <DeleteButton endpoint={`/api/audit/${a.id}`} redirectTo="/dashboard" label="Delete" />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  )
}
