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
})

export async function POST(req: Request) {
  const { task, context, messages } = await req.json()

  const systemPrompt = `Based on a conversation about the task "${task.name}" for a ${context.department} team, extract 6 dimension scores.

Scale for each (1 = worst fit for AI, 3 = best fit for AI):
- taskVolume: 1=rare/monthly, 2=weekly, 3=daily
- repeatability: 1=highly variable, 2=somewhat consistent, 3=routine/structured
- dataSensitivity: 1=highly sensitive (PII/legal/financial), 2=moderately sensitive, 3=not sensitive
- timeCost: 1=minutes, 2=30min–1hr, 3=hours
- errorRisk: 1=catastrophic if wrong, 2=significant but recoverable, 3=low/easily caught
- currentTooling: 1=complex integration required, 2=some integration needed, 3=none/standalone

Use best judgment from the conversation. Default to 2 if unclear.`

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
