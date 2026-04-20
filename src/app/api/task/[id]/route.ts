import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  try {
    const task = await prisma.auditTask.findFirst({
      where: { id, audit: { userId } },
      select: { id: true },
    })
    if (!task) return new Response('Not found', { status: 404 })

    // Workflows don't cascade from task, so delete them first
    await prisma.workflow.deleteMany({ where: { taskId: id } })
    await prisma.auditTask.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    return apiError('Failed to delete task', 500, 'task/delete', e)
  }
}
