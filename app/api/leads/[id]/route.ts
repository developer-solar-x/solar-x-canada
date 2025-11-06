// Individual lead operations API (PATCH, DELETE)

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH: Update lead status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Missing status field' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['new', 'contacted', 'qualified', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get current lead to check old status
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads_v3')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update lead status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads_v3')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log activity if status changed - try different table names
    if (currentLead.status !== status) {
      const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
      for (const tableName of activityTableNames) {
        const { error } = await supabase
          .from(tableName)
          .insert({
            lead_id: id,
            activity_type: 'status_change',
            activity_data: {
              old_status: currentLead.status,
              new_status: status,
            },
          })
        
        // If successful or table doesn't exist, break
        if (!error || (error.code === 'PGRST205' && activityTableNames.indexOf(tableName) === activityTableNames.length - 1)) {
          break
        }
        // If table doesn't exist, try next table
        if (error && error.code === 'PGRST205') {
          continue
        }
        // Log other errors but don't fail the status update
        if (error) {
          console.warn(`Failed to log activity to ${tableName}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLead
    })

  } catch (error) {
    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = getSupabaseAdmin()

    // Check if lead exists
    const { data: lead, error: fetchError } = await supabase
      .from('leads_v3')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Delete lead (activities and notes will be cascade deleted due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('leads_v3')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    })

  } catch (error) {
    console.error('Lead delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

