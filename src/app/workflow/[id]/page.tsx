import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      audit: { select: { id: true, department: true, user: { select: { companyName: true } } } },
      steps: { orderBy: { order: 'asc' } },
      ratings: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!workflow) notFound()

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/audit/${workflow.audit.id}`} className="hover:text-foreground transition-colors">
            {workflow.audit.user.companyName ?? workflow.audit.department}
          </Link>
          <span>/</span>
          <span className="text-foreground">{workflow.task.name}</span>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{workflow.task.name}</h1>
            <Badge className={`text-xs ${workflowStatusColors[workflow.status]}`}>{workflow.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {workflow.audit.department} · {workflow.ratings.length} ratings · {workflow.runsCount} runs
          </p>
        </div>

        <Separator />

        <WorkflowClient
          workflowId={workflow.id}
          summary={workflow.summary}
          initialStatus={workflow.status}
          steps={workflow.steps}
          ratings={workflow.ratings}
          runsCount={workflow.runsCount}
          timeSavedPerRun={workflow.timeSavedPerRun}
        />
      </main>
    </AppShell>
  )
}
