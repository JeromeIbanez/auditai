import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workflowId, promptId, score, feedback } = await req.json()

  if (!workflowId || !score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Verify ownership
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, audit: { userId } },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rating = await prisma.rating.create({
      data: { workflowId, promptId: promptId ?? null, score, feedback: feedback || null },
    })
    return NextResponse.json({ ratingId: rating.id })
  } catch (e) {
    return apiError('Failed to save rating', 500, 'workflow/rate', e)
  }
}
