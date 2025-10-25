// API route to save partial leads with email

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, estimatorData, currentStep } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this email already has a saved draft
    const { data: existing, error: checkError } = await supabase
      .from('partial_leads')
      .select('id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('Error checking for existing draft:', checkError)
    }

    if (existing) {
      // Update existing draft
      const { error: updateError } = await supabase
        .from('partial_leads')
        .update({
          estimator_data: estimatorData,
          current_step: currentStep,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating partial lead:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Progress updated',
        id: existing.id,
      })
    } else {
      // Create new draft
      const { data, error: insertError } = await supabase
        .from('partial_leads')
        .insert({
          email,
          estimator_data: estimatorData,
          current_step: currentStep,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving partial lead:', insertError)
        return NextResponse.json(
          { error: 'Failed to save progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Progress saved',
        id: data.id,
      })
    }
  } catch (error) {
    console.error('Error in partial-lead API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Retrieve saved progress by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('partial_leads')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No saved progress found' },
          { status: 404 }
        )
      }
      console.error('Error retrieving partial lead:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in GET partial-lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

