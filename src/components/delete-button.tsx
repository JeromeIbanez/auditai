'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

type Props = {
  endpoint: string
  redirectTo?: string
  label?: string
  className?: string
}

export function DeleteButton({ endpoint, redirectTo, label = 'Delete', className }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error('Request failed')
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } catch {
      setError('Failed to delete')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
        <span className="text-xs text-muted-foreground">Sure?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading} className="h-7 px-2 text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading} className="h-7 px-2 text-xs">
          Cancel
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setConfirming(true)}
      className={`h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${className ?? ''}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
