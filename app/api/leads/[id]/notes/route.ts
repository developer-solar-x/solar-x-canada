// Add note to a lead API

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST: Add a note to a lead
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { note, created_by } = body

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      )
    }

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

    // Insert note
    // Try different table names in order of preference
    const tableNames = ['lead_notes_v3', 'lead_notes_v2', 'lead_notes']
    let newNote: any = null
    let insertError: any = null
    
    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          lead_id: id,
          note: note.trim(),
          created_by: created_by || 'admin',
        })
        .select()
        .single()
      
      if (!error && data) {
        newNote = data
        insertError = null
        break
      }
      
      // If table doesn't exist (PGRST205), try next table
      if (error && error.code === 'PGRST205') {
        insertError = error
        continue
      }
      
      // Other errors should be thrown
      if (error) {
        throw error
      }
    }
    
    // If all tables failed, return helpful error
    if (!newNote && insertError && insertError.code === 'PGRST205') {
      return NextResponse.json(
        { 
          error: 'Notes table not found. Please create lead_notes_v3, lead_notes_v2, or lead_notes table in your database.',
          details: 'The notes feature requires a notes table. Please run the schema migration to create it.'
        },
        { status: 500 }
      )
    }
    
    if (insertError) {
      throw insertError
    }

    // Log activity - try different table names
    const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
    for (const tableName of activityTableNames) {
      const { error } = await supabase
        .from(tableName)
        .insert({
          lead_id: id,
          activity_type: 'note_added',
          activity_data: {
            note_id: newNote.id,
            note_preview: note.trim().substring(0, 100), // First 100 chars as preview
          },
          user_id: created_by || 'admin',
        })
      
      // If successful or table doesn't exist, break
      if (!error || (error.code === 'PGRST205' && activityTableNames.indexOf(tableName) === activityTableNames.length - 1)) {
        break
      }
      // If table doesn't exist, try next table
      if (error && error.code === 'PGRST205') {
        continue
      }
      // Log other errors but don't fail the note creation
      if (error) {
        console.warn(`Failed to log activity to ${tableName}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: newNote
    })

  } catch (error) {
    console.error('Add note error:', error)
    return NextResponse.json(
      { error: 'Failed to add note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET: Fetch notes for a lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = getSupabaseAdmin()

    // Fetch notes for this lead
    // Try different table names in order of preference
    const tableNames = ['lead_notes_v3', 'lead_notes_v2', 'lead_notes']
    let notes: any[] = []
    let lastError: any = null
    
    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        notes = data
        break
      }
      
      // If table doesn't exist (PGRST205), try next table
      if (error && error.code === 'PGRST205') {
        lastError = error
        continue
      }
      
      // Other errors should be thrown
      if (error) {
        throw error
      }
    }
    
    // If all tables failed and last error was table not found, return empty array
    if (notes.length === 0 && lastError && lastError.code === 'PGRST205') {
      // Table doesn't exist yet - return empty array (notes feature not set up)
      return NextResponse.json({
        success: true,
        data: {
          notes: []
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        notes: notes || []
      }
    })

  } catch (error) {
    console.error('Fetch notes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

