import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stepId } = await req.json()

  try {
    const step = await prisma.workflowStep.findFirst({
      where: { id: stepId, workflow: { audit: { userId } } },
      include: {
        ratings: { orderBy: { createdAt: 'desc' }, take: 5 },
        workflow: {
          include: {
            audit: { select: { department: true, tools: true, user: { select: { companyName: true } } } },
            task: { select: { name: true, automationMode: true } },
          },
        },
      },
    })

    if (!step || !step.prompt) {
      return NextResponse.json({ error: 'Step not found or has no prompt' }, { status: 404 })
    }

    const feedback = step.ratings
      .filter((r) => r.feedback)
      .map((r) => `Score ${r.score}/5: ${r.feedback}`)
      .join('\n')

    const avgScore =
      step.ratings.length > 0
        ? step.ratings.reduce((s, r) => s + r.score, 0) / step.ratings.length
        : null

    const { text: newPrompt } = await generateText({
      model: getModel(),
      system: `You are improving an AI workflow prompt for a ${step.workflow.audit.department} team${step.workflow.audit.user.companyName ? ` at ${step.workflow.audit.user.companyName}` : ''}. Task: "${step.workflow.task.name}". Tools: ${step.workflow.audit.tools.join(', ') || 'not specified'}.`,
      prompt: `Improve this prompt based on user feedback.

CURRENT PROMPT:
${step.prompt}

${avgScore !== null ? `Average rating: ${avgScore.toFixed(1)}/5` : ''}
${feedback ? `User feedback:\n${feedback}` : 'No feedback yet — make the prompt more specific, clearer, and production-ready.'}

Return ONLY the improved prompt text. No explanation, no wrapper.`,
    })

    const updated = await prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        prompt: newPrompt,
        promptVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ step: updated })
  } catch (e) {
    return apiError('Failed to improve step', 500, 'workflow/improve-step', e)
  }
}
