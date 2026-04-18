import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

const TRANSITIONS: Record<string, string> = {
  DRAFT: 'TESTING',
  TESTING: 'LIVE',
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workflowId } = await req.json()

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, audit: { userId } },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const next = TRANSITIONS[workflow.status]
  if (!next) return NextResponse.json({ error: 'Already live' }, { status: 400 })

  try {
    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: next as 'TESTING' | 'LIVE',
        activatedAt: next === 'LIVE' ? new Date() : undefined,
      },
    })
    return NextResponse.json({ status: updated.status })
  } catch (e) {
    return apiError('Failed to update status', 500, 'workflow/status', e)
  }
}
