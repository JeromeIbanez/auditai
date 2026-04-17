import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { computeScore, getApplicability, getAutomationMode, MAX_SCORE } from '@/lib/scoring'
import { ActivateButton } from './_components/activate-button'

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
        include: { prompts: { where: { isActive: true } }, ratings: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!audit) notFound()

  const sortedTasks = [...audit.tasks].sort((a, b) => b.totalScore - a.totalScore)
  const activatedTaskIds = new Set(audit.workflows.map((w) => w.taskId))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="font-semibold tracking-tight">AuditAI</span>
        <div className="w-24" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{audit.company}</h1>
            <Badge variant="secondary">{audit.department}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {audit.teamSize} people · {audit.tasks.length} tasks audited ·{' '}
            {audit.tools.length > 0 ? audit.tools.join(', ') : 'No tools specified'}
          </p>
        </div>

        {/* AI Report */}
        {audit.report && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                {audit.report.narrative}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Opportunities */}
        <div className="space-y-3">
          <h2 className="font-semibold">Opportunities</h2>
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

            return (
              <Card key={task.id} className={activatedTaskIds.has(task.id) ? 'border-primary/30' : ''}>
                <CardContent className="py-4 px-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{task.name}</p>
                      {task.errorRisk === 1 && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-xs ${applicabilityColors[applicability]}`}>{applicability}</Badge>
                      <Badge className={`text-xs ${modeColors[mode]}`}>{mode}</Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Priority score</span>
                      <span>{score} / {MAX_SCORE}</span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-1.5 ${applicability === 'HIGH' ? '[&>div]:bg-green-500' : applicability === 'MEDIUM' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-gray-300'}`}
                    />
                  </div>

                  {workflow ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {workflow.status === 'LIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {workflow.prompts.length} prompts · {workflow.ratings.length} ratings
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
                    <ActivateButton auditId={audit.id} taskId={task.id} />
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
