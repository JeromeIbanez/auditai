import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, User, Bot, ArrowRightLeft } from 'lucide-react'
import { WorkflowClient } from './_components/workflow-client'
import { AppShell } from '@/components/app-shell'

type Props = { params: Promise<{ id: string }> }

const workflowStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  TESTING: 'bg-blue-100 text-blue-800',
  LIVE: 'bg-green-100 text-green-800',
}

export default async function WorkflowPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params

  const workflow = await prisma.workflow.findFirst({
    where: { id, audit: { userId } },
    include: {
      task: true,
      audit: { select: { id: true, company: true, department: true } },
      prompts: { where: { isActive: true }, orderBy: { version: 'desc' } },
      ratings: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!workflow) notFound()

  const avgRating =
    workflow.ratings.length > 0
      ? (workflow.ratings.reduce((s, r) => s + r.score, 0) / workflow.ratings.length).toFixed(1)
      : null

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/audit/${workflow.audit.id}`} className="hover:text-foreground transition-colors">{workflow.audit.company}</Link>
          <span>/</span>
          <span className="text-foreground">{workflow.task.name}</span>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{workflow.task.name}</h1>
            <Badge className={`text-xs ${workflowStatusColors[workflow.status]}`}>{workflow.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {workflow.audit.department} · {avgRating ? `${avgRating} avg · ` : ''}{workflow.ratings.length} ratings · {workflow.runsCount} runs
          </p>
        </div>

        {/* Workflow design */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Workflow design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">TRIGGER</p>
              <p className="text-sm bg-muted rounded-lg px-3 py-2">{workflow.trigger}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium">AI handles</p>
                </div>
                <ul className="space-y-1.5">
                  {workflow.claudeDoes.map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium">Human handles</p>
                </div>
                <ul className="space-y-1.5">
                  {workflow.humanDoes.map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-0.5">•</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {workflow.handoffs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium">Handoff points</p>
                </div>
                <ul className="space-y-1.5">
                  {workflow.handoffs.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-0.5">→</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Prompts + ratings + status + time tracker — client component */}
        <WorkflowClient
          workflowId={workflow.id}
          initialStatus={workflow.status}
          prompts={workflow.prompts}
          ratings={workflow.ratings}
          runsCount={workflow.runsCount}
          timeSavedPerRun={workflow.timeSavedPerRun}
        />
      </main>
    </AppShell>
  )
}
