import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BarChart3, Zap, ArrowRight, FileText } from 'lucide-react'
import { PendingAuditSaver } from './_components/pending-audit-saver'

export const metadata = { title: 'Dashboard — AuditAI' }

async function getAudits(userId: string) {
  return prisma.audit.findMany({
    where: { userId },
    include: {
      tasks: true,
      report: { select: { id: true } },
      workflows: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function ensureUser(userId: string, email: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  })
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Gracefully handle case where DB isn't connected yet
  let audits: Awaited<ReturnType<typeof getAudits>> = []
  let dbError = false

  try {
    // clerk gives us the email from the session claims
    await ensureUser(userId, `user-${userId}@placeholder.com`)
    audits = await getAudits(userId)
  } catch {
    dbError = true
  }

  const totalWorkflows = audits.reduce((n, a) => n + a.workflows.length, 0)
  const liveWorkflows = audits.reduce(
    (n, a) => n + a.workflows.filter((w) => w.status === 'LIVE').length,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <PendingAuditSaver />
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-lg">AuditAI</span>
        <Link href="/audit">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New audit
          </Button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your audits and active workflows</p>
        </div>

        {dbError && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex items-start gap-3">
              <span className="text-amber-600 text-sm">
                ⚠️ Database not connected yet. Add your <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code> to <code className="bg-amber-100 px-1 rounded">.env.local</code> and run <code className="bg-amber-100 px-1 rounded">npx prisma migrate dev --name init</code>.
              </span>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{audits.length}</p>
                  <p className="text-sm text-muted-foreground">Audits completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalWorkflows}</p>
                  <p className="text-sm text-muted-foreground">Workflows activated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{liveWorkflows}</p>
                  <p className="text-sm text-muted-foreground">Workflows live</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audits list */}
        {audits.length === 0 && !dbError ? (
          <Card className="border-dashed">
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No audits yet</p>
                <p className="text-sm text-muted-foreground mt-1">Run your first audit to identify AI opportunities in your department.</p>
              </div>
              <Link href="/audit">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Start your first audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent audits</h2>
            {audits.map((audit) => {
              const highCount = audit.tasks.filter((t) => {
                // quick applicability check: taskVolume*3 + repeatability*3 + dataSensitivity*2 + timeCost*2 + errorRisk*3 + currentTooling >= 30
                const s = t.taskVolume * 3 + t.repeatability * 3 + t.dataSensitivity * 2 + t.timeCost * 2 + t.errorRisk * 3 + t.currentTooling
                return s >= 30
              }).length
              const liveCount = audit.workflows.filter((w) => w.status === 'LIVE').length

              return (
                <Link key={audit.id} href={`/audit/${audit.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{audit.company}</p>
                          <Badge variant="secondary" className="text-xs shrink-0">{audit.department}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {audit.tasks.length} tasks · {highCount} high-priority · {audit.workflows.length} workflows
                          {liveCount > 0 && ` · ${liveCount} live`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
