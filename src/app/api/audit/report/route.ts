import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { getModel } from '@/lib/ai'
import { computeScore, getApplicability, getAutomationMode } from '@/lib/scoring'
import { AuditContextInput, TaskInput } from '@/lib/types'

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { context, tasks }: { context: AuditContextInput; tasks: TaskInput[] } = await req.json()

  const taskSummary = tasks
    .map((t, i) => {
      const score = computeScore(t)
      const applicability = getApplicability(t)
      const mode = getAutomationMode(t)
      const flags = t.errorRisk === 1 ? ' [CATASTROPHIC ERROR RISK]' : ''
      return `${i + 1}. ${t.name} — Score: ${score}/42, Priority: ${applicability}, Mode: ${mode}${flags}`
    })
    .join('\n')

  const highPriority = tasks
    .filter((t) => getApplicability(t) === 'HIGH')
    .sort((a, b) => computeScore(b) - computeScore(a))

  const { textStream } = streamText({
    model: getModel(),
    system: `You are an AI adoption consultant completing Stage 4 (Report) of an AI opportunity audit.
Your job is to produce a concise, practical, outcome-first report.
Never say "use Claude" or "use AI" — say what the workflow accomplishes and how much time it saves.
Keep the tone direct, specific, and free of generic AI enthusiasm.`,
    prompt: `Complete an AI opportunity audit report for the following:

COMPANY: ${context.company}
DEPARTMENT: ${context.department}
TEAM SIZE: ${context.teamSize} people
TOOLS IN USE: ${context.tools.length > 0 ? context.tools.join(', ') : 'Not specified'}

SCORED OPPORTUNITIES (ranked by score):
${taskSummary}

Write the following sections:

## Executive Summary
3–5 sentences. What did the audit find, what do you recommend, and what is the expected impact?

## Top Opportunities
For each HIGH-priority task, use this framing: "Your team spends approximately [X] on [task]. [Specific outcome-first description of the AI workflow]. The output would be reviewed by [who] before [action], so quality is maintained."
${highPriority.length > 0 ? `Focus on: ${highPriority.map((t) => t.name).join(', ')}` : 'Note that no tasks reached the high-priority threshold — explain why and what to focus on instead.'}

## What Not to Automate
List tasks that scored poorly or carry too much risk, with a brief reason for each.

## Recommended Next Steps
3 concrete actions with suggested owners and a timeline. Be specific.`,
  })

  return new Response(textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
