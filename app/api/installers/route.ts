// API route for installer applications
// Handles file uploads to Supabase Storage and saves application data

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('⚠️ Resend API key not configured. Email sending will be skipped.')
    return null
  }

  return new Resend(apiKey)
}

// Helper function to upload file to Supabase Storage
async function uploadFileToStorage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  file: File | Blob,
  fileName: string,
  bucket: string = 'photos',
  folder: string = 'installers'
): Promise<string | null> {
  try {
    // Convert File/Blob to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'pdf'
    const uniqueFileName = `${timestamp}-${sanitizedFileName}.${extension}`
    const filePath = `${folder}/${uniqueFileName}`
    
    // Determine content type
    let contentType = 'application/pdf'
    if (file.type) {
      contentType = file.type
    } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (fileName.toLowerCase().endsWith('.png')) {
      contentType = 'image/png'
    }
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: false
      })
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b0934b8b-2dac-4a1b-9a2e-4d6c5b32b657',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:57',message:'Storage upload error',data:{errorMessage:error.message,errorCode:error.statusCode,bucket,filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error uploading file to storage:', {
        error,
        bucket,
        filePath,
        contentType,
      })
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadFileToStorage:', {
      error,
      bucket,
      fileName,
      folder,
    })
    return null
  }
}

// Helper function to upload base64 data to Supabase Storage
async function uploadBase64ToStorage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  base64Data: string,
  fileName: string,
  bucket: string = 'photos',
  folder: string = 'installers'
): Promise<string | null> {
  try {
    // Check if it's a data URL (data:image/... or data:application/...)
    let base64String = base64Data
    let contentType = 'application/pdf'
    
    if (base64Data.startsWith('data:')) {
      // Extract content type and base64 part
      const parts = base64Data.split(',')
      const header = parts[0]
      base64String = parts[1]
      
      // Extract content type from header
      const contentTypeMatch = header.match(/data:([^;]+)/)
      if (contentTypeMatch) {
        contentType = contentTypeMatch[1]
      }
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64')
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'pdf'
    const uniqueFileName = `${timestamp}-${sanitizedFileName}.${extension}`
    const filePath = `${folder}/${uniqueFileName}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading base64 to storage:', {
        error,
        bucket,
        filePath,
        contentType,
      })
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadBase64ToStorage:', {
      error,
      bucket,
      fileName,
      folder,
    })
    return null
  }
}

// POST endpoint for creating installer applications
export async function POST(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/b0934b8b-2dac-4a1b-9a2e-4d6c5b32b657',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:156',message:'POST handler entry',data:{method:request.method,url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  // Validate required environment variables early
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing')
    return NextResponse.json(
      { error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY. Please contact support.' },
      { status: 500 }
    )
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
    return NextResponse.json(
      { error: 'Server configuration error: Missing NEXT_PUBLIC_SUPABASE_URL. Please contact support.' },
      { status: 500 }
    )
  }
  
  try {
    console.log('📥 Installer application POST received')
    const supabase = getSupabaseAdmin()

    // Check content type to support both JSON (new) and FormData (legacy)
    const contentType = request.headers.get('content-type') || ''
    let companyName: string
    let contactPersonName: string
    let contactEmail: string
    let contactPhone: string
    let websiteUrl: string | null
    let yearsInBusiness: string | null
    let primaryServiceProvinces: string[]
    let serviceAreaDescription: string | null
    let generalLiabilityCoverage: string | null
    let numberOfInstalls: string | null
    let typicalSystemSizeRange: string | null
    let workmanshipWarrantyYears: string | null
    let productWarrantySupport: string | null
    let certificationOtherDescription: string | null
    let agreeToVetting: boolean
    let agreeToDoubleWarranty: boolean
    let certificationEsaUrl: string | null = null
    let certificationProvincialUrl: string | null = null
    let certificationOtherUrl: string | null = null
    let insuranceProofUrl: string | null = null
    let manufacturerCertifications: Array<{ name: string; url: string }> = []
    let projectPhotosUrls: string[] = []

    if (contentType.includes('application/json')) {
      // New format: JSON with file URLs (files already uploaded to Supabase)
      const body = await request.json()
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b0934b8b-2dac-4a1b-9a2e-4d6c5b32b657',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:190',message:'JSON payload received',data:{hasCompanyName:!!body.companyName,hasUrls:!!body.certificationEsaUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      companyName = body.companyName
      contactPersonName = body.contactPersonName
      contactEmail = body.contactEmail
      contactPhone = body.contactPhone
      websiteUrl = body.websiteUrl || null
      yearsInBusiness = body.yearsInBusiness || null
      primaryServiceProvinces = body.primaryServiceProvinces || []
      serviceAreaDescription = body.serviceAreaDescription || null
      generalLiabilityCoverage = body.generalLiabilityCoverage || null
      numberOfInstalls = body.numberOfInstalls || null
      typicalSystemSizeRange = body.typicalSystemSizeRange || null
      workmanshipWarrantyYears = body.workmanshipWarrantyYears || null
      productWarrantySupport = body.productWarrantySupport || null
      certificationOtherDescription = body.certificationOtherDescription || null
      agreeToVetting = body.agreeToVetting === true
      agreeToDoubleWarranty = body.agreeToDoubleWarranty === true
      
      // File URLs (already uploaded)
      certificationEsaUrl = body.certificationEsaUrl || null
      certificationProvincialUrl = body.certificationProvincialUrl || null
      certificationOtherUrl = body.certificationOtherUrl || null
      insuranceProofUrl = body.insuranceProofUrl || null
      manufacturerCertifications = body.manufacturerCertifications || []
      projectPhotosUrls = body.projectPhotosUrls || []
    } else {
      // Legacy format: FormData with files (for backward compatibility)
      const formData = await request.formData()
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b0934b8b-2dac-4a1b-9a2e-4d6c5b32b657',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:220',message:'FormData parsed (legacy)',data:{hasCompanyName:!!formData.get('companyName')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      companyName = formData.get('companyName') as string
      contactPersonName = formData.get('contactPersonName') as string
      contactEmail = formData.get('contactEmail') as string
      contactPhone = formData.get('contactPhone') as string
      websiteUrl = formData.get('websiteUrl') as string | null
      yearsInBusiness = formData.get('yearsInBusiness') as string | null
      const primaryServiceProvincesStr = formData.get('primaryServiceProvinces') as string | null
      primaryServiceProvinces = primaryServiceProvincesStr ? JSON.parse(primaryServiceProvincesStr) : []
      serviceAreaDescription = formData.get('serviceAreaDescription') as string | null
      generalLiabilityCoverage = formData.get('generalLiabilityCoverage') as string | null
      numberOfInstalls = formData.get('numberOfInstalls') as string | null
      typicalSystemSizeRange = formData.get('typicalSystemSizeRange') as string | null
      workmanshipWarrantyYears = formData.get('workmanshipWarrantyYears') as string | null
      productWarrantySupport = formData.get('productWarrantySupport') as string | null
      certificationOtherDescription = formData.get('certificationOtherDescription') as string | null
      agreeToVetting = formData.get('agreeToVetting') === 'true'
      agreeToDoubleWarranty = formData.get('agreeToDoubleWarranty') === 'true'

      // Upload files (legacy - files sent in FormData)
      const certificationEsaFile = formData.get('certificationEsa') as File | null
      const certificationProvincialFile = formData.get('certificationProvincial') as File | null
      const certificationOtherFile = formData.get('certificationOther') as File | null
      const insuranceProofFile = formData.get('insuranceProof') as File | null

      if (certificationEsaFile && certificationEsaFile.size > 0) {
        certificationEsaUrl = await uploadFileToStorage(
          supabase,
          certificationEsaFile,
          certificationEsaFile.name,
          'photos',
          'installers/certifications'
        )
      }

      if (certificationProvincialFile && certificationProvincialFile.size > 0) {
        certificationProvincialUrl = await uploadFileToStorage(
          supabase,
          certificationProvincialFile,
          certificationProvincialFile.name,
          'photos',
          'installers/certifications'
        )
      }

      if (certificationOtherFile && certificationOtherFile.size > 0) {
        certificationOtherUrl = await uploadFileToStorage(
          supabase,
          certificationOtherFile,
          certificationOtherFile.name,
          'photos',
          'installers/certifications'
        )
      }

      if (insuranceProofFile && insuranceProofFile.size > 0) {
        insuranceProofUrl = await uploadFileToStorage(
          supabase,
          insuranceProofFile,
          insuranceProofFile.name,
          'photos',
          'installers/insurance'
        )
      }

      const manufacturerNamesStr = formData.get('manufacturerNames') as string | null
      if (manufacturerNamesStr) {
        try {
          const manufacturerNames = JSON.parse(manufacturerNamesStr)
          for (const manufacturerName of manufacturerNames) {
            const manufacturerFile = formData.get(`manufacturerCert_${manufacturerName}`) as File | null
            if (manufacturerFile && manufacturerFile.size > 0) {
              const url = await uploadFileToStorage(
                supabase,
                manufacturerFile,
                manufacturerFile.name,
                'photos',
                'installers/certifications/manufacturer'
              )
              if (url) {
                manufacturerCertifications.push({ name: manufacturerName, url })
              }
            }
          }
        } catch (e) {
          console.error('Error parsing manufacturer names:', e)
        }
      }

      const projectPhotosFiles = formData.getAll('projectPhotos') as File[]
      for (const photoFile of projectPhotosFiles) {
        if (photoFile && photoFile.size > 0) {
          const url = await uploadFileToStorage(
            supabase,
            photoFile,
            photoFile.name,
            'photos',
            'installers/project-photos'
          )
          if (url) {
            projectPhotosUrls.push(url)
          }
        }
      }
    }

    // Validate required fields
    if (!companyName || !contactPersonName || !contactEmail || !contactPhone) {
      console.warn('Installer application validation failed: missing required fields', {
        companyName,
        contactPersonName,
        contactEmail,
        contactPhone,
      })
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactPersonName, contactEmail, contactPhone' },
        { status: 400 }
      )
    }

    // Build insert data
    const insertData: any = {
      company_name: companyName,
      contact_person_name: contactPersonName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      website_url: websiteUrl || null,
      years_in_business: yearsInBusiness || null,
      primary_service_provinces: primaryServiceProvinces.length > 0 ? primaryServiceProvinces : null,
      service_area_description: serviceAreaDescription || null,
      certification_esa_url: certificationEsaUrl,
      certification_provincial_url: certificationProvincialUrl,
      certification_manufacturer: manufacturerCertifications.length > 0 ? manufacturerCertifications : null,
      certification_other_url: certificationOtherUrl,
      certification_other_description: certificationOtherDescription || null,
      general_liability_coverage: generalLiabilityCoverage || null,
      insurance_proof_url: insuranceProofUrl,
      number_of_installs: numberOfInstalls || null,
      typical_system_size_range: typicalSystemSizeRange || null,
      project_photos_urls: projectPhotosUrls.length > 0 ? projectPhotosUrls : null,
      workmanship_warranty_years: workmanshipWarrantyYears || null,
      product_warranty_support: productWarrantySupport || null,
      agree_to_vetting: agreeToVetting,
      agree_to_double_warranty: agreeToDoubleWarranty,
      status: 'pending_review',
      full_application_data: {
        companyName,
        contactPersonName,
        contactEmail,
        contactPhone,
        websiteUrl,
        yearsInBusiness,
        primaryServiceProvinces,
        serviceAreaDescription,
        generalLiabilityCoverage,
        numberOfInstalls,
        typicalSystemSizeRange,
        workmanshipWarrantyYears,
        productWarrantySupport,
        certificationOtherDescription,
        agreeToVetting,
        agreeToDoubleWarranty,
      }
    }

    // Insert into database
    console.log('Inserting installer application into database', {
      companyName,
      contactEmail,
      primaryServiceProvincesCount: primaryServiceProvinces?.length ?? 0,
      projectPhotosCount: projectPhotosUrls.length,
    })

    const { data: application, error } = await supabase
      .from('installer_applications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting installer application:', {
        error,
        companyName,
        contactEmail,
      })
      return NextResponse.json(
        { error: 'Failed to save application', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Installer application saved successfully', {
      applicationId: application.id,
      companyName,
      contactEmail,
    })

    // Send confirmation email to installer via Resend (best-effort)
    try {
      const resend = createResendClient()
      if (!resend) {
        console.warn('Skipping confirmation email - Resend not configured')
      } else {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solarcalculatorcanada.org'

        await resend.emails.send({
        from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
        to: contactEmail,
        subject: 'We received your installer application',
        text: `Hi ${contactPersonName},\n\nThanks for applying to join Solar Calculator Canada as an installer partner.\n\nWe’ve received your application for ${companyName} and will review your details and certifications. A member of our team will follow up with you by email.\n\nYou can track the status of your application any time from our installer portal.\n\n${appUrl}\n\n— Solar Calculator Canada`,
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
              We received your installer application
            </h1>
            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 8px;">
              Hi ${contactPersonName},
            </p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 12px;">
              Thanks for applying to join Solar Calculator Canada as an installer partner.
            </p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
              We’ve received your application for <strong>${companyName}</strong> and will review your details and certifications. A member of our team will follow up with you by email.
            </p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
              You can track the status of your application from the installer portal.
            </p>
            <p style="font-size: 14px; margin-bottom: 20px;">
              <a href="${appUrl}/for-installers" style="display: inline-block; background-color: #166534; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 999px; font-size: 14px; font-weight: 600;">
                Open installer portal
              </a>
            </p>
            <p style="font-size: 13px; color: #94a3b8;">
              — Solar Calculator Canada
            </p>
          </div>
        `,
        })
      }
    } catch (sendError) {
      console.error('Error sending installer application confirmation email:', sendError)
      // Do not fail the API if the email fails
    }

    // Fire-and-forget internal notification about new installer application
    ;(async () => {
      try {
        const subject = `New Installer Application: ${companyName} (${primaryServiceProvinces?.join(', ') || 'No provinces'})`
        const textLines: string[] = []
        textLines.push(`Application ID: ${application.id}`)
        textLines.push(`Company: ${companyName}`)
        textLines.push(`Contact: ${contactPersonName}`)
        textLines.push(`Email: ${contactEmail}`)
        textLines.push(`Phone: ${contactPhone}`)
        if (websiteUrl) textLines.push(`Website: ${websiteUrl}`)
        if (yearsInBusiness) textLines.push(`Years in business: ${yearsInBusiness}`)
        if (primaryServiceProvinces?.length) {
          textLines.push(`Provinces: ${primaryServiceProvinces.join(', ')}`)
        }
        if (numberOfInstalls) {
          textLines.push(`Number of installs: ${numberOfInstalls}`)
        }
        if (generalLiabilityCoverage) {
          textLines.push(`Liability coverage: ${generalLiabilityCoverage}`)
        }
        textLines.push(`ESA cert: ${certificationEsaUrl ? 'Yes' : 'No'}`)
        textLines.push(`Provincial cert: ${certificationProvincialUrl ? 'Yes' : 'No'}`)
        textLines.push(`Insurance proof: ${insuranceProofUrl ? 'Yes' : 'No'}`)
        textLines.push(`Project photos: ${projectPhotosUrls.length}`)
        textLines.push('')
        textLines.push(
          `Admin link: ${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/admin/installers/${application.id}`
        )

        await sendInternalNotificationEmail({
          subject,
          text: textLines.join('\n'),
        })
      } catch (err) {
        console.error('Internal installer application notification email error:', err)
      }
    })()

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Installer application submitted successfully'
    })

  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b0934b8b-2dac-4a1b-9a2e-4d6c5b32b657',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:505',message:'Error caught in POST handler',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200),errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Error in installer application API:', {
      error,
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching installer applications
// Supports:
// - ?id=<uuid> - Fetch single application by ID (public, for status checking)
// - ?status=<status>&search=<term> - Fetch filtered list (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = getSupabaseAdmin()

    // If ID is provided, fetch single application (public access for status checking)
    if (id) {
      const { data: application, error } = await supabase
        .from('installer_applications')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return NextResponse.json(
            { error: 'Application not found' },
            { status: 404 }
          )
        }
        console.error('Error fetching installer application:', error)
        return NextResponse.json(
          { error: 'Failed to fetch application', details: error.message },
          { status: 500 }
        )
      }

      // Map database fields to frontend format
      const mappedApplication = {
        id: application.id,
        companyName: application.company_name,
        contactPersonName: application.contact_person_name,
        contactEmail: application.contact_email,
        contactPhone: application.contact_phone,
        websiteUrl: application.website_url,
        yearsInBusiness: application.years_in_business,
        primaryServiceProvinces: application.primary_service_provinces || [],
        serviceAreaDescription: application.service_area_description,
        certifications: {
          esa: application.certification_esa_url,
          provincial: application.certification_provincial_url,
          manufacturer: application.certification_manufacturer || [],
          other: application.certification_other_url,
          otherDescription: application.certification_other_description,
        },
        generalLiabilityCoverage: application.general_liability_coverage,
        insuranceProof: application.insurance_proof_url,
        numberOfInstalls: application.number_of_installs,
        typicalSystemSizeRange: application.typical_system_size_range,
        projectPhotos: application.project_photos_urls || [],
        workmanshipWarrantyYears: application.workmanship_warranty_years,
        productWarrantySupport: application.product_warranty_support,
        status: application.status,
        reviewed: application.reviewed_at !== null,
        reviewedBy: application.reviewed_by,
        reviewedAt: application.reviewed_at,
        reviewNotes: application.review_notes,
        submittedAt: application.created_at,
        created_at: application.created_at,
      }

      return NextResponse.json({
        success: true,
        application: mappedApplication
      })
    }

    // Otherwise, fetch list with filters (admin only)
    // Build query
    let query = supabase
      .from('installer_applications')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Search filter
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching installer applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applications: applications || []
    })

  } catch (error: any) {
    console.error('Error in GET installer applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

