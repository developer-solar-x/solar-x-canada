// Script to create the first superadmin user
// Run with: node scripts/create-superadmin.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function createSuperAdmin() {
  try {
    console.log('Creating superadmin user...')
    
    // Step 1: Create user in Supabase Auth
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'developer@solar-x.ca',
        password: 'SolarX2025',
        email_confirm: true,
      }),
    })

    if (!authResponse.ok) {
      const error = await authResponse.json()
      throw new Error(`Auth creation failed: ${JSON.stringify(error)}`)
    }

    const authData = await authResponse.json()
    const userId = authData.user.id

    console.log(`✅ Created auth user: ${userId}`)

    // Step 2: Create admin_users record
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: userId,
        email: 'developer@solar-x.ca',
        full_name: 'Developer',
        role: 'superadmin',
        is_active: true,
      }),
    })

    if (!dbResponse.ok) {
      const error = await dbResponse.json()
      throw new Error(`Database insert failed: ${JSON.stringify(error)}`)
    }

    const dbData = await dbResponse.json()
    console.log(`✅ Created admin_users record:`, dbData)

    console.log('\n🎉 Superadmin user created successfully!')
    console.log('Email: developer@solar-x.ca')
    console.log('Password: SolarX2025')
    console.log('Role: superadmin')
    console.log('\nYou can now login at /admin/login')

  } catch (error) {
    console.error('❌ Error creating superadmin:', error)
    process.exit(1)
  }
}

createSuperAdmin()

