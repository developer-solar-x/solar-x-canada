// Feedback submission and management API

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.')
  }

  return new Resend(apiKey)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, description, province, email } = body

    // Validate required fields
    if (!type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type and description are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['product', 'improvement', 'bug'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: product, improvement, bug' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        type,
        description,
        province: province || null,
        email: email || null,
        status: 'new',
        reviewed: false,
        full_feedback_data: body, // Store full submission for flexibility
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting feedback:', error)
      return NextResponse.json(
        { error: 'Failed to submit feedback', details: error.message },
        { status: 500 }
      )
    }

    // Send thank-you email if user provided an email and Resend is configured
    if (email) {
      try {
        const resend = createResendClient()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solarcalculatorcanada.org'

        await resend.emails.send({
          from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
          to: email,
          subject: 'Thanks for your feedback on Solar Calculator Canada',
          text: `Thanks for sharing feedback with Solar Calculator Canada.\n\nType: ${type}\n\nWe read every submission and use it to improve the calculator for homeowners and installers across Canada.\n\nIf you have more details to share, you can simply reply to this email.\n\n${appUrl}`,
          html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                Thanks for your feedback
              </h1>
              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 12px;">
                We really appreciate you taking the time to share feedback about Solar Calculator Canada.
              </p>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                <strong>Feedback type:</strong> ${type}
              </p>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                Our team reviews every submission and uses it to make the calculator more accurate and easier to use for homeowners and installers across Canada.
              </p>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
                If you have more details to share, you can simply reply to this email.
              </p>
              <p style="font-size: 13px; color: #94a3b8;">
                — Solar Calculator Canada
              </p>
              <p style="font-size: 12px; color: #cbd5f5; margin-top: 16px;">
                <a href="${appUrl}" style="color: #2563eb; text-decoration: none;">Visit Solar Calculator Canada</a>
              </p>
            </div>
          `,
        })
      } catch (sendError) {
        // Log but don't fail the API if the thank-you email cannot be sent
        console.error('Error sending feedback confirmation email:', sendError)
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        id: data.id,
        message: 'Feedback submitted successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const province = searchParams.get('province')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Build query
    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (province && province !== 'all') {
      query = query.eq('province', province)
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      // Add 23:59:59 to end date to include the entire day
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endDateTime.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback', details: error.message },
        { status: 500 }
      )
    }

    // Map database fields to frontend format
    const mappedFeedback = data.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      description: entry.description,
      province: entry.province,
      email: entry.email,
      status: entry.status,
      reviewed: entry.reviewed,
      reviewedBy: entry.reviewed_by,
      reviewedAt: entry.reviewed_at,
      reviewNotes: entry.review_notes,
      submittedAt: entry.created_at,
      created_at: entry.created_at,
    }))

    return NextResponse.json({ feedback: mappedFeedback }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, reviewNotes, reviewedBy } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      if (!['new', 'reviewed', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
      updateData.reviewed = status !== 'new'
      
      if (status !== 'new' && !updateData.reviewed_at) {
        updateData.reviewed_at = new Date().toISOString()
      }
    }

    if (reviewNotes !== undefined) {
      updateData.review_notes = reviewNotes
    }

    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy
    }

    // Update feedback
    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating feedback:', error)
      return NextResponse.json(
        { error: 'Failed to update feedback', details: error.message },
        { status: 500 }
      )
    }

    // Map response
    const mappedFeedback = {
      id: data.id,
      type: data.type,
      description: data.description,
      province: data.province,
      email: data.email,
      status: data.status,
      reviewed: data.reviewed,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at,
      reviewNotes: data.review_notes,
      submittedAt: data.created_at,
      created_at: data.created_at,
    }

    return NextResponse.json(
      { success: true, feedback: mappedFeedback },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

