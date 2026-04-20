import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { computeScore, getApplicability, getAutomationMode, MAX_SCORE } from '@/lib/scoring'
import { ActivateButton } from './_components/activate-button'
import { DeleteButton } from '@/components/delete-button'
import { AppShell } from '@/components/app-shell'

type Props = { params: Promise<{ id: string }> }

const applicabilityColors: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-600',
}

const modeColors: Record<string, string> = {
  AUTOMATE: 'bg-green-100 text-green-800',
  ASSIST: 'bg-blue-100 text-blue-800',
  SKIP: 'bg-gray-100 text-gray-600',
}

const workflowStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  TESTING: 'bg-blue-100 text-blue-800',
  LIVE: 'bg-green-100 text-green-800',
}

export default async function AuditDetailPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params

  const audit = await prisma.audit.findUnique({
    where: { id, userId },
    include: {
      tasks: { orderBy: { order: 'asc' } },
      report: true,
      workflows: {
        include: { steps: true, ratings: true },
        orderBy: { createdAt: 'asc' },
      },
      user: { select: { companyName: true } },
    },
  })

  if (!audit) notFound()

  const sortedTasks = [...audit.tasks].sort((a, b) => b.totalScore - a.totalScore)
  const activatedTaskIds = new Set(audit.workflows.map((w) => w.taskId))
  const title = audit.user.companyName ?? audit.department

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-8 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground">{title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#1c1814]">{title}</h1>
              <Badge variant="secondary">{audit.department}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {audit.teamSize} people · {audit.tasks.length} tasks audited
            </p>
            {audit.tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {audit.tools.map((t) => (
                  <span key={t} className="text-xs bg-card px-2 py-0.5 rounded-md border">{t}</span>
                ))}
              </div>
            )}
          </div>
          <DeleteButton endpoint={`/api/audit/${audit.id}`} redirectTo="/dashboard" label="Delete audit" />
        </div>

        <Separator />

        {/* AI Report */}
        {audit.report && (
          <Card className="border-l-4 border-l-[#c4621a]/40">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Analysis</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {audit.report.narrative}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Opportunities */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-l-2 border-[#c4621a] pl-2.5">Opportunities</h2>
          {sortedTasks.map((task) => {
            const scores = {
              taskVolume: task.taskVolume,
              repeatability: task.repeatability,
              dataSensitivity: task.dataSensitivity,
              timeCost: task.timeCost,
              errorRisk: task.errorRisk,
              currentTooling: task.currentTooling,
            }
            const applicability = getApplicability(scores)
            const mode = getAutomationMode(scores)
            const score = computeScore(scores)
            const pct = (score / MAX_SCORE) * 100
            const workflow = audit.workflows.find((w) => w.taskId === task.id)
            const isHigh = applicability === 'HIGH'

            return (
              <Card
                key={task.id}
                className={`${activatedTaskIds.has(task.id) ? 'border-primary/30' : ''} ${isHigh ? 'bg-green-50/40' : ''}`}
              >
                <CardContent className="py-4 px-5 space-y-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm">{task.name}</p>
                    <DeleteButton endpoint={`/api/task/${task.id}`} label="Delete" />
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        Priority score
                        {task.errorRisk === 1 && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </span>
                      <span>{score} / {MAX_SCORE}</span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 ${
                        applicability === 'HIGH'
                          ? '[&>div]:bg-green-500'
                          : applicability === 'MEDIUM'
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-gray-300'
                      }`}
                    />
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${applicabilityColors[applicability]}`}>{applicability}</Badge>
                    <Badge className={`text-xs ${modeColors[mode]}`}>{mode}</Badge>
                  </div>

                  {/* Workflow status or activate */}
                  {workflow ? (
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        {workflow.status === 'LIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {workflow.steps.length} steps · {workflow.ratings.length} ratings
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${workflowStatusColors[workflow.status]}`}>
                          {workflow.status}
                        </Badge>
                        <Link href={`/workflow/${workflow.id}`}>
                          <Button size="sm" variant="outline">Open workflow</Button>
                        </Link>
                      </div>
                    </div>
                  ) : applicability !== 'LOW' ? (
                    <div className="pt-1 border-t border-border/40">
                      <ActivateButton auditId={audit.id} taskId={task.id} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
