import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { companyName, industry, tools } = await req.json()

  if (!companyName?.trim() || !industry) {
    return NextResponse.json({ error: 'companyName and industry are required' }, { status: 400 })
  }

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: { companyName: companyName.trim(), industry, tools: tools ?? [], onboarded: true },
      create: {
        id: userId,
        email: `user-${userId}@placeholder.com`,
        companyName: companyName.trim(),
        industry,
        tools: tools ?? [],
        onboarded: true,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError('Failed to save onboarding', 500, 'user/onboard', e)
  }
}
