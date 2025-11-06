// Users API endpoint - GET all users, POST create user

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET: Fetch all admin users
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch all users (excluding password - using Supabase Auth)
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at, created_by')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database fetch users error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        users: users || []
      }
    })

  } catch (error) {
    console.error('Fetch users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Create a new admin user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, password, role = 'admin' } = body

    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, password' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'superadmin', 'sales'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, superadmin, or sales' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if user already exists in admin_users table first (simpler check)
    const { data: existingAdminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingAdminUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check if user exists in auth (but not in admin_users - might need to link)
    // Note: getUserByEmail doesn't exist in Supabase Auth Admin API, so we use listUsers
    const normalizedEmail = email.toLowerCase().trim()
    const { data: listUsersData, error: listUsersError } = await supabase.auth.admin.listUsers()
    
    if (!listUsersError && listUsersData?.users) {
      // Find user by email - users array contains User objects with email property
      const existingAuthUser = listUsersData.users.find((user: any) => user.email === normalizedEmail)
      
      if (existingAuthUser) {
        // User exists in auth but not in admin_users - we can link them
        // But for now, we'll return an error to avoid confusion
        return NextResponse.json(
          { error: 'User with this email already exists in authentication system' },
          { status: 409 }
        )
      }
    } else if (listUsersError) {
      // If listUsers fails, log it but continue - we'll try to create the user
      console.log('Auth user check error (will attempt to create user):', listUsersError)
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { 
          error: 'Failed to create user in authentication system', 
          details: authError.message || 'Unknown error',
          code: authError.status || 'AUTH_ERROR'
        },
        { status: 500 }
      )
    }

    if (!authUser?.user) {
      console.error('Auth user creation failed: no user returned')
      return NextResponse.json(
        { error: 'Failed to create user: no user data returned' },
        { status: 500 }
      )
    }

    // Create admin user record
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role,
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single()

    if (insertError) {
      // Rollback: delete auth user if admin_users insert fails
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
      } catch (deleteError) {
        console.error('Failed to rollback auth user:', deleteError)
      }
      console.error('Database insert user error:', insertError)
      console.error('Error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to create user record', 
          details: insertError.message,
          code: insertError.code || 'DB_ERROR',
          hint: insertError.hint || null
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newUser
    })

  } catch (error) {
    console.error('Create user API error:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
