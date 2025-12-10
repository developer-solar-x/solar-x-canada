import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch a single battery by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('batteries')
      .select('*')
      .eq('battery_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Battery not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching battery:', error)
      return NextResponse.json(
        { error: 'Failed to fetch battery', details: error.message },
        { status: 500 }
      )
    }

    // Transform to BatterySpec format
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

    return NextResponse.json({ battery })
  } catch (error: any) {
    console.error('Unexpected error fetching battery:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update a battery
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Transform to database format
    const updateData: any = {}
    if (body.brand !== undefined) updateData.brand = body.brand
    if (body.model !== undefined) updateData.model = body.model
    if (body.nominalKwh !== undefined) updateData.nominal_kwh = body.nominalKwh
    if (body.usableKwh !== undefined) updateData.usable_kwh = body.usableKwh
    if (body.usablePercent !== undefined) updateData.usable_percent = body.usablePercent
    if (body.roundTripEfficiency !== undefined) updateData.round_trip_efficiency = body.roundTripEfficiency
    if (body.inverterKw !== undefined) updateData.inverter_kw = body.inverterKw
    if (body.price !== undefined) updateData.price = body.price
    if (body.warranty !== undefined) {
      if (body.warranty.years !== undefined) updateData.warranty_years = body.warranty.years
      if (body.warranty.cycles !== undefined) updateData.warranty_cycles = body.warranty.cycles
    }
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder

    const { data, error } = await supabase
      .from('batteries')
      .update(updateData)
      .eq('battery_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating battery:', error)
      return NextResponse.json(
        { error: 'Failed to update battery', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Battery not found' },
        { status: 404 }
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

    return NextResponse.json({ battery })
  } catch (error: any) {
    console.error('Unexpected error updating battery:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a battery (set is_active to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('batteries')
      .update({ is_active: false })
      .eq('battery_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting battery:', error)
      return NextResponse.json(
        { error: 'Failed to delete battery', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Battery not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Battery deleted successfully' })
  } catch (error: any) {
    console.error('Unexpected error deleting battery:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

