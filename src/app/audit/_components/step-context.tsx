'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
import { AuditContextInput, DEPARTMENTS } from '@/lib/types'

type Props = {
  initial: AuditContextInput
  defaultTools: string[] // from user profile
  onNext: (data: AuditContextInput) => void
}

export function StepContext({ initial, defaultTools, onNext }: Props) {
  const [form, setForm] = useState<AuditContextInput>(initial)
  const [toolInput, setToolInput] = useState('')

  const addTool = (tool?: string) => {
    const t = (tool ?? toolInput).trim()
    if (t && !form.tools.includes(t)) setForm((f) => ({ ...f, tools: [...f.tools, t] }))
    if (!tool) setToolInput('')
  }

  const removeTool = (tool: string) =>
    setForm((f) => ({ ...f, tools: f.tools.filter((t) => t !== tool) }))

  const valid = form.department && form.teamSize > 0

  const unusedDefaults = defaultTools.filter((t) => !form.tools.includes(t))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Department context</h2>
        <p className="text-sm text-muted-foreground">
          This shapes every AI recommendation in the audit.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={form.department}
            onValueChange={(v) => setForm((f) => ({ ...f, department: v ?? '' }))}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamSize">Team size</Label>
          <Input
            id="teamSize"
            type="number"
            min={1}
            max={500}
            placeholder="12"
            value={form.teamSize || ''}
            onChange={(e) => setForm((f) => ({ ...f, teamSize: parseInt(e.target.value) || 0 }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Tools this team uses</Label>

          {/* Selected tools */}
          {form.tools.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {form.tools.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm">
                  {t}
                  <button onClick={() => removeTool(t)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick-add from profile defaults */}
          {unusedDefaults.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {unusedDefaults.map((t) => (
                <button
                  key={t}
                  onClick={() => addTool(t)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
          )}

          {/* Custom input */}
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Add another tool…"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => addTool()} disabled={!toolInput.trim()} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={() => onNext(form)} disabled={!valid} className="w-full">
        Continue to task mapping →
      </Button>
    </div>
  )
}
