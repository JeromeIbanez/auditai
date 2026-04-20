import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
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

  try {
    const audit = await prisma.audit.create({
      data: {
        userId,
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
              chatContext: t.chatContext ?? null,
            }
          }),
        },
        report: narrative ? { create: { narrative } } : undefined,
      },
    })

    return NextResponse.json({ auditId: audit.id })
  } catch (e) {
    return apiError('Failed to save audit', 500, 'audit/save', e)
  }
}
