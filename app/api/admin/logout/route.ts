// Admin logout API endpoint
// Clears the admin session cookie

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'solarx_admin_session'

export async function POST() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    console.log('✅ Admin logged out')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

