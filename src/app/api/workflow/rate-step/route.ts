import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stepId, score, feedback } = await req.json()

  if (!stepId || !score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'stepId and score (1-5) are required' }, { status: 400 })
  }

  try {
    const step = await prisma.workflowStep.findFirst({
      where: { id: stepId, workflow: { audit: { userId } } },
    })

    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    const rating = await prisma.stepRating.create({
      data: { stepId, score, feedback: feedback ?? null },
    })

    return NextResponse.json({ rating })
  } catch (e) {
    return apiError('Failed to rate step', 500, 'workflow/rate-step', e)
  }
}
