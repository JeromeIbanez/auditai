import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/audit(.*)', '/workflow(.*)', '/onboarding(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()

    // Skip onboarding check for the onboarding page itself and API routes
    if (isOnboardingRoute(req) || req.nextUrl.pathname.startsWith('/api/')) return

    const { userId } = await auth()
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { onboarded: true } })
      if (!user?.onboarded) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
