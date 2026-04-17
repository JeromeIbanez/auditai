'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { TaskInput } from '@/lib/types'
import { nanoid } from 'nanoid'

type Props = {
  tasks: TaskInput[]
  onNext: (tasks: TaskInput[]) => void
  onBack: () => void
}

const defaultScores = {
  taskVolume: 2,
  repeatability: 2,
  dataSensitivity: 2,
  timeCost: 2,
  errorRisk: 2,
  currentTooling: 2,
}

const SUGGESTIONS: Record<string, string[]> = {
  Sales: ['Write outbound emails', 'Summarize call notes', 'Draft proposals', 'Research prospects', 'Update CRM records'],
  Marketing: ['Write ad copy', 'Draft blog posts', 'Create social content', 'Summarize campaign reports', 'Write email sequences'],
  Operations: ['Summarize meeting notes', 'Write SOPs', 'Draft status reports', 'Create project templates', 'Compile weekly updates'],
  HR: ['Write job descriptions', 'Draft offer letters', 'Create onboarding docs', 'Summarize interview notes', 'Write policies'],
  Finance: ['Summarize financial reports', 'Write data commentary', 'Draft investor updates', 'Compile budget variances', 'Create presentations'],
  Engineering: ['Write PRDs', 'Summarize sprint retros', 'Generate test cases', 'Write documentation', 'Draft code review feedback'],
  Product: ['Write user stories', 'Summarize user research', 'Draft product specs', 'Create release notes', 'Synthesize feedback'],
  'Customer Support': ['Draft ticket responses', 'Summarize customer issues', 'Write FAQ entries', 'Create escalation summaries', 'Draft knowledge base articles'],
  Legal: ['Review contract clauses', 'Draft policy documents', 'Summarize legal memos', 'Compare document versions', 'Create compliance checklists'],
}

type TaskItemProps = {
  task: TaskInput
  index: number
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
}

function TaskItem({ task, index, onRemove, onRename }: TaskItemProps) {
  return (
    <Card>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground w-5 shrink-0">{index + 1}.</span>
        <Input
          value={task.name}
          onChange={(e) => onRename(task.id, e.target.value)}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0"
          placeholder="Task name..."
        />
        <button
          onClick={() => onRemove(task.id)}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}

export function StepTasks({ tasks, onNext, onBack }: Props) {
  const [items, setItems] = useState<TaskInput[]>(tasks)
  const [input, setInput] = useState('')
  const [department] = useState('')

  const addTask = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setItems((prev) => [...prev, { id: nanoid(), name: trimmed, ...defaultScores }])
    setInput('')
  }

  const removeTask = (id: string) => setItems((prev) => prev.filter((t) => t.id !== id))

  const renameTask = (id: string, name: string) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))

  const suggestions = SUGGESTIONS[department] ?? []
  const unusedSuggestions = suggestions.filter((s) => !items.some((t) => t.name === s))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Map your tasks</h2>
        <p className="text-sm text-muted-foreground">
          List the recurring tasks your team performs. Aim for 5–10. Be specific — &ldquo;write outbound emails&rdquo; is better than &ldquo;write stuff.&rdquo;
        </p>
      </div>

      <div className="space-y-2">
        {items.map((task, i) => (
          <TaskItem key={task.id} task={task} index={i} onRemove={removeTask} onRename={renameTask} />
        ))}

        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask(input))}
          />
          <Button type="button" variant="outline" onClick={() => addTask(input)} disabled={!input.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">COMMON FOR YOUR DEPARTMENT</p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addTask(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button
          onClick={() => onNext(items)}
          disabled={items.filter((t) => t.name.trim()).length < 2}
          className="flex-1"
        >
          Score opportunities →
        </Button>
      </div>
    </div>
  )
}
