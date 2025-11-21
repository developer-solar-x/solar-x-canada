// Lead submission and management API

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      // Contact information
      fullName,
      email,
      phone,
      preferredContactTime,
      preferredContactMethod,
      comments,
      
      // Property details
      address,
      city,
      province,
      postalCode,
      coordinates,
      
      // Roof information
      roofPolygon,
      roofAreaSqft,
      roofType,
      roofAge,
      roofPitch,
      shadingLevel,
      appliances,
      
      // Energy information
      monthlyBill,
      annualUsageKwh,
      
      // Estimate data
      estimateData,
      systemSizeKw,
      estimatedCost,
      netCostAfterIncentives,
      annualSavings,
      paybackYears,
      annualProductionKwh,
      
      // Source tracking (not stored in v2 table)
      source = 'estimator'
    } = body

    // Validate required fields
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, phone' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Calculate peak shaving data before insert
    // Helper to safely extract combined values supporting both shapes:
    // allResults.combined.annual and allResults.combined.combined.annual
    const getCombinedAnnual = (plan: any) =>
      plan?.allResults?.combined?.combined?.annual
      ?? plan?.allResults?.combined?.annual
      ?? plan?.combined?.annual
      ?? null
    const getCombinedMonthly = (plan: any) =>
      plan?.allResults?.combined?.combined?.monthly
      ?? plan?.allResults?.combined?.monthly
      ?? plan?.combined?.monthly
      ?? null
    const getCombinedNetCost = (plan: any) =>
      plan?.allResults?.combined?.combined?.netCost
      ?? plan?.allResults?.combined?.netCost
      ?? plan?.combined?.netCost
      ?? null
    const getCombinedProjection = (plan: any) =>
      plan?.allResults?.combined?.combined?.projection
      ?? plan?.allResults?.combined?.projection
      ?? plan?.combined?.projection
      ?? plan?.projection
      ?? null

    const touCombinedAnnual = getCombinedAnnual(body.peakShaving?.tou) || 0
    const uloCombinedAnnual = getCombinedAnnual(body.peakShaving?.ulo) || 0
    // Do not persist a "best" rate plan; users don't select a plan
    const bestRatePlan: string | null = null
    
    // Save full peak_shaving object including all comparisons, distributions, results, and projections
    // This includes: tou/ulo distributions, results, projections, allResults (with combined data)
    const fullPeakShaving = body.peakShaving ? {
      ...body.peakShaving,
      // Do not write a derived ratePlan
      // Include battery comparisons if available (from detailed StepBatteryPeakShaving)
      comparisons: body.peakShaving?.comparisons || null,
      // Include monthly savings data if available (from detailed StepBatteryPeakShaving)
      monthlySavings: body.peakShaving?.monthlySavings || null,
    } : null
    
    // Determine best combined totals (for combined_totals JSONB)
    const bestCombinedPlan = uloCombinedAnnual > touCombinedAnnual ? body.peakShaving?.ulo : body.peakShaving?.tou
    const bestCombined = bestCombinedPlan?.allResults?.combined?.combined
      ?? bestCombinedPlan?.allResults?.combined
      ?? bestCombinedPlan?.combined

    // Insert lead into database (v3 schema)
    // Build insert object - conditionally include city (column may not exist in older databases)
    const insertData: any = {
      // Contact
      full_name: fullName,
      email,
      phone,
      preferred_contact_time: preferredContactTime,
      preferred_contact_method: preferredContactMethod,
      comments,
      
      // Property
      address,
      province: province || 'ON',
      postal_code: postalCode,
      coordinates,
      
      // Roof
      roof_polygon: roofPolygon,
      roof_area_sqft: roofAreaSqft,
      roof_type: roofType,
      roof_age: roofAge,
      roof_pitch: roofPitch,
      shading_level: shadingLevel,
      
      // Energy / usage
      monthly_bill: monthlyBill ?? 0,
      annual_usage_kwh: annualUsageKwh || body.energyUsage?.annualKwh || body.peakShaving?.tou?.result?.totalUsageKwh || body.peakShaving?.ulo?.result?.totalUsageKwh || 0,
      energy_usage: body.energyUsage || (annualUsageKwh ? { annualKwh: annualUsageKwh } : {}),
      
      // Selections / add-ons
      system_type: body.systemType || 'grid_tied',
      has_battery: Boolean((body.selectedAddOns || body.selected_add_ons || []).includes?.('battery') || body.hasBattery || body.selectedBattery || body.selectedBatteries),
      selected_add_ons: body.selectedAddOns || body.selected_add_ons || [],
      
      // Estimate
      solar_estimate: estimateData,
      system_size_kw: systemSizeKw,
      num_panels: body.numPanels || body.num_panels || estimateData?.system?.numPanels || 0,
      solar_total_cost: estimatedCost,
      solar_incentives: body.solarIncentives || estimateData?.costs?.incentives || 0,
      solar_net_cost: netCostAfterIncentives,
      solar_annual_savings: annualSavings,
      solar_monthly_savings: body.monthlySavings || estimateData?.savings?.monthlySavings || 0,
      production_annual_kwh: annualProductionKwh ?? 0,
      production_monthly_kwh: estimateData?.production?.monthlyKwh || [],
      roi_percent: estimateData?.savings?.roi || 0,

      // Peak shaving / rate plan - extract from nested structure
      rate_plan: '',
      peak_shaving: fullPeakShaving,
      // Extract TOU/ULO combined totals for easy querying
      // These are the "offset comparison" values shown in StepReview
      tou_annual_savings: touCombinedAnnual || 0,
      ulo_annual_savings: uloCombinedAnnual || 0,
      tou_net_cost: getCombinedNetCost(body.peakShaving?.tou) || 0,
      ulo_net_cost: getCombinedNetCost(body.peakShaving?.ulo) || 0,
      tou_payback_years: getCombinedProjection(body.peakShaving?.tou)?.paybackYears || 0,
      ulo_payback_years: getCombinedProjection(body.peakShaving?.ulo)?.paybackYears || 0,
      tou_profit_25y: getCombinedProjection(body.peakShaving?.tou)?.netProfit25Year || 0,
      ulo_profit_25y: getCombinedProjection(body.peakShaving?.ulo)?.netProfit25Year || 0,

      // Combined review totals - extract from best rate plan (ULO if better, otherwise TOU)
      // This represents the "offset comparison" values shown in StepReview
      combined_totals: body.combined || (bestCombined ? {
        total_cost: estimatedCost,
        net_cost: bestCombined?.netCost || 0,
        monthly_savings: bestCombined?.monthly || 0,
        annual_savings: bestCombined?.annual || 0,
        payback_years: (getCombinedProjection(bestCombinedPlan))?.paybackYears || 0,
        profit_25y: (getCombinedProjection(bestCombinedPlan))?.netProfit25Year || 0,
        // Include both TOU and ULO for comparison
        tou: {
          annual: touCombinedAnnual,
          monthly: getCombinedMonthly(body.peakShaving?.tou),
          net_cost: getCombinedNetCost(body.peakShaving?.tou),
          payback_years: getCombinedProjection(body.peakShaving?.tou)?.paybackYears ?? null,
          profit_25y: getCombinedProjection(body.peakShaving?.tou)?.netProfit25Year ?? null,
        },
        ulo: {
          annual: uloCombinedAnnual,
          monthly: getCombinedMonthly(body.peakShaving?.ulo),
          net_cost: getCombinedNetCost(body.peakShaving?.ulo),
          payback_years: getCombinedProjection(body.peakShaving?.ulo)?.paybackYears ?? null,
          profit_25y: getCombinedProjection(body.peakShaving?.ulo)?.netProfit25Year ?? null,
        },
      } : null),
      combined_total_cost: body.combined?.total_cost || estimatedCost || 0,
      combined_net_cost: body.combined?.net_cost || body.peakShaving?.ulo?.allResults?.combined?.netCost || body.peakShaving?.tou?.allResults?.combined?.netCost || body.peakShaving?.ulo?.combined?.netCost || body.peakShaving?.tou?.combined?.netCost || 0,
      combined_monthly_savings: body.combined?.monthly_savings || body.peakShaving?.ulo?.allResults?.combined?.monthly || body.peakShaving?.tou?.allResults?.combined?.monthly || body.peakShaving?.ulo?.combined?.monthly || body.peakShaving?.tou?.combined?.monthly || 0,
      combined_annual_savings: body.combined?.annual_savings || body.peakShaving?.ulo?.allResults?.combined?.annual || body.peakShaving?.tou?.allResults?.combined?.annual || body.peakShaving?.ulo?.combined?.annual || body.peakShaving?.tou?.combined?.annual || 0,
      combined_payback_years: body.combined?.payback_years || body.peakShaving?.ulo?.allResults?.combined?.combined?.projection?.paybackYears || body.peakShaving?.tou?.allResults?.combined?.combined?.projection?.paybackYears || body.peakShaving?.ulo?.allResults?.combined?.projection?.paybackYears || body.peakShaving?.tou?.allResults?.combined?.projection?.paybackYears || body.peakShaving?.ulo?.combined?.projection?.paybackYears || body.peakShaving?.tou?.combined?.projection?.paybackYears || 0,
      combined_profit_25y: body.combined?.profit_25y || body.peakShaving?.ulo?.allResults?.combined?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.allResults?.combined?.combined?.projection?.netProfit25Year || body.peakShaving?.ulo?.allResults?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.allResults?.combined?.projection?.netProfit25Year || body.peakShaving?.ulo?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.combined?.projection?.netProfit25Year || 0,

      // Financing / environmental (optional)
      financing_preference: body.financingOption || body.financingPreference || body.financing_preference || '',
      env_co2_offset_tpy: estimateData?.environmental?.co2OffsetTonsPerYear || 0,
      env_trees_equivalent: estimateData?.environmental?.treesEquivalent || 0,
      env_cars_off_road: estimateData?.environmental?.carsOffRoadEquivalent || 0,
      
      // Additional metadata
      estimator_mode: body.estimatorMode || body.estimator_mode || '',
      program_type: body.programType || body.program_type || '',
      roof_sections: body.roofSections || [],
      map_snapshot_url: body.mapSnapshot || body.mapSnapshotUrl || '',
      photo_urls: body.photos?.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean) || body.photoUrls || [],
      photo_summary: body.photoSummary || body.photo_summary || {},
      selected_batteries: body.selectedBatteries || (body.selectedBattery ? [body.selectedBattery] : []),
      battery_price: body.batteryDetails?.battery?.price || 0,
      battery_rebate: (body.batteryDetails?.battery?.price && body.batteryDetails?.multiYearProjection?.netCost != null)
        ? (body.batteryDetails.battery.price - body.batteryDetails.multiYearProjection.netCost)
        : 0,
      battery_net_cost: body.batteryDetails?.multiYearProjection?.netCost || 0,
      battery_annual_savings: body.batteryDetails?.firstYearAnalysis?.totalSavings || body.peakShaving?.tou?.result?.annualSavings || body.peakShaving?.ulo?.result?.annualSavings || 0,
      battery_monthly_savings: body.batteryDetails?.firstYearAnalysis?.totalSavings ? Math.round(body.batteryDetails.firstYearAnalysis.totalSavings / 12) : 0,
      
      // Full snapshot backup
      estimator_data: body, // Keep full payload for reference
      
      // Status
      status: 'new',
    }
    
    // Only include city if it's provided (column exists in schema but may not be in database yet)
    // This prevents errors if the column hasn't been added to the database
    if (city !== undefined && city !== null && city !== '') {
      insertData.city = city
    }
    
    // Only include lead_type if provided (column may not exist in database yet)
    // This prevents errors if the column hasn't been added to the database
    const leadType = body.leadType || body.lead_type || 'residential'
    if (leadType) {
      insertData.lead_type = leadType
    }
    
    // Try old table first (leads_v3), then new schema (homeowner_leads)
    let lead: any = null
    let insertError: any = null
    
    // Try leads_v3 first (existing schema)
    const { data: oldLead, error: oldError } = await supabase
      .from('leads_v3')
      .insert(insertData)
      .select()
      .single()
    
    if (oldError && oldError.code === 'PGRST205') {
      // Old table doesn't exist, try new schema table
      // Map fields to new schema format
      const newSchemaData: any = {
        // Contact - split full_name into first_name and last_name
        first_name: fullName?.split(' ')[0] || fullName || '',
        last_name: fullName?.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        preferred_contact_method: preferredContactMethod || 'either',
        
        // Property
        street_address: address,
        city: city || '',
        postal_code: postalCode || '',
        province: province || 'ON',
        coordinates,
        
        // Calculator data
        calculator_inputs: {
          ...body,
          fullName,
          address,
          city,
          province,
          postalCode,
        },
        calculator_outputs: estimateData,
        system_size_kw: systemSizeKw,
        payback_period_years: paybackYears,
        annual_savings: annualSavings,
        monthly_savings: body.monthlySavings || estimateData?.savings?.monthlySavings || 0,
        lifetime_savings: (annualSavings || 0) * 25,
        net_investment: netCostAfterIncentives,
        total_cost: estimatedCost,
        incentives_amount: body.solarIncentives || estimateData?.costs?.incentives || 0,
        has_battery: Boolean((body.selectedAddOns || []).includes('battery') || body.hasBattery),
        battery_impact: body.batteryDetails ? {
          annualSavings: body.batteryDetails?.firstYearAnalysis?.totalSavings || 0,
          monthlySavings: body.batteryDetails?.firstYearAnalysis?.totalSavings ? Math.round(body.batteryDetails.firstYearAnalysis.totalSavings / 12) : 0,
          batterySizeKwh: body.batteryDetails?.battery?.nominalKwh || 0,
        } : null,
        
        // Status
        status: 'new',
        source: source || 'calculator',
      }
      
      const { data: newLead, error: newError } = await supabase
        .from('homeowner_leads')
        .insert(newSchemaData)
        .select()
        .single()
      
      lead = newLead
      insertError = newError
    } else {
      lead = oldLead
      insertError = oldError
    }

    if (insertError) {
      console.error('Database insert error:', insertError)
      // If both tables don't exist, return helpful error
      if (insertError.code === 'PGRST205') {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'Please run the database schema migration. Tables leads_v3 or homeowner_leads must exist.',
            hint: 'Run supabase/schema_frd.sql in your Supabase SQL Editor'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to save lead', details: insertError.message },
        { status: 500 }
      )
    }

    // Log activity - try different table names
    const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
    for (const tableName of activityTableNames) {
      const { error } = await supabase
        .from(tableName)
        .insert({
          lead_id: lead.id,
          activity_type: 'status_change',
          activity_data: { status: 'new', source },
        })
      
      // If successful or table doesn't exist, break
      if (!error || (error.code === 'PGRST205' && activityTableNames.indexOf(tableName) === activityTableNames.length - 1)) {
        break
      }
      // If table doesn't exist, try next table
      if (error && error.code === 'PGRST205') {
        continue
      }
      // Log other errors but don't fail the lead creation
      if (error) {
        console.warn(`Failed to log activity to ${tableName}:`, error)
      }
    }

    // Queue HubSpot sync (async, don't wait for response)
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(err => console.error('HubSpot sync queue error:', err))
    }

    // Send estimate email to customer (async, don't wait for response)
    if (email && estimateData) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leads/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          address,
          estimate: estimateData,
          peakShaving: body.peakShaving || null,
          batteryDetails: body.batteryDetails || null,
          leadId: lead.id,
        }),
      }).catch(err => console.error('Email send error:', err))
    }

    // Return success with lead ID
    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: 'Your estimate has been saved successfully!'
      }
    })

  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching leads (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Build query - try new schema first, fallback to old
    let query = supabase
      .from('homeowner_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // If table doesn't exist, try old table
    const { error: tableCheckError } = await query.limit(0)
    if (tableCheckError && tableCheckError.code === 'PGRST205') {
      query = supabase
        .from('leads_v3')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter if provided (search in name, email, or address)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Execute query
    const { data: leads, error, count } = await query

    if (error) {
      throw error
    }

    // Fetch activities for all leads if we have any
    let leadsWithActivities = leads || []
    if (leads && leads.length > 0) {
      const leadIds = leads.map((l: any) => l.id)
      
      // Try different activity table names in order of preference
      const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
      let activities: any[] = []
      let activitiesError: any = null
      
      for (const tableName of activityTableNames) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          activities = data
          activitiesError = null
          break
        }
        
        // If table doesn't exist (PGRST205), try next table
        if (error && error.code === 'PGRST205') {
          activitiesError = error
          continue
        }
        
        // Other errors should be logged but not break the flow
        if (error) {
          console.warn(`Error fetching activities from ${tableName}:`, error)
          activitiesError = error
        }
      }

      if (!activitiesError && activities && activities.length > 0) {
        // Group activities by lead_id
        const activitiesByLeadId = activities.reduce((acc: any, activity: any) => {
          if (!acc[activity.lead_id]) {
            acc[activity.lead_id] = []
          }
          acc[activity.lead_id].push(activity)
          return acc
        }, {})

        // Attach activities to each lead
        leadsWithActivities = leads.map((lead: any) => ({
          ...lead,
          activities: activitiesByLeadId[lead.id] || []
        }))
      } else {
        // If no activities found or table doesn't exist, just attach empty arrays
        leadsWithActivities = leads.map((lead: any) => ({
          ...lead,
          activities: []
        }))
      }
    }

    // Return paginated results
    return NextResponse.json({
      success: true,
      data: {
        leads: leadsWithActivities,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }
      }
    })

  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

