import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  try {
    const audit = await prisma.audit.findUnique({ where: { id, userId }, select: { id: true } })
    if (!audit) return new Response('Not found', { status: 404 })

    await prisma.audit.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    return apiError('Failed to delete audit', 500, 'audit/delete', e)
  }
}
