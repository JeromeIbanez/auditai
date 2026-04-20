import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StepType } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from './_components/print-button'

type Props = { params: Promise<{ id: string }> }

const TYPE_LABELS: Record<StepType, string> = {
  TRIGGER:     'Trigger',
  AI:          'AI Step',
  HUMAN:       'Human Step',
  INTEGRATION: 'Integration',
  OUTPUT:      'Output',
}

const TYPE_COLORS: Record<StepType, { badge: string; border: string; bg: string }> = {
  TRIGGER:     { badge: 'bg-amber-100 text-amber-800',   border: 'border-amber-200',  bg: 'bg-amber-50' },
  AI:          { badge: 'bg-orange-100 text-orange-800', border: 'border-orange-200', bg: 'bg-orange-50' },
  HUMAN:       { badge: 'bg-blue-100 text-blue-800',     border: 'border-blue-200',   bg: 'bg-blue-50' },
  INTEGRATION: { badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200', bg: 'bg-purple-50' },
  OUTPUT:      { badge: 'bg-green-100 text-green-800',   border: 'border-green-200',  bg: 'bg-green-50' },
}

function getImplementationNote(type: StepType, tool: string | null, title: string): string {
  switch (type) {
    case 'TRIGGER':
      return tool
        ? `In Make.com: search for "${tool}" → select a watch event matching "${title}" → connect your ${tool} account.`
        : `In Make.com: use "Webhooks → Custom Webhook" as the trigger, or start this workflow manually.`
    case 'AI':
      return `Copy the prompt below and run it in Claude, ChatGPT, or any AI tool. In Make.com, add an "OpenAI → Create a Chat Completion" module and paste the prompt as the system message.`
    case 'HUMAN':
      return `A team member must complete this step manually before the workflow continues.${tool ? ` Use ${tool} to do this.` : ''} Consider sending a notification (email or Slack) to alert the right person.`
    case 'INTEGRATION':
      return tool
        ? `In Make.com: search for "${tool}" → find an action matching "${title}" → connect your ${tool} account and map the input fields from the previous step.`
        : `In Make.com: use the "HTTP → Make a Request" module to call the relevant API for this step.`
    case 'OUTPUT':
      return tool
        ? `Add a "${tool}" action in Make.com to send or store the final output. Map the content from the step above.`
        : `Add a Send Email, Slack message, or storage action to deliver the final result.`
  }
}

export default async function WorkflowGuidePage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params

  const workflow = await prisma.workflow.findFirst({
    where: { id, audit: { userId } },
    include: {
      task: true,
      audit: { select: { department: true, tools: true } },
      steps: { orderBy: { order: 'asc' } },
    },
  })

  if (!workflow) notFound()

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <Link
          href={`/workflow/${workflow.id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to workflow
        </Link>
        <PrintButton />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-8 py-12 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Workflow Setup Guide</p>
          <h1 className="text-2xl font-bold tracking-tight">{workflow.task.name}</h1>
          <p className="text-sm text-muted-foreground">{workflow.audit.department}</p>
          {workflow.summary && (
            <p className="text-sm text-foreground/80 italic pt-1">{workflow.summary}</p>
          )}
        </div>

        {/* How to use callout */}
        <div className="rounded-lg border bg-muted/30 px-5 py-4 space-y-2">
          <p className="text-sm font-semibold">How to use this guide</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow these steps as a manual checklist, or use them as a blueprint to set up an automated scenario in{' '}
            <strong>Make.com</strong>, Zapier, or n8n. Each step explains what to do and how to configure it in an automation tool.
          </p>
          {workflow.audit.tools.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              <span className="font-medium">Tools used:</span> {workflow.audit.tools.join(', ')}
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {workflow.steps.map((step, i) => {
            const cfg = TYPE_COLORS[step.type as StepType]
            return (
              <div key={step.id} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                {/* Step header */}
                <div className={`px-5 py-3 ${cfg.bg} flex items-center gap-3`}>
                  <span className="text-sm font-bold text-muted-foreground/40 shrink-0">#{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {TYPE_LABELS[step.type as StepType]}
                      </span>
                      {step.tool && (
                        <span className="text-xs bg-white/70 border border-black/10 px-2 py-0.5 rounded-md text-foreground/70">
                          {step.tool}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm mt-1">{step.title}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4 bg-white">
                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {/* Implementation note */}
                  <div className="rounded-md bg-muted/40 px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">How to implement</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {getImplementationNote(step.type as StepType, step.tool, step.title)}
                    </p>
                  </div>

                  {/* AI prompt */}
                  {step.type === 'AI' && step.prompt && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prompt</p>
                      <pre className="bg-muted rounded-lg px-4 py-3 text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {step.prompt}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center border-t pt-6">
          Replace placeholders like <code className="bg-muted px-1 rounded">[CUSTOMER NAME]</code> and{' '}
          <code className="bg-muted px-1 rounded">[TICKET CONTENT]</code> with actual data fields from your trigger.
          You will need to connect your accounts in whichever automation tool you use.
        </p>
      </div>
    </div>
  )
}
