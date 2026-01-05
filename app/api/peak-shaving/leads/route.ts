import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch all peak shaving leads with access logs
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''

    // Fetch all leads
    let query = supabase
      .from('peak_shaving_leads')
      .select(`
        *,
        peak_shaving_access_logs!fk_lead (
          id,
          accessed_at,
          ip_address,
          user_agent
        )
      `)
      .order('created_at', { ascending: false })

    // Apply search filter if provided
    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching peak shaving leads:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch leads', 
          details: error.message,
          hint: error.hint || 'Check if the peak_shaving_leads table exists and RLS policies allow access'
        },
        { status: 500 }
      )
    }

    // Transform the data to include access log summary
    const transformedLeads = leads?.map((lead: any) => ({
      id: lead.id,
      email: lead.email,
      emailVerified: lead.email_verified,
      usageCount: lead.usage_count,
      isSolarXEmail: lead.is_solar_x_email,
      lastUsedAt: lead.last_used_at,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      accessLogs: lead.peak_shaving_access_logs || [],
      totalAccesses: lead.peak_shaving_access_logs?.length || 0,
    })) || []

    return NextResponse.json({ leads: transformedLeads })
  } catch (error: any) {
    console.error('Unexpected error fetching peak shaving leads:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

