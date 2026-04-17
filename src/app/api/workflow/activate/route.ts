import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/lib/ai'
import { prisma } from '@/lib/prisma'
import { computeScore } from '@/lib/scoring'

const workflowSchema = z.object({
  trigger: z.string().describe('When/what triggers this workflow (one sentence)'),
  claudeDoes: z.array(z.string()).describe('Steps Claude handles end-to-end'),
  humanDoes: z.array(z.string()).describe('Steps the human handles or reviews'),
  handoffs: z.array(z.string()).describe('Handoff points — where human takes control'),
  prompts: z.array(z.object({
    title: z.string().describe('Short name for this prompt'),
    content: z.string().describe('The full prompt text, ready to use'),
  })).min(3).max(5).describe('3–5 starter prompts tailored to this task and team context'),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { auditId, taskId } = body

  const audit = await prisma.audit.findUnique({
    where: { id: auditId, userId },
    include: { tasks: true },
  })

  if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

  const task = audit.tasks.find((t) => t.id === taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const allTasksSummary = audit.tasks
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((t) => `- ${t.name} (score: ${t.totalScore}, mode: ${t.automationMode})`)
    .join('\n')

  const { object } = await generateObject({
    model: getModel(),
    schema: workflowSchema,
    system: `You are an AI workflow designer building practical, implementable workflows.
Context: ${audit.department} team at ${audit.company}, ${audit.teamSize} people, tools: ${audit.tools.join(', ') || 'not specified'}.
Full audit context (all tasks):
${allTasksSummary}`,
    prompt: `Design a complete workflow for this specific task: "${task.name}"

This task has been scored as: ${task.automationMode} mode (score ${computeScore({
  taskVolume: task.taskVolume,
  repeatability: task.repeatability,
  dataSensitivity: task.dataSensitivity,
  timeCost: task.timeCost,
  errorRisk: task.errorRisk,
  currentTooling: task.currentTooling,
})}/42).

Requirements:
- The prompts must be specific to ${audit.department} in ${audit.company}, not generic
- Each prompt should be ready to use — include placeholders like [CUSTOMER NAME] or [TOPIC] where input is needed
- The workflow design must reflect the "${task.automationMode}" mode: ${task.automationMode === 'AUTOMATE' ? 'Claude handles end-to-end' : 'Claude drafts, human reviews'}
- Keep it practical — no tool integrations required for v1, paste-and-run is fine`,
  })

  const workflow = await prisma.workflow.create({
    data: {
      auditId,
      taskId,
      trigger: object.trigger,
      claudeDoes: object.claudeDoes,
      humanDoes: object.humanDoes,
      handoffs: object.handoffs,
      prompts: {
        create: object.prompts.map((p, i) => ({
          title: p.title,
          content: p.content,
          version: 1,
          isActive: true,
        })),
      },
    },
    include: { prompts: true },
  })

  return NextResponse.json({ workflowId: workflow.id })
}
