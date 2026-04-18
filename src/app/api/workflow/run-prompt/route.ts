import { auth } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { prisma } from '@/lib/prisma'
import { getModel } from '@/lib/ai'
import { apiError } from '@/lib/api-error'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { promptId, workflowId, input } = await req.json()

  if (!input?.trim()) {
    return new Response('input is required', { status: 400 })
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, workflowId, workflow: { audit: { userId } } },
  })
  if (!prompt) return new Response('Not found', { status: 404 })

  try {
    const { textStream } = streamText({
      model: getModel(),
      system: prompt.content,
      prompt: input,
      onError: ({ error }) => console.error('[workflow/run-prompt] streamText error', error),
    })
    return new Response(textStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    return apiError('Failed to run prompt', 500, 'workflow/run-prompt', e)
  }
}
