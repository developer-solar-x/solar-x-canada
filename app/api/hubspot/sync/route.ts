// HubSpot sync API endpoint

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { syncLeadToHubSpot } from '@/lib/hubspot'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId' },
        { status: 400 }
      )
    }

    // Get lead from database
    const supabase = getSupabaseAdmin()
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Sync to HubSpot
    const syncResult = await syncLeadToHubSpot(lead)

    // Update lead with HubSpot IDs
    await supabase
      .from('leads')
      .update({
        hubspot_contact_id: syncResult.contactId,
        hubspot_deal_id: syncResult.dealId,
        hubspot_synced: true,
        hubspot_synced_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: 'hubspot_sync',
        activity_data: syncResult,
      })

    return NextResponse.json({
      success: true,
      data: syncResult
    })

  } catch (error) {
    console.error('HubSpot sync API error:', error)
    return NextResponse.json(
      { error: 'HubSpot sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

