'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Zap, User, ArrowRight, ArrowRightLeft, CheckCircle2,
  ChevronDown, ChevronUp, Copy, Check, Star, Wand2,
  Play, Loader2, Clock, Plus,
} from 'lucide-react'
import { StepType } from '@/lib/types'

type WorkflowStep = {
  id: string
  order: number
  type: StepType
  tool: string | null
  title: string
  description: string
  prompt: string | null
  promptVersion: number
}

type WorkflowRating = {
  id: string
  score: number
  feedback: string | null
}

type Props = {
  workflowId: string
  summary: string | null
  initialStatus: string
  steps: WorkflowStep[]
  ratings: WorkflowRating[]
  runsCount: number
  timeSavedPerRun: number
}

const STATUS_FLOW: Record<string, { next: string; action: string } | null> = {
  DRAFT: { next: 'TESTING', action: 'Start testing' },
  TESTING: { next: 'LIVE', action: 'Mark as live' },
  LIVE: null,
}

const stepConfig: Record<StepType, { icon: React.ReactNode; label: string; color: string; border: string; bg: string }> = {
  TRIGGER: {
    icon: <Zap className="h-3.5 w-3.5" />,
    label: 'Trigger',
    color: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
  },
  AI: {
    icon: <Zap className="h-3.5 w-3.5" />,
    label: 'AI',
    color: 'text-[#c4621a]',
    border: 'border-[#c4621a]/20',
    bg: 'bg-[#c4621a]/5',
  },
  HUMAN: {
    icon: <User className="h-3.5 w-3.5" />,
    label: 'Human',
    color: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  INTEGRATION: {
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    label: 'Integration',
    color: 'text-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
  },
  OUTPUT: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Output',
    color: 'text-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
  },
}

function StepCard({ step, workflowId }: { step: WorkflowStep; workflowId: string }) {
  const cfg = stepConfig[step.type]
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [improving, setImproving] = useState(false)
  const [runInput, setRunInput] = useState('')
  const [runOutput, setRunOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(step.prompt)
  const [promptVersion, setPromptVersion] = useState(step.promptVersion)

  const copy = async () => {
    if (!currentPrompt) return
    await navigator.clipboard.writeText(currentPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitRating = async (score: number) => {
    setRating(score)
    setSaving(true)
    try {
      await fetch('/api/workflow/rate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, score, feedback }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const runStep = async () => {
    setRunning(true)
    setRunOutput('')
    try {
      const res = await fetch('/api/workflow/run-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, workflowId, input: runInput }),
      })
      if (!res.ok) throw new Error(await res.text())
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setRunOutput((prev) => prev + decoder.decode(value))
      }
    } finally {
      setRunning(false)
    }
  }

  const improveStep = async () => {
    setImproving(true)
    try {
      const res = await fetch('/api/workflow/improve-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { step: updated } = await res.json()
      setCurrentPrompt(updated.prompt)
      setPromptVersion(updated.promptVersion)
    } finally {
      setImproving(false)
    }
  }

  return (
    <div className={`rounded-xl border ${cfg.border} bg-card overflow-hidden`}>
      {/* Step header */}
      <div className={`px-4 py-3 flex items-start justify-between gap-3 ${cfg.bg}`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
              {step.tool && (
                <span className="text-xs bg-white/70 border border-black/10 text-foreground/70 px-2 py-0.5 rounded-md">
                  {step.tool}
                </span>
              )}
            </div>
            <p className="font-medium text-sm mt-0.5 text-foreground">{step.title}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-1">#{step.order + 1}</span>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-t border-border/50">
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>

      {/* AI step extras */}
      {step.type === 'AI' && currentPrompt && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Prompt v{promptVersion}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={copy}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {expanded && (
              <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-relaxed">
                <pre className="whitespace-pre-wrap">{currentPrompt}</pre>
              </div>
            )}
          </div>

          {/* Try it */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Try it</p>
            <Textarea
              placeholder="Paste your input here…"
              value={runInput}
              onChange={(e) => setRunInput(e.target.value)}
              className="text-sm min-h-[72px] resize-none"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={runStep}
              disabled={running || !runInput.trim()}
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {running ? 'Running…' : 'Run'}
            </Button>
            {runOutput && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Output</p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{runOutput}</pre>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground">Rate this prompt</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => submitRating(s)}>
                  <Star className={`h-4 w-4 transition-colors ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`} />
                </button>
              ))}
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />}
              {saved && !saving && <Check className="h-3.5 w-3.5 text-green-600 ml-2" />}
            </div>
            {rating > 0 && (
              <Textarea
                placeholder="What worked or didn't? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onBlur={() => rating > 0 && submitRating(rating)}
                className="text-sm min-h-[52px] resize-none"
              />
            )}
            {rating > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={improveStep} disabled={improving}>
                {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {improving ? 'Improving…' : 'Regenerate prompt'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-px h-3 bg-border" />
        <ArrowRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
        <div className="w-px h-3 bg-border" />
      </div>
    </div>
  )
}

function TimeTracker({ workflowId, runsCount, timeSavedPerRun }: { workflowId: string; runsCount: number; timeSavedPerRun: number }) {
  const router = useRouter()
  const [minutes, setMinutes] = useState(timeSavedPerRun > 0 ? String(timeSavedPerRun) : '')
  const [logging, setLogging] = useState(false)
  const [runs, setRuns] = useState(runsCount)
  const mins = timeSavedPerRun || Number(minutes) || 0
  const totalHours = Math.round((runs * mins) / 60 * 10) / 10

  const logRun = async () => {
    setLogging(true)
    try {
      const res = await fetch('/api/workflow/log-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, minutesSaved: Number(minutes) || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRuns(data.runsCount)
      router.refresh()
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Time savings</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{runs}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Runs logged</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalHours > 0 ? `${totalHours}h` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Time saved</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            min={1}
            placeholder="Minutes saved per run"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="pr-12 text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
        </div>
        <Button onClick={logRun} disabled={logging} size="sm" className="gap-1.5 shrink-0">
          {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Log run
        </Button>
      </div>
    </div>
  )
}

export function WorkflowClient({
  workflowId, summary, initialStatus, steps, ratings, runsCount, timeSavedPerRun,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [advancing, setAdvancing] = useState(false)

  const statusFlow = STATUS_FLOW[status]

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    TESTING: 'bg-blue-100 text-blue-800',
    LIVE: 'bg-green-100 text-green-800',
  }

  const advanceStatus = async () => {
    setAdvancing(true)
    try {
      const res = await fetch('/api/workflow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { status: next } = await res.json()
      setStatus(next)
      router.refresh()
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
          <span className="text-xs text-muted-foreground">{steps.length} steps · {ratings.length} ratings</span>
        </div>
        {statusFlow && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={advanceStatus} disabled={advancing}>
            {advancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
            {statusFlow.action}
          </Button>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{summary}</p>
      )}

      {/* Flow */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Workflow steps</p>
        <div>
          {steps.map((step, i) => (
            <div key={step.id}>
              <StepCard step={step} workflowId={workflowId} />
              {i < steps.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </div>

      {/* Time tracker */}
      {status !== 'DRAFT' && (
        <TimeTracker workflowId={workflowId} runsCount={runsCount} timeSavedPerRun={timeSavedPerRun} />
      )}
    </div>
  )
}
