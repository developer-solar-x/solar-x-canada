// User management API endpoint - PATCH update user, DELETE user

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH: Update a user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { full_name, role, is_active, password } = body

    const supabase = getSupabaseAdmin()

    // Build update object
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name.trim()
    if (role !== undefined) {
      if (!['admin', 'superadmin', 'sales'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, superadmin, or sales' },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (is_active !== undefined) updateData.is_active = is_active

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password: password,
      })

      if (passwordError) {
        console.error('Password update error:', passwordError)
        return NextResponse.json(
          { error: 'Failed to update password', details: passwordError.message },
          { status: 500 }
        )
      }
    }

    // Update admin user record
    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, is_active, updated_at')
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error) {
    console.error('Update user API error:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete from Supabase Auth (this will cascade delete from admin_users due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Auth delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

