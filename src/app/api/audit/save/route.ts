import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeScore, getApplicability, getAutomationMode } from '@/lib/scoring'
import { AuditContextInput, TaskInput } from '@/lib/types'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { context, tasks, narrative }: {
    context: AuditContextInput
    tasks: TaskInput[]
    narrative: string
  } = await req.json()

  // Ensure user record exists
  const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
  }).then((r) => r.json()).catch(() => null)

  const email = clerkUser?.email_addresses?.[0]?.email_address ?? `${userId}@unknown.com`

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  })

  const audit = await prisma.audit.create({
    data: {
      userId,
      company: context.company,
      department: context.department,
      teamSize: context.teamSize,
      tools: context.tools,
      status: 'COMPLETE',
      tasks: {
        create: tasks.map((t, i) => {
          const scores = {
            taskVolume: t.taskVolume,
            repeatability: t.repeatability,
            dataSensitivity: t.dataSensitivity,
            timeCost: t.timeCost,
            errorRisk: t.errorRisk,
            currentTooling: t.currentTooling,
          }
          return {
            name: t.name,
            order: i,
            ...scores,
            totalScore: computeScore(scores),
            automationMode: getAutomationMode(scores),
            applicability: getApplicability(scores),
          }
        }),
      },
      report: narrative ? { create: { narrative } } : undefined,
    },
  })

  return NextResponse.json({ auditId: audit.id })
}
