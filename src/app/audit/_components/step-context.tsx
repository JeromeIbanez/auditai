'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { AuditContextInput, DEPARTMENTS } from '@/lib/types'

type Props = {
  initial: AuditContextInput
  onNext: (data: AuditContextInput) => void
}

export function StepContext({ initial, onNext }: Props) {
  const [form, setForm] = useState<AuditContextInput>(initial)
  const [toolInput, setToolInput] = useState('')

  const addTool = () => {
    const t = toolInput.trim()
    if (t && !form.tools.includes(t)) {
      setForm((f) => ({ ...f, tools: [...f.tools, t] }))
    }
    setToolInput('')
  }

  const removeTool = (tool: string) =>
    setForm((f) => ({ ...f, tools: f.tools.filter((t) => t !== tool) }))

  const valid = form.company.trim() && form.department && form.teamSize > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Department context</h2>
        <p className="text-sm text-muted-foreground">
          This becomes the foundation for every AI recommendation in your audit.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            placeholder="Acme Corp"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
        </div>

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
          <Label htmlFor="tools">Tools your team uses (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="tools"
              placeholder="Salesforce, Slack, Notion..."
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
            />
            <Button type="button" variant="outline" onClick={addTool}>Add</Button>
          </div>
          {form.tools.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tools.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => removeTool(t)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button onClick={() => onNext(form)} disabled={!valid} className="w-full">
        Continue to task mapping →
      </Button>
    </div>
  )
}
