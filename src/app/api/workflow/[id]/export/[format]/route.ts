import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateSetupGuide } from '@/lib/export/setup-guide'
import { generateMakeBlueprint } from '@/lib/export/make-blueprint'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; format: string }> }
) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { id, format } = await params

  const workflow = await prisma.workflow.findFirst({
    where: { id, audit: { userId } },
    include: {
      task: true,
      audit: { select: { department: true } },
      steps: { orderBy: { order: 'asc' } },
    },
  })

  if (!workflow) return new Response('Not found', { status: 404 })

  const slug = workflow.task.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const data = {
    taskName: workflow.task.name,
    summary: workflow.summary,
    department: workflow.audit.department,
    steps: workflow.steps,
  }

  if (format === 'guide') {
    const content = generateSetupGuide(data)
    return new Response(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="workflow-${slug}.md"`,
      },
    })
  }

  if (format === 'make') {
    const blueprint = generateMakeBlueprint(data)
    return new Response(JSON.stringify(blueprint, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="workflow-${slug}-make.json"`,
      },
    })
  }

  return new Response('Unknown format. Use "guide" or "make".', { status: 400 })
}
