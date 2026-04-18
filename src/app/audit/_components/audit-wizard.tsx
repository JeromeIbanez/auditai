'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { StepContext } from './step-context'
import { StepTasks } from './step-tasks'
import { StepScoreChat } from './step-score-chat'
import { StepReport } from './step-report'
import { AuditContextInput, TaskInput, WizardState } from '@/lib/types'

const STEPS = ['Context', 'Tasks', 'Score', 'Report']

const defaultContext: AuditContextInput = {
  company: '',
  department: '',
  teamSize: 0,
  tools: [],
}

export function AuditWizard() {
  const [state, setState] = useState<WizardState>({
    step: 0,
    context: defaultContext,
    tasks: [],
  })

  const progress = ((state.step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <a href="/" className="text-sm font-semibold tracking-tight">AuditAI</a>
            <span className="text-sm text-muted-foreground">
              Step {state.step + 1} of {STEPS.length} — {STEPS[state.step]}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs ${i <= state.step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {state.step === 0 && (
            <StepContext
              initial={state.context}
              onNext={(context: AuditContextInput) => setState((s) => ({ ...s, step: 1, context }))}
            />
          )}
          {state.step === 1 && (
            <StepTasks
              tasks={state.tasks}
              onNext={(tasks: TaskInput[]) => setState((s) => ({ ...s, step: 2, tasks }))}
              onBack={() => setState((s) => ({ ...s, step: 0 }))}
            />
          )}
          {state.step === 2 && (
            <StepScoreChat
              tasks={state.tasks}
              context={state.context}
              onNext={(tasks: TaskInput[]) => setState((s) => ({ ...s, step: 3, tasks }))}
              onBack={() => setState((s) => ({ ...s, step: 1 }))}
            />
          )}
          {state.step === 3 && (
            <StepReport
              context={state.context}
              tasks={state.tasks}
              onBack={() => setState((s) => ({ ...s, step: 2 }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
