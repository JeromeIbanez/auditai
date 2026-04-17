import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workflowId, minutesSaved } = await req.json()

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, audit: { userId } },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      runsCount: { increment: 1 },
      timeSavedPerRun: minutesSaved ?? workflow.timeSavedPerRun,
    },
  })

  return NextResponse.json({
    runsCount: updated.runsCount,
    totalMinutesSaved: updated.runsCount * updated.timeSavedPerRun,
  })
}
