'use client'

import { useState } from 'react'
import { StepContext } from './step-context'
import { StepTasks } from './step-tasks'
import { StepScoreChat } from './step-score-chat'
import { StepReport } from './step-report'
import { AuditContextInput, TaskInput, WizardState } from '@/lib/types'
import { ArrowLeft, Zap } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dark top bar */}
      <div className="bg-[#1c1814] border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-6 py-3.5">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </a>
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#c4621a] flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">AuditAI</span>
          </a>
          <span className="text-white/40 text-sm">
            Step {state.step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step progress */}
        <div className="flex border-t border-white/[0.06]">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                i < state.step
                  ? 'text-white/40 border-b-2 border-transparent'
                  : i === state.step
                  ? 'text-white border-b-2 border-[#c4621a]'
                  : 'text-white/20 border-b-2 border-transparent'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="bg-card border rounded-xl p-7 shadow-sm">
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
    </div>
  )
}
