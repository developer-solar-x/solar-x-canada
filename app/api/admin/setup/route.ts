// One-time setup endpoint to create the first superadmin user
// This endpoint should be protected or removed after initial setup

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    // Default values for first superadmin
    const userEmail = email || 'developer@solar-x.ca'
    const userPassword = password || 'SolarX2025'
    const userName = full_name || 'Developer'

    const supabase = getSupabaseAdmin()

    // Check if user already exists in admin_users table first
    const { data: existingAdminUser } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', userEmail)
      .single()

    if (existingAdminUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          email: userEmail,
          id: existingAdminUser.id,
        }
      })
    }

    // Check if user exists in auth by listing users and filtering by email
    // Note: getUserByEmail doesn't exist in Supabase Auth Admin API, so we use listUsers
    const { data: listUsersData, error: listUsersError } = await supabase.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
      // Continue with user creation attempt - if user exists, createUser will fail
    }
    
    // Find user by email - users array contains User objects with email property
    const existingAuthUser = listUsersData?.users?.find((user: any) => user.email === userEmail)

    if (existingAuthUser) {
      // User exists in auth but not in admin_users - create admin_users record
      const { data: newAdminUser, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: existingAuthUser.id,
          email: userEmail,
          full_name: userName,
          role: 'superadmin',
          is_active: true,
        })
        .select('id, email, full_name, role, is_active, created_at')
        .single()

      if (insertError) {
        console.error('Database insert user error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create admin user record', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin user record created for existing auth user',
        data: {
          email: userEmail,
          role: 'superadmin',
          ...newAdminUser
        }
      })
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    })

    if (authError) {
      // Check if error is because user already exists
      if (authError.message?.toLowerCase().includes('already registered') || 
          authError.message?.toLowerCase().includes('user already exists') ||
          authError.message?.toLowerCase().includes('already exists')) {
        // User exists in auth but we didn't find them in listUsers (might be pagination issue)
        // Try to get the user ID from the error or list users again with pagination
        console.log('User already exists in auth, attempting to create admin_users record')
        
        // If we have the existing auth user from earlier check, use that
        if (existingAuthUser) {
          // This case is already handled above, but if we reach here, try again
          const { data: retryAdminUser, error: retryError } = await supabase
            .from('admin_users')
            .insert({
              id: existingAuthUser.id,
              email: userEmail,
              full_name: userName,
              role: 'superadmin',
              is_active: true,
            })
            .select('id, email, full_name, role, is_active, created_at')
            .single()

          if (!retryError && retryAdminUser) {
            return NextResponse.json({
              success: true,
              message: 'Admin user record created for existing auth user',
              data: {
                email: userEmail,
                role: 'superadmin',
                ...retryAdminUser
              }
            })
          }
        }
        
        return NextResponse.json(
          { error: 'User already exists in auth system', details: authError.message },
          { status: 409 }
        )
      }
      
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError.message || 'Unknown error' },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user', details: 'No user returned from creation' },
        { status: 500 }
      )
    }

    // Create admin user record
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: userEmail,
        full_name: userName,
        role: 'superadmin',
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single()

    if (insertError) {
      // Rollback: delete auth user if admin_users insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      console.error('Database insert user error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create admin user', details: insertError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Superadmin user created: ${userEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Superadmin user created successfully',
      data: {
        email: userEmail,
        password: userPassword,
        role: 'superadmin',
        ...newUser
      }
    })

  } catch (error) {
    console.error('Setup API error:', error)
    return NextResponse.json(
      { error: 'Failed to create superadmin', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

