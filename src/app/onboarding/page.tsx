'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Plus, X, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INDUSTRIES } from '@/lib/types'

const SUGGESTED_TOOLS = [
  'Slack', 'Notion', 'HubSpot', 'Salesforce', 'Zendesk', 'Intercom',
  'Jira', 'Linear', 'Airtable', 'Google Workspace', 'Microsoft 365',
  'Zapier', 'Make', 'Stripe', 'Shopify',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [toolInput, setToolInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addTool = (tool: string) => {
    const t = tool.trim()
    if (t && !tools.includes(t)) setTools((prev) => [...prev, t])
    setToolInput('')
  }

  const removeTool = (tool: string) => setTools((prev) => prev.filter((t) => t !== tool))

  const handleSubmit = async () => {
    if (!companyName.trim() || !industry) {
      setError('Company name and industry are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), industry, tools }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1c1814] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="h-8 w-8 rounded-lg bg-[#c4621a] flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">AuditAI</span>
        </div>

        <div className="bg-[#242018] border border-white/[0.08] rounded-2xl p-8 space-y-7">
          <div>
            <h1 className="text-white text-xl font-semibold tracking-tight">Set up your workspace</h1>
            <p className="text-white/50 text-sm mt-1">Takes 30 seconds. Used across all your audits.</p>
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Company name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 focus-visible:ring-[#c4621a] focus-visible:border-[#c4621a]"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Industry</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    industry === ind
                      ? 'bg-[#c4621a] text-white'
                      : 'bg-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.1] border border-white/[0.08]'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Tools your team uses <span className="text-white/30">(optional)</span></Label>
            {/* Selected */}
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tools.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-[#c4621a]/20 border border-[#c4621a]/30 text-[#e07840] rounded-lg text-sm">
                    {t}
                    <button onClick={() => removeTool(t)} className="hover:text-white transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOOLS.filter((t) => !tools.includes(t)).map((t) => (
                <button
                  key={t}
                  onClick={() => addTool(t)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
            {/* Custom input */}
            <div className="flex gap-2 mt-2">
              <Input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTool(toolInput)}
                placeholder="Add custom tool…"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 focus-visible:ring-[#c4621a] focus-visible:border-[#c4621a] text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTool(toolInput)}
                disabled={!toolInput.trim()}
                className="border-white/[0.1] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.1] shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={saving || !companyName.trim() || !industry}
            className="w-full bg-[#c4621a] hover:bg-[#d4722a] text-white gap-2 h-11"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Go to dashboard <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  )
}
