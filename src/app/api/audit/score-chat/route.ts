import { streamText } from 'ai'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'

export async function POST(req: Request) {
  const { task, context, messages } = await req.json()

  const systemPrompt = `You are helping assess AI opportunities for a ${context.department} team of ${context.teamSize} people. Their tools: ${context.tools?.join(', ') || 'not specified'}.

The task being assessed is: "${task.name}"

Your job is to ask natural, conversational questions to understand this task well enough to infer:
- How often it's done and how long it takes
- Whether it follows a consistent structure each time
- What kind of data is involved and how sensitive it is
- What would happen if AI made a mistake
- What tools or systems are involved

Rules:
- Ask ONE question at a time, max 2 sentences
- Start by asking about frequency and time together in your first message
- Keep it conversational — no jargon, no mention of "scores" or "dimensions"
- After 3 user replies, summarize what you've learned and ask if there's anything else
- Be warm and brief`

  try {
    const { textStream } = streamText({
      model: getModel(),
      system: systemPrompt,
      messages,
      onError: ({ error }) => console.error('[audit/score-chat] streamText error', error),
    })
    return new Response(textStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    return apiError('Failed to chat', 500, 'audit/score-chat', e)
  }
}
