import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
  
  const token = request.cookies.get(cookieName)?.value
  const { pathname } = request.nextUrl

  // Public paths that do not require authentication
  const publicPaths = ['/signin', '/signup', '/verify-email', '/api/auth']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // We rely on layout Server Components to do the deeper checks like user.status, 
  // twoFactorPending, and specific Role-Based Access Control since Prisma can't run here.

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except we want to protect some APIs but let server actions handle it)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
