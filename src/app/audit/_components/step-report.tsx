'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, Loader2, TrendingUp, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuditContextInput, TaskInput } from '@/lib/types'
import { computeScore, getApplicability, getAutomationMode, MAX_SCORE, PILOT_THRESHOLD } from '@/lib/scoring'

type Props = {
  context: AuditContextInput
  tasks: TaskInput[]
  onBack: () => void
}

const applicabilityColors: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-600',
}

const modeColors: Record<string, string> = {
  AUTOMATE: 'bg-green-100 text-green-800',
  ASSIST: 'bg-blue-100 text-blue-800',
  SKIP: 'bg-gray-100 text-gray-600',
}

export function StepReport({ context, tasks, onBack }: Props) {
  const router = useRouter()
  const [narrative, setNarrative] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sortedTasks = [...tasks].sort((a, b) => computeScore(b) - computeScore(a))
  const actionableOpportunities = sortedTasks.filter((t) => getApplicability(t) !== 'LOW')

  useEffect(() => {
    generateReport()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateReport() {
    setIsStreaming(true)
    setNarrative('')
    setError('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/audit/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, tasks: sortedTasks }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setNarrative((prev) => prev + decoder.decode(value))
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Your AI opportunity report</h2>
        <p className="text-sm text-muted-foreground">
          {context.department} · {context.teamSize} people
          {context.tools.length > 0 && ` · ${context.tools.join(', ')}`}
        </p>
      </div>

      {/* Priority matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Opportunity rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedTasks.map((task, i) => {
            const score = computeScore(task)
            const applicability = getApplicability(task)
            const mode = getAutomationMode(task)
            const pct = (score / MAX_SCORE) * 100
            return (
              <div key={task.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <span className="text-sm font-medium truncate">{task.name}</span>
                    {task.errorRisk === 1 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={`text-xs ${applicabilityColors[applicability]}`}>{applicability}</Badge>
                    <Badge className={`text-xs ${modeColors[mode]}`}>{mode}</Badge>
                    <span className="text-xs text-muted-foreground w-12 text-right">{score}/{MAX_SCORE}</span>
                  </div>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${applicability === 'HIGH' ? '[&>div]:bg-green-500' : applicability === 'MEDIUM' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-gray-300'}`}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* AI narrative */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              AI analysis
            </CardTitle>
            {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}
              <Button variant="ghost" size="sm" onClick={generateReport} className="ml-2">Retry</Button>
            </div>
          ) : narrative ? (
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {narrative}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating your report...
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      {!isStreaming && narrative && actionableOpportunities.length > 0 && (
        <>
          <Separator />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="font-semibold">
                      {actionableOpportunities.length} {actionableOpportunities.length === 1 ? 'opportunity' : 'opportunities'} ready to implement
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save your audit and activate workflows directly from your dashboard.
                    </p>
                  </div>
                              <Button
                      className="gap-2"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true)
                        try {
                          const res = await fetch('/api/audit/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ context, tasks, narrative }),
                          })
                          if (!res.ok) throw new Error(await res.text())
                          router.push('/dashboard')
                        } finally {
                          setSaving(false)
                        }
                      }}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Save to dashboard
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Button variant="outline" onClick={onBack} size="sm">← Edit scores</Button>
    </div>
  )
}
