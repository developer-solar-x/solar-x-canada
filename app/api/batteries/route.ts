import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch all batteries
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = supabase
      .from('batteries')
      .select('*')
      .order('display_order', { ascending: true })
      .order('brand', { ascending: true })
      .order('model', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching batteries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch batteries', details: error.message },
        { status: 500 }
      )
    }

    // Transform database format to BatterySpec format
    const batteries = data.map((battery) => ({
      id: battery.battery_id,
      brand: battery.brand,
      model: battery.model,
      nominalKwh: parseFloat(battery.nominal_kwh),
      usableKwh: parseFloat(battery.usable_kwh),
      usablePercent: parseFloat(battery.usable_percent),
      roundTripEfficiency: parseFloat(battery.round_trip_efficiency),
      inverterKw: parseFloat(battery.inverter_kw),
      price: parseFloat(battery.price),
      warranty: {
        years: battery.warranty_years,
        cycles: battery.warranty_cycles,
      },
      description: battery.description || undefined,
      isActive: battery.is_active,
      displayOrder: battery.display_order,
      createdAt: battery.created_at,
      updatedAt: battery.updated_at,
    }))

    return NextResponse.json({ batteries })
  } catch (error: any) {
    console.error('Unexpected error fetching batteries:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new battery
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['battery_id', 'brand', 'model', 'nominalKwh', 'usableKwh', 'usablePercent', 'roundTripEfficiency', 'inverterKw', 'price', 'warranty']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Transform to database format
    const batteryData = {
      battery_id: body.battery_id,
      brand: body.brand,
      model: body.model,
      nominal_kwh: body.nominalKwh,
      usable_kwh: body.usableKwh,
      usable_percent: body.usablePercent,
      round_trip_efficiency: body.roundTripEfficiency,
      inverter_kw: body.inverterKw,
      price: body.price,
      warranty_years: body.warranty.years,
      warranty_cycles: body.warranty.cycles,
      description: body.description || null,
      is_active: body.isActive !== undefined ? body.isActive : true,
      display_order: body.displayOrder || 0,
    }

    const { data, error } = await supabase
      .from('batteries')
      .insert([batteryData])
      .select()
      .single()

    if (error) {
      console.error('Error creating battery:', error)
      return NextResponse.json(
        { error: 'Failed to create battery', details: error.message },
        { status: 500 }
      )
    }

    // Transform back to BatterySpec format
    const battery = {
      id: data.battery_id,
      brand: data.brand,
      model: data.model,
      nominalKwh: parseFloat(data.nominal_kwh),
      usableKwh: parseFloat(data.usable_kwh),
      usablePercent: parseFloat(data.usable_percent),
      roundTripEfficiency: parseFloat(data.round_trip_efficiency),
      inverterKw: parseFloat(data.inverter_kw),
      price: parseFloat(data.price),
      warranty: {
        years: data.warranty_years,
        cycles: data.warranty_cycles,
      },
      description: data.description || undefined,
      isActive: data.is_active,
      displayOrder: data.display_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ battery }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error creating battery:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

