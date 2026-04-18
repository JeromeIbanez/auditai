import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider, Show, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'AuditAI — AI Transition OS',
  description: 'Identify AI opportunities and implement them. From audit to working workflow.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider>
          <Show when="signed-in">
            <div className="hidden" id="clerk-user-button">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <div className="hidden" id="clerk-auth-buttons">
              <SignInButton />
              <SignUpButton />
            </div>
          </Show>
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  )
}
