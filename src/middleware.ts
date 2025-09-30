import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // If user is accessing app routes without auth, redirect to signin
    if (req.nextUrl.pathname.startsWith('/app') && !req.nextauth.token) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${req.nextUrl.pathname}`, req.url)
      )
    }

    // If authenticated user tries to access auth pages, redirect to app
    if (req.nextauth.token && 
        (req.nextUrl.pathname.startsWith('/auth/signin') || 
         req.nextUrl.pathname.startsWith('/auth/signup'))) {
      return NextResponse.redirect(new URL('/app', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (!req.nextUrl.pathname.startsWith('/app')) {
          return true
        }
        // Require auth for app routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/app/:path*',
    '/auth/signin',
    '/auth/signup'
  ]
}