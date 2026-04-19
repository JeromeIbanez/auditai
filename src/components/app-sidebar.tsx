'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Button } from './ui/button'
import { LayoutDashboard, Plus, Zap } from 'lucide-react'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 bg-[#1c1814] flex flex-col h-screen sticky top-0 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-[#c4621a] flex items-center justify-center shrink-0">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight text-sm">AuditAI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <Link href="/dashboard">
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/dashboard'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
          }`}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </div>
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-3">
        <Link href="/audit">
          <Button className="w-full gap-2 text-sm h-9 bg-[#c4621a] hover:bg-[#d4722a] text-white border-0 shadow-none">
            <Plus className="h-3.5 w-3.5" /> New audit
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-1">
          <UserButton />
          <span className="text-white/30 text-xs truncate">Account</span>
        </div>
      </div>
    </aside>
  )
}
