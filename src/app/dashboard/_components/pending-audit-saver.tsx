'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PendingAuditSaver() {
  const router = useRouter()

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingAudit')
    if (!raw) return
    sessionStorage.removeItem('pendingAudit')

    const pending = JSON.parse(raw)
    fetch('/api/audit/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending),
    })
      .then((r) => r.json())
      .then(({ auditId }) => {
        if (auditId) router.push(`/audit/${auditId}`)
      })
      .catch(() => {
        // If save fails, drop it — user can re-run the audit
      })
  }, [router])

  return null
}
