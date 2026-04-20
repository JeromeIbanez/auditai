'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Printer className="h-3.5 w-3.5" />
      Print / Save as PDF
    </button>
  )
}
