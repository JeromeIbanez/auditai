'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Copy, Check, Star, ChevronDown, ChevronUp,
  Loader2, Wand2, Play, ArrowRight, Clock
} from 'lucide-react'

type Prompt = { id: string; title: string; content: string; version: number }
type Rating = { promptId: string | null; score: number; feedback: string | null }

type Props = {
  workflowId: string
  initialStatus: string
  prompts: Prompt[]
  ratings: Rating[]
  runsCount: number
  timeSavedPerRun: number
}

const STATUS_LABELS: Record<string, { label: string; next: string; action: string }> = {
  DRAFT: { label: 'Draft', next: 'TESTING', action: 'Start testing →' },
  TESTING: { label: 'Testing', next: 'LIVE', action: 'Mark as live →' },
  LIVE: { label: 'Live', next: '', action: '' },
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  TESTING: 'bg-blue-100 text-blue-800',
  LIVE: 'bg-green-100 text-green-800',
}

function PromptCard({
  prompt, workflowId, existingRating, onImproved,
}: {
  prompt: Prompt
  workflowId: string
  existingRating?: Rating
  onImproved: (newPrompt: Prompt) => void
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState(existingRating?.score ?? 0)
  const [feedback, setFeedback] = useState(existingRating?.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existingRating)
  const [improving, setImproving] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitRating = async (score: number) => {
    setRating(score)
    setSaving(true)
    try {
      await fetch('/api/workflow/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, promptId: prompt.id, score, feedback }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const improvePrompt = async () => {
    setImproving(true)
    try {
      const res = await fetch('/api/workflow/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id, workflowId }),
      })
      const { prompt: newPrompt } = await res.json()
      onImproved(newPrompt)
    } finally {
      setImproving(false)
    }
  }

  const lines = prompt.content.split('\n')
  const previewLines = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{prompt.title}</CardTitle>
            <span className="text-xs text-muted-foreground">v{prompt.version}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={copy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap">
            {expanded ? prompt.content : previewLines}
            {!expanded && hasMore && '\n...'}
          </pre>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Show less' : 'Show full prompt'}
            </button>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Rate this prompt after running it</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => submitRating(star)}>
                <Star className={`h-5 w-5 transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-300'}`} />
              </button>
            ))}
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />}
            {saved && !saving && <Check className="h-3.5 w-3.5 text-green-600 ml-2" />}
          </div>
          {rating > 0 && (
            <Textarea
              placeholder="What worked? What didn't? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="text-sm min-h-[60px]"
              onBlur={() => rating > 0 && submitRating(rating)}
            />
          )}
        </div>

        {/* Improve */}
        {rating > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={improvePrompt}
            disabled={improving}
          >
            {improving
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Improving…</>
              : <><Wand2 className="h-3.5 w-3.5" /> Regenerate improved version</>
            }
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function LogRunCard({ workflowId, runsCount, timeSavedPerRun }: { workflowId: string; runsCount: number; timeSavedPerRun: number }) {
  const router = useRouter()
  const [minutes, setMinutes] = useState(timeSavedPerRun > 0 ? String(timeSavedPerRun) : '')
  const [logging, setLogging] = useState(false)
  const [runs, setRuns] = useState(runsCount)
  const totalHours = Math.round((runs * (timeSavedPerRun || Number(minutes) || 0)) / 60 * 10) / 10

  const logRun = async () => {
    setLogging(true)
    try {
      const res = await fetch('/api/workflow/log-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, minutesSaved: Number(minutes) || null }),
      })
      const data = await res.json()
      setRuns(data.runsCount)
      router.refresh()
    } finally {
      setLogging(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Time savings tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{runs}</p>
            <p className="text-xs text-muted-foreground mt-1">Runs logged</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground mt-1">Total time saved</p>
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
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
          </div>
          <Button onClick={logRun} disabled={logging} className="gap-2 shrink-0">
            {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Log run
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkflowClient({ workflowId, initialStatus, prompts: initialPrompts, ratings, runsCount, timeSavedPerRun }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [advancing, setAdvancing] = useState(false)

  const ratingByPrompt = Object.fromEntries(ratings.map((r) => [r.promptId, r]))
  const statusInfo = STATUS_LABELS[status]

  const advanceStatus = async () => {
    setAdvancing(true)
    try {
      const res = await fetch('/api/workflow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      })
      const { status: next } = await res.json()
      setStatus(next)
      router.refresh()
    } finally {
      setAdvancing(false)
    }
  }

  const handleImproved = (newPrompt: Prompt) => {
    setPrompts((prev) => [...prev.filter((p) => p.id !== newPrompt.id), newPrompt]
      .sort((a, b) => a.title.localeCompare(b.title)))
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Prompts</h2>
          <Badge className={`text-xs ${statusColors[status]}`}>{statusInfo.label}</Badge>
          <span className="text-xs text-muted-foreground">{prompts.length} prompts</span>
        </div>
        {statusInfo.action && (
          <Button size="sm" variant="outline" className="gap-2" onClick={advanceStatus} disabled={advancing}>
            {advancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
            {statusInfo.action}
          </Button>
        )}
      </div>

      {status === 'DRAFT' && (
        <p className="text-sm text-muted-foreground">
          Copy a prompt, run it with real inputs, rate the output. Once you&apos;ve tested a few, move to Testing.
        </p>
      )}
      {status === 'TESTING' && (
        <p className="text-sm text-muted-foreground">
          Rate prompts, use &ldquo;Regenerate&rdquo; to improve weak ones, then mark live when the team is happy.
        </p>
      )}
      {status === 'LIVE' && (
        <p className="text-sm text-muted-foreground">
          Workflow is live. Log runs below to track time saved.
        </p>
      )}

      <Separator />

      {/* Time tracker (shown in testing + live) */}
      {status !== 'DRAFT' && (
        <LogRunCard workflowId={workflowId} runsCount={runsCount} timeSavedPerRun={timeSavedPerRun} />
      )}

      {/* Prompt cards */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            workflowId={workflowId}
            existingRating={ratingByPrompt[prompt.id]}
            onImproved={handleImproved}
          />
        ))}
      </div>
    </div>
  )
}
