// Upload API route for HubSpot sales KPI data processing
// Handles file upload, parsing, and KPI calculation

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseHubSpotFile } from '@/lib/hubspot-parser';
import { calculateWeeklyKPIs, calculateWeeklyRollup } from '@/lib/kpi-calculator';

// Session cookie name for admin authentication
const SESSION_COOKIE_NAME = 'solarx_admin_session';

// Check if user is authenticated as admin
async function checkAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie) {
    return { authenticated: false, user: null };
  }

  const supabase = getSupabaseAdmin();
  
  // Try to get user info from the admin_user cookie (set during login)
  const userCookie = cookieStore.get('solarx_admin_user');
  
  if (userCookie) {
    try {
      const userInfo = JSON.parse(userCookie.value);
      // Verify user exists in admin_users table and is active
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role, is_active')
        .eq('id', userInfo.id)
        .single();

      if (!error && adminUser && adminUser.is_active) {
        return { authenticated: true, user: adminUser };
      }
    } catch (e) {
      // Invalid user cookie, continue to check session
    }
  }

  // If we have a session cookie, trust it (it's httpOnly and set by our server)
  // The middleware already verified the route is protected
  if (sessionCookie) {
    return { authenticated: true, user: { id: 'verified' } };
  }

  return { authenticated: false, user: null };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { authenticated, user } = await checkAuth();
    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - only CSV and XLSX allowed
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Invalid file type. Upload CSV or XLSX only.' }, { status: 400 });
    }

    // Convert file to buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hubspot-uploads')
      .upload(fileName, fileBuffer);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Get actual user ID from cookie or use verified placeholder
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('solarx_admin_user');
    let userId = user?.id;
    
    if (userCookie) {
      try {
        const userInfo = JSON.parse(userCookie.value);
        userId = userInfo.id;
      } catch (e) {
        // Use verified placeholder if cookie parsing fails
      }
    }

    // Create upload record in database
    const { data: uploadRecord, error: uploadRecordError } = await supabase
      .from('uploads')
      .insert({
        filename: file.name,
        file_url: uploadData.path,
        uploaded_by: userId === 'verified' ? null : userId, // Use null if we only have verified placeholder
        processing_status: 'processing'
      })
      .select()
      .single();

    if (uploadRecordError) {
      console.error('Upload record error:', uploadRecordError);
      return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
    }

    // Parse file and process leads
    const processedLeads = parseHubSpotFile(fileBuffer);

    if (processedLeads.length === 0) {
      // Update upload status to failed
      await supabase.from('uploads').update({ 
        processing_status: 'failed',
        error_message: 'No valid leads found'
      }).eq('id', uploadRecord.id);
      
      return NextResponse.json({ error: 'No valid leads found in file' }, { status: 400 });
    }

    // Insert leads into database
    const leadsToInsert = processedLeads.map(lead => ({
      ...lead,
      upload_id: uploadRecord.id
    }));

    const { error: leadsError } = await supabase
      .from('sales_kpi_leads')
      .insert(leadsToInsert);

    if (leadsError) {
      console.error('Leads insert error:', leadsError);
      return NextResponse.json({ error: 'Failed to save leads' }, { status: 500 });
    }

    // Calculate KPIs
    const weeklyKPIs = calculateWeeklyKPIs(processedLeads);
    const weeklyRollup = calculateWeeklyRollup(processedLeads);

    // Insert KPIs into database
    const kpisToInsert = weeklyKPIs.map(kpi => ({
      ...kpi,
      upload_id: uploadRecord.id
    }));

    await supabase.from('weekly_kpis').insert(kpisToInsert);

    // Insert rollup KPIs
    const rollupsToInsert = weeklyRollup.map(rollup => ({
      ...rollup,
      upload_id: uploadRecord.id
    }));

    await supabase.from('weekly_rollup').insert(rollupsToInsert);

    // Update upload status to completed
    await supabase.from('uploads').update({ 
      processing_status: 'completed',
      row_count: processedLeads.length
    }).eq('id', uploadRecord.id);

    return NextResponse.json({
      success: true,
      upload_id: uploadRecord.id,
      leads_processed: processedLeads.length,
      weeks_processed: new Set(processedLeads.map(l => l.week_start)).size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

