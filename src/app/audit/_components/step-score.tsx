'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { TaskInput } from '@/lib/types'
import { computeScore, getApplicability, getAutomationMode, MAX_SCORE, PILOT_THRESHOLD } from '@/lib/scoring'

type Props = {
  tasks: TaskInput[]
  onNext: (tasks: TaskInput[]) => void
  onBack: () => void
}

type Dimension = {
  key: keyof Omit<TaskInput, 'id' | 'name'>
  label: string
  description: string
  options: [string, string, string]
}

const DIMENSIONS: Dimension[] = [
  {
    key: 'taskVolume',
    label: 'Task volume',
    description: 'How often is this task performed?',
    options: ['Rare (monthly or less)', 'Regular (weekly)', 'Frequent (daily)'],
  },
  {
    key: 'repeatability',
    label: 'Repeatability',
    description: 'Does the task follow a consistent structure each time?',
    options: ['Highly variable', 'Somewhat consistent', 'Routine & structured'],
  },
  {
    key: 'dataSensitivity',
    label: 'Data sensitivity',
    description: 'How sensitive is the data involved?',
    options: ['Highly sensitive (PII, legal, financial)', 'Moderately sensitive', 'Not sensitive'],
  },
  {
    key: 'timeCost',
    label: 'Time cost',
    description: 'How long does this take a human each time?',
    options: ['Minutes', '30 min – 1 hour', 'Hours'],
  },
  {
    key: 'errorRisk',
    label: 'Error risk',
    description: 'What is the cost if an AI output is wrong?',
    options: ['Catastrophic (legal, financial, reputational)', 'Significant but recoverable', 'Low — easily caught and fixed'],
  },
  {
    key: 'currentTooling',
    label: 'Current tooling',
    description: 'Is there existing tooling AI must integrate with?',
    options: ['Complex stack required', 'Some integration needed', 'None — AI can act standalone'],
  },
]

const applicabilityColors: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-red-100 text-red-800 border-red-200',
}

const modeColors: Record<string, string> = {
  AUTOMATE: 'bg-green-100 text-green-800',
  ASSIST: 'bg-blue-100 text-blue-800',
  SKIP: 'bg-gray-100 text-gray-600',
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / MAX_SCORE) * 100
  const applicability = score >= PILOT_THRESHOLD ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Score</span>
        <span className="font-medium">{score} / {MAX_SCORE}</span>
      </div>
      <Progress
        value={pct}
        className={`h-2 ${applicability === 'HIGH' ? '[&>div]:bg-green-500' : applicability === 'MEDIUM' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-400'}`}
      />
    </div>
  )
}

export function StepScore({ tasks, onNext, onBack }: Props) {
  const [scored, setScored] = useState<TaskInput[]>(tasks)
  const [activeTask, setActiveTask] = useState(0)

  const task = scored[activeTask]

  const updateScore = (key: keyof Omit<TaskInput, 'id' | 'name'>, value: number) => {
    setScored((prev) =>
      prev.map((t, i) => (i === activeTask ? { ...t, [key]: value } : t))
    )
  }

  const taskScore = computeScore(task)
  const applicability = getApplicability(task)
  const mode = getAutomationMode(task)
  const allScored = scored.every((t) => Object.values({
    taskVolume: t.taskVolume, repeatability: t.repeatability, dataSensitivity: t.dataSensitivity,
    timeCost: t.timeCost, errorRisk: t.errorRisk, currentTooling: t.currentTooling
  }).every(Boolean))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Score each opportunity</h2>
        <p className="text-sm text-muted-foreground">
          Rate each task across 6 dimensions. These scores determine which opportunities to prioritize.
        </p>
      </div>

      {/* Task tabs */}
      <div className="flex gap-2 flex-wrap">
        {scored.map((t, i) => {
          const s = computeScore(t)
          const a = getApplicability(t)
          return (
            <button
              key={t.id}
              onClick={() => setActiveTask(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                i === activeTask
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {t.name.length > 20 ? t.name.slice(0, 20) + '…' : t.name}
              {s > 0 && (
                <span className={`ml-2 text-xs font-normal ${i === activeTask ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {s}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active task scoring */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base">{task.name}</CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`text-xs ${applicabilityColors[applicability]}`}>{applicability}</Badge>
              <Badge className={`text-xs ${modeColors[mode]}`}>{mode}</Badge>
            </div>
          </div>
          <ScoreBar score={taskScore} />
          {task.errorRisk === 1 && (
            <div className="flex items-center gap-2 text-amber-600 text-xs mt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Catastrophic error risk — will be recommended as Assist only, not full automation.
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="space-y-2">
              <div>
                <p className="text-sm font-medium">{dim.label}</p>
                <p className="text-xs text-muted-foreground">{dim.description}</p>
              </div>
              <RadioGroup
                value={String(task[dim.key])}
                onValueChange={(v) => updateScore(dim.key, parseInt(v))}
                className="flex flex-col sm:flex-row gap-2"
              >
                {dim.options.map((label, idx) => {
                  const val = String(idx + 1)
                  const selected = String(task[dim.key]) === val
                  return (
                    <Label
                      key={val}
                      htmlFor={`${dim.key}-${val}`}
                      className={`flex-1 flex items-start gap-2 border rounded-lg p-3 cursor-pointer transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={val} id={`${dim.key}-${val}`} className="mt-0.5 shrink-0" />
                      <span className="text-xs leading-relaxed">{label}</span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {activeTask > 0 ? (
          <Button variant="outline" onClick={() => setActiveTask((i) => i - 1)} className="flex-1">
            ← {scored[activeTask - 1].name.slice(0, 15)}
          </Button>
        ) : (
          <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        )}

        {activeTask < scored.length - 1 ? (
          <Button onClick={() => setActiveTask((i) => i + 1)} className="flex-1">
            {scored[activeTask + 1].name.slice(0, 15)} →
          </Button>
        ) : (
          <Button onClick={() => onNext(scored)} disabled={!allScored} className="flex-1">
            Generate report →
          </Button>
        )}
      </div>
    </div>
  )
}
