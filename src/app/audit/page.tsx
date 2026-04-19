import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AuditWizard } from './_components/audit-wizard'

export const metadata = { title: 'New Audit — AuditAI' }

export default async function AuditPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyName: true, tools: true },
  })

  return <AuditWizard companyName={user?.companyName ?? ''} defaultTools={user?.tools ?? []} />
}
