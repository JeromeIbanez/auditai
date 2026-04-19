import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'
import { prisma } from '@/lib/prisma'
import { computeScore } from '@/lib/scoring'

const stepSchema = z.object({
  order: z.number(),
  type: z.enum(['TRIGGER', 'AI', 'HUMAN', 'INTEGRATION', 'OUTPUT']),
  tool: z.string().nullable().describe('Specific tool from the team\'s stack, or null'),
  title: z.string().describe('Short action title, e.g. "Classify ticket"'),
  description: z.string().describe('1-2 sentences: what happens at this step and why'),
  prompt: z.string().nullable().describe('Full ready-to-use prompt for AI steps; null for all other types'),
})

const workflowSchema = z.object({
  summary: z.string().describe('One sentence: what this workflow does and the key outcome'),
  steps: z.array(stepSchema).min(3).max(8),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { auditId, taskId } = await req.json()

  try {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId, userId },
      include: {
        tasks: true,
        user: { select: { companyName: true, industry: true, tools: true } },
      },
    })

    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    const task = audit.tasks.find((t) => t.id === taskId)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const score = computeScore({
      taskVolume: task.taskVolume,
      repeatability: task.repeatability,
      dataSensitivity: task.dataSensitivity,
      timeCost: task.timeCost,
      errorRisk: task.errorRisk,
      currentTooling: task.currentTooling,
    })

    const tools = audit.tools.length > 0 ? audit.tools : (audit.user.tools ?? [])
    const toolList = tools.length > 0 ? tools.join(', ') : 'no specific tools specified'
    const company = audit.user.companyName ?? 'this company'
    const industry = audit.user.industry ?? ''

    const modeInstructions =
      task.automationMode === 'AUTOMATE'
        ? 'AI handles the full process end-to-end. Minimize human steps — only include one at the end for final review or send.'
        : 'AI drafts and assists. Include a HUMAN step for review before any output is sent or acted on. The human is in the loop at key decision points.'

    const { object } = await generateObject({
      model: getModel(),
      schema: workflowSchema,
      system: `You are an AI workflow architect. You design practical, tool-specific automation workflows for business teams.
Company: ${company}${industry ? ` (${industry})` : ''}
Department: ${audit.department} — ${audit.teamSize} people
Team tools: ${toolList}

Design rules:
- TRIGGER: always first — what event or condition starts the workflow. Reference a specific tool if relevant.
- AI: steps where Claude or an AI model does the work. MUST include a full, ready-to-use prompt with placeholders like [CUSTOMER NAME], [TICKET CONTENT]. The prompt must be specific to ${audit.department}, not generic.
- HUMAN: steps where a person reviews, decides, or acts. Be specific about what they check.
- INTEGRATION: steps involving a tool action (e.g. "Route ticket in Zendesk", "Update record in HubSpot"). Reference the specific tool from the team's stack.
- OUTPUT: final step — what gets produced or sent.
- Use the team's actual tools in step titles and descriptions wherever possible.
- Prompts must be practical and copy-paste ready — not abstract descriptions.`,
      prompt: `Design a complete workflow for: "${task.name}"

Automation mode: ${task.automationMode} (score: ${score}/42)
${modeInstructions}

The workflow should directly reference the team's tools (${toolList}) where applicable.
Each AI step must have a full, specific prompt ready to use — not a placeholder description.`,
    })

    const workflow = await prisma.workflow.create({
      data: {
        auditId,
        taskId,
        summary: object.summary,
        steps: {
          create: object.steps.map((s) => ({
            order: s.order,
            type: s.type,
            tool: s.tool ?? null,
            title: s.title,
            description: s.description,
            prompt: s.prompt ?? null,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ workflowId: workflow.id })
  } catch (e) {
    return apiError('Failed to activate workflow', 500, 'workflow/activate', e)
  }
}
