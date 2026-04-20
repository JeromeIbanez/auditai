import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'

const ScoreSchema = z.object({
  taskVolume: z.number().int().min(1).max(3),
  repeatability: z.number().int().min(1).max(3),
  dataSensitivity: z.number().int().min(1).max(3),
  timeCost: z.number().int().min(1).max(3),
  errorRisk: z.number().int().min(1).max(3),
  currentTooling: z.number().int().min(1).max(3),
  justifications: z.object({
    taskVolume: z.string(),
    repeatability: z.string(),
    dataSensitivity: z.string(),
    timeCost: z.string(),
    errorRisk: z.string(),
    currentTooling: z.string(),
  }),
})

export async function POST(req: Request) {
  const { task, context, messages } = await req.json()

  const systemPrompt = `Based on a conversation about the task "${task.name}" for a ${context.department} team, extract 6 dimension scores (1–3) and a one-sentence justification for each score grounded in what was said in the conversation.

Higher score = better fit for AI automation. Be accurate — do not default to 2 just because you're uncertain. Use the full range.

Scoring guide:
- taskVolume: How often is this done? 1=rarely (monthly or less), 2=weekly, 3=multiple times per week or daily
- repeatability: How consistent is the process each time? 1=highly variable/unique each time, 2=somewhat consistent, 3=routine and structured with a clear pattern
- dataSensitivity: How sensitive is the data involved? 1=highly sensitive (medical/legal/financial/PII), 2=moderately sensitive (internal business data), 3=non-sensitive (public info, general content)
- timeCost: How long does it take a human? 1=a few minutes, 2=30 minutes to an hour, 3=multiple hours
- errorRisk: What happens if AI makes a mistake? 1=catastrophic and hard to catch, 2=significant but recoverable with review, 3=low risk — mistakes are obvious and easily corrected
- currentTooling: How complex is the current setup? 1=deeply embedded in complex systems, 2=uses some tools but manageable, 3=mostly manual today, no integration needed

For justifications: be specific and reference what the user actually said. Keep each to one concise sentence.

For standard business tasks like writing, summarising, drafting, classifying, or generating structured content — these typically score 2–3 on most dimensions unless the conversation reveals a specific reason otherwise.`

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: ScoreSchema,
      system: systemPrompt,
      messages,
    })
    return Response.json(object)
  } catch (e) {
    return apiError('Failed to extract scores', 500, 'audit/score-extract', e)
  }
}
