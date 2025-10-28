// Admin login API endpoint with mock credentials
// Creates a secure session cookie for authenticated admins

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock credentials for demo/development
// In production, these would be replaced with proper authentication
const MOCK_CREDENTIALS = {
  email: 'admin@solarx.ca',
  password: 'admin123',
}

// Session configuration
const SESSION_COOKIE_NAME = 'solarx_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate input fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check credentials against mock data
    if (
      email.toLowerCase() === MOCK_CREDENTIALS.email.toLowerCase() &&
      password === MOCK_CREDENTIALS.password
    ) {
      // Create session token (simple random string for now)
      // In production, use JWT or proper session management
      const sessionToken = generateSessionToken()
      
      // Set secure HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        maxAge: SESSION_MAX_AGE,
        path: '/', // Available across entire site
      })

      // Log successful login
      console.log(`✅ Admin login successful: ${email}`)

      return NextResponse.json({
        success: true,
        message: 'Login successful',
      })
    }

    // Invalid credentials - log attempt
    console.warn(`❌ Failed login attempt: ${email}`)

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

// Generate a simple session token
// In production, use crypto.randomBytes() or JWT
function generateSessionToken(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

