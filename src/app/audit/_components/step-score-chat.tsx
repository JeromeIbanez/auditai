'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Check } from 'lucide-react'
import { AuditContextInput, TaskInput } from '@/lib/types'
import { computeScore, getApplicability, MAX_SCORE } from '@/lib/scoring'

type Justifications = {
  taskVolume: string
  repeatability: string
  dataSensitivity: string
  timeCost: string
  errorRisk: string
  currentTooling: string
}

const DIMENSION_LABELS: Record<keyof Justifications, string> = {
  taskVolume: 'Task volume',
  repeatability: 'Repeatability',
  dataSensitivity: 'Data sensitivity',
  timeCost: 'Time cost',
  errorRisk: 'Error risk',
  currentTooling: 'Current tooling',
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type TaskChatProps = {
  task: TaskInput
  context: AuditContextInput
  isScored: boolean
  savedJustifications: Justifications | null
  onScored: (task: TaskInput, justifications: Justifications) => void
}

function TaskChat({ task, context, isScored, savedJustifications, onScored }: TaskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [exchangeCount, setExchangeCount] = useState(0)
  const [error, setError] = useState('')
  const [justifications, setJustifications] = useState<Justifications | null>(savedJustifications)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    startConversation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const streamResponse = async (msgs: ChatMessage[]) => {
    setStreaming(true)
    setError('')
    const placeholder = { role: 'assistant' as const, content: '' }
    setMessages((prev) => [...prev, placeholder])
    try {
      const res = await fetch('/api/audit/score-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { name: task.name }, context, messages: msgs }),
      })
      if (!res.ok) throw new Error(await res.text())
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value)
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: accumulated },
        ])
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  const startConversation = () => {
    setMessages([])
    setExchangeCount(0)
    streamResponse([])
  }

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setExchangeCount((c) => c + 1)
    await streamResponse(updated)
  }

  const extractScores = async () => {
    setExtracting(true)
    setError('')
    try {
      const res = await fetch('/api/audit/score-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { name: task.name }, context, messages }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { justifications: j, ...scores } = await res.json()
      setJustifications(j)
      onScored({ ...task, ...scores, chatContext: JSON.stringify(messages) }, j)
    } catch {
      setError('Failed to extract scores. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  if (isScored && justifications) {
    const score = computeScore(task)
    const applicability = getApplicability(task)
    const applicabilityColor = applicability === 'HIGH' ? 'text-green-700' : applicability === 'MEDIUM' ? 'text-yellow-700' : 'text-gray-500'
    const scoreBarColor = applicability === 'HIGH' ? 'bg-green-500' : applicability === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-300'

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-800">{task.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${applicabilityColor}`}>{applicability}</span>
            <span className="text-xs text-muted-foreground">{score}/{MAX_SCORE}</span>
          </div>
        </div>
        <div className="px-4 py-1">
          <div className="h-1 rounded-full bg-muted mt-2 mb-3">
            <div className={`h-1 rounded-full ${scoreBarColor}`} style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {(Object.keys(justifications) as (keyof Justifications)[]).map((key) => {
            const dimScore = task[key] as number
            return (
              <div key={key} className="flex items-start gap-3 text-sm">
                <div className="flex items-center gap-1.5 shrink-0 w-36">
                  <span className="text-muted-foreground text-xs">{DIMENSION_LABELS[key]}</span>
                  <span className="font-semibold text-xs">{dimScore}/3</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{justifications[key]}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isScored) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-green-50 border border-green-200 rounded-lg">
        <Check className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800 font-medium">{task.name} — scored</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b">
          <p className="text-sm font-medium">{task.name}</p>
        </div>
        <div className="p-4 space-y-3 min-h-[160px] max-h-[320px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.content || <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t p-3 flex gap-2">
          <Textarea
            placeholder="Your answer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="text-sm min-h-[40px] max-h-[120px] resize-none"
            disabled={streaming}
          />
          <Button size="icon" onClick={sendMessage} disabled={streaming || !input.trim()} className="shrink-0 self-end">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {exchangeCount >= 2 && (
        <Button onClick={extractScores} disabled={extracting} className="w-full gap-2">
          {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</> : <><Check className="h-4 w-4" /> Done — score this task</>}
        </Button>
      )}
    </div>
  )
}

type Props = {
  tasks: TaskInput[]
  context: AuditContextInput
  onNext: (tasks: TaskInput[]) => void
  onBack: () => void
}

export function StepScoreChat({ tasks, context, onNext, onBack }: Props) {
  const [scoredTasks, setScoredTasks] = useState<TaskInput[]>(tasks)
  const [activeIdx, setActiveIdx] = useState(0)
  const [justificationsMap, setJustificationsMap] = useState<Record<string, Justifications>>({})

  const handleScored = (scoredTask: TaskInput, justifications: Justifications) => {
    const updated = scoredTasks.map((t) => (t.id === scoredTask.id ? scoredTask : t))
    setScoredTasks(updated)
    setJustificationsMap((prev) => ({ ...prev, [scoredTask.id]: justifications }))
    // No auto-advance — let the user see the score breakdown first, then pick the next tab
  }

  const scoredIds = new Set(
    scoredTasks
      .filter((t) => t.taskVolume && t.repeatability && t.dataSensitivity && t.timeCost && t.errorRisk && t.currentTooling)
      .map((t) => t.id)
  )
  const allScored = scoredIds.size === tasks.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Assess each task</h2>
        <p className="text-sm text-muted-foreground">
          Answer a few questions about each task. Claude will infer the scores — no forms to fill.
        </p>
      </div>

      {/* Task tabs */}
      <div className="flex gap-2 flex-wrap">
        {tasks.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveIdx(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
              i === activeIdx
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {t.name.length > 20 ? t.name.slice(0, 20) + '…' : t.name}
            {scoredIds.has(t.id) && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-1.5 py-0">✓</Badge>
            )}
          </button>
        ))}
      </div>

      <TaskChat
        key={tasks[activeIdx].id}
        task={tasks[activeIdx]}
        context={context}
        isScored={scoredIds.has(tasks[activeIdx].id)}
        savedJustifications={justificationsMap[tasks[activeIdx].id] ?? null}
        onScored={handleScored}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button onClick={() => onNext(scoredTasks)} disabled={!allScored} className="flex-1">
          Generate report →
        </Button>
      </div>
    </div>
  )
}
