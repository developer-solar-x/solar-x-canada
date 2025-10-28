// Next.js middleware for admin route protection
// Checks for valid session cookie before allowing access to admin pages

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'solarx_admin_session'

export function middleware(request: NextRequest) {
  // Check if request is for admin routes (except login page)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Allow access to login page without authentication
  if (isLoginPage) {
    return NextResponse.next()
  }

  // Check for admin session cookie on protected admin routes
  if (isAdminRoute) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

    // If no valid session, redirect to login page
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url)
      // Add redirect parameter to return after login
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      
      console.warn(`🔒 Unauthorized access attempt to: ${request.nextUrl.pathname}`)
      
      return NextResponse.redirect(loginUrl)
    }

    // Session exists - allow access
    console.log(`✅ Authenticated admin access: ${request.nextUrl.pathname}`)
  }

  return NextResponse.next()
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    '/admin/:path*', // All admin routes
  ],
}

