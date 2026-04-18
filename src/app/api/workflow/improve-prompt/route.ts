import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { promptId, workflowId } = await req.json()

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, audit: { userId } },
    include: {
      audit: { select: { department: true, company: true, teamSize: true, tools: true } },
      task: { select: { name: true } },
    },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId, workflowId } })
  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  // Get ratings for this prompt
  const ratings = await prisma.rating.findMany({
    where: { promptId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const avgScore = ratings.length
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : 'no ratings yet'

  const feedbackSummary = ratings
    .filter((r) => r.feedback)
    .map((r) => `- ${r.score}/5: "${r.feedback}"`)
    .join('\n') || 'No written feedback yet.'

  const { text } = await generateText({
    model: getModel(),
    system: `You are improving a prompt for a ${workflow.audit.department} team at ${workflow.audit.company} (${workflow.audit.teamSize} people, tools: ${workflow.audit.tools.join(', ') || 'unspecified'}).
The workflow task is: "${workflow.task.name}".
Preserve the intent and structure. Make it more specific, clearer, or better based on the feedback.
Return ONLY the improved prompt text — no explanation, no preamble.`,
    prompt: `ORIGINAL PROMPT (${prompt.title}):
${prompt.content}

TEAM RATINGS: Average ${avgScore}/5 from ${ratings.length} rating(s)
FEEDBACK:
${feedbackSummary}

Write an improved version of this prompt.`,
  })

  // Deactivate old version, create new
  await prisma.prompt.update({ where: { id: promptId }, data: { isActive: false } })

  const improved = await prisma.prompt.create({
    data: {
      workflowId,
      title: prompt.title,
      content: text.trim(),
      version: prompt.version + 1,
      isActive: true,
    },
  })

  return NextResponse.json({ prompt: improved })

  } catch (e) {
    return apiError('Failed to improve prompt', 500, 'workflow/improve-prompt', e)
  }
}
