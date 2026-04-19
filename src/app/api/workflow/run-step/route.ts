import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stepId, workflowId, input } = await req.json()

  try {
    const step = await prisma.workflowStep.findFirst({
      where: { id: stepId, workflow: { audit: { userId } } },
    })

    if (!step || !step.prompt) {
      return NextResponse.json({ error: 'Step not found or has no prompt' }, { status: 404 })
    }

    // Increment run count on the workflow
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { runsCount: { increment: 1 } },
    })

    const { textStream } = streamText({
      model: getModel(),
      system: step.prompt,
      prompt: input,
      onError: ({ error }) => console.error('[workflow/run-step] streamText error', error),
    })

    return new Response(textStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    return apiError('Failed to run step', 500, 'workflow/run-step', e)
  }
}
