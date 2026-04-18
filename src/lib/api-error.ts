import { NextResponse } from 'next/server'

export function apiError(
  message: string,
  status = 500,
  context?: string,
  cause?: unknown
): NextResponse {
  const tag = context ? `[${context}]` : '[api]'
  console.error(`${tag} ${message}`, cause ?? '')
  return NextResponse.json({ error: message }, { status })
}
