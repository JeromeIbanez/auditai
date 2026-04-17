'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, Loader2 } from 'lucide-react'

type Props = {
  auditId: string
  taskId: string
}

export function ActivateButton({ auditId, taskId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function activate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/workflow/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, taskId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { workflowId } = await res.json()
      router.push(`/workflow/${workflowId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" className="gap-2" onClick={activate} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        {loading ? 'Generating workflow…' : 'Activate workflow'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
