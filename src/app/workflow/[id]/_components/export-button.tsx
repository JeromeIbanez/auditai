'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Puzzle, ChevronDown } from 'lucide-react'

type Props = {
  workflowId: string
}

export function ExportButton({ workflowId }: Props) {
  const [open, setOpen] = useState(false)

  const download = (format: 'guide' | 'make') => {
    window.location.href = `/api/workflow/${workflowId}/export/${format}`
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-3.5 w-3.5" />
        Export blueprint
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-20 w-60 bg-background border rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => download('guide')}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Setup guide</p>
                <p className="text-xs text-muted-foreground">Step-by-step instructions (.md)</p>
              </div>
            </button>
            <div className="border-t" />
            <button
              onClick={() => download('make')}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <Puzzle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Make.com blueprint</p>
                <p className="text-xs text-muted-foreground">Import directly in Make.com (.json)</p>
              </div>
            </button>
            <div className="border-t px-4 py-2">
              <p className="text-xs text-muted-foreground">
                You&apos;ll need to connect your accounts in Make after importing.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
