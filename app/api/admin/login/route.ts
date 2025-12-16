// Admin login API endpoint using Supabase Auth

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase'

// Session configuration
const SESSION_COOKIE_NAME = 'solarx_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds
const SOLARX_SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days (1 month) in seconds

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

    const supabase = getSupabaseAdmin()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    })

    if (authError || !authData.user) {
      console.warn(`❌ Failed login attempt: ${email}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user exists in admin_users table and is active
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', authData.user.id)
      .single()

    if (userError || !adminUser) {
      console.warn(`❌ Admin user not found: ${email}`)
      // Sign out from auth if user doesn't exist in admin_users
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied. User is not an admin.' },
        { status: 403 }
      )
    }

    if (!adminUser.is_active) {
      console.warn(`❌ Inactive admin login attempt: ${email}`)
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Account is inactive. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Update last login time
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Check if user has Solar X email for extended session
    const normalizedEmail = email.toLowerCase().trim()
    const isSolarXEmail = normalizedEmail.endsWith('@solar-x.ca')
    const sessionMaxAge = isSolarXEmail ? SOLARX_SESSION_MAX_AGE : SESSION_MAX_AGE

    // Create session token (using Supabase session)
    const sessionToken = authData.session?.access_token || generateSessionToken()
    
    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: sessionMaxAge,
      path: '/', // Available across entire site
    })

    // Also store user info in a separate cookie (non-httpOnly for client access)
    cookieStore.set('solarx_admin_user', JSON.stringify({
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: adminUser.role,
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionMaxAge,
      path: '/',
    })

    // Log successful login
    console.log(`✅ Admin login successful: ${email} (${adminUser.role})`)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

// Generate a simple session token (fallback)
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}
