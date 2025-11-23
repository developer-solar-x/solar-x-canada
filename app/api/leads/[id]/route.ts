// Individual lead operations API (GET, PATCH, DELETE)

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET: Fetch a lead by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // First, try to fetch from hrs_residential_leads table
    const { data: hrsLead, error: hrsError } = await supabase
      .from('hrs_residential_leads')
      .select('*')
      .eq('id', id)
      .single()

    // If table doesn't exist (PGRST205) or lead found, handle accordingly
    if (hrsError && hrsError.code !== 'PGRST116') {
      // PGRST116 = not found (which is fine, try other table)
      // Other errors might mean table doesn't exist, continue to try old table
      console.warn('HRS leads table error (may not exist yet):', hrsError.code)
    }

    if (hrsLead && !hrsError) {
      // Parse full_data_json if it's a string
      let fullDataJson = hrsLead.full_data_json
      if (typeof fullDataJson === 'string') {
        try {
          fullDataJson = JSON.parse(fullDataJson)
        } catch (e) {
          console.warn('Failed to parse full_data_json:', e)
          fullDataJson = null
        }
      }
      
      // Transform HRS residential lead to match expected format
      return NextResponse.json({
        success: true,
        lead: {
          id: hrsLead.id,
          full_name: hrsLead.full_name,
          email: hrsLead.email,
          phone: hrsLead.phone,
          address: hrsLead.address,
          city: hrsLead.city,
          province: hrsLead.province,
          coordinates: hrsLead.coordinates,
          // Map HRS residential fields to expected format
          system_size_kw: hrsLead.system_size_kw,
          annual_production_kwh: hrsLead.production_annual_kwh,
          net_cost_after_incentives: hrsLead.net_cost,
          annual_savings: hrsLead.tou_annual_savings || hrsLead.ulo_annual_savings || 0,
          payback_years: hrsLead.tou_payback_period || hrsLead.ulo_payback_period || 0,
          // Use full_data_json as estimate_data for backward compatibility
          estimate_data: fullDataJson || {
            system: {
              sizeKw: hrsLead.system_size_kw,
              numPanels: hrsLead.num_panels,
            },
            production: {
              annualKwh: hrsLead.production_annual_kwh,
              monthlyKwh: hrsLead.production_monthly_kwh || [],
              dailyAverageKwh: hrsLead.production_daily_average_kwh,
            },
            costs: {
              systemCost: hrsLead.system_cost,
              batteryCost: hrsLead.battery_cost,
              solarRebate: hrsLead.solar_rebate,
              batteryRebate: hrsLead.battery_rebate,
              netCost: hrsLead.net_cost,
            },
            environmental: {
              co2OffsetTonsPerYear: hrsLead.co2_offset_tons_per_year,
              treesEquivalent: hrsLead.trees_equivalent,
              carsOffRoadEquivalent: hrsLead.cars_off_road_equivalent,
            },
          },
          // Include full_data_json (parsed) for results page
          full_data_json: fullDataJson,
          // Include HRS-specific data (full record)
          hrs_residential_data: hrsLead,
        },
      })
    }

    // If not found in hrs_residential_leads, try old leads_v3 table
    const { data: oldLead, error: oldError } = await supabase
      .from('leads_v3')
      .select('*')
      .eq('id', id)
      .single()

    if (oldError || !oldLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: oldLead,
    })

  } catch (error) {
    console.error('Lead fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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

