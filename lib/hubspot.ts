// HubSpot CRM integration for lead syncing

import { Client } from '@hubspot/api-client'
import { Lead } from './supabase'

// Initialize HubSpot client
let hubspotClient: Client | null = null

function getHubSpotClient() {
  if (!hubspotClient && process.env.HUBSPOT_ACCESS_TOKEN) {
    hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN })
  }
  return hubspotClient
}

// Sync lead to HubSpot CRM
export async function syncLeadToHubSpot(lead: Lead) {
  const client = getHubSpotClient()
  
  if (!client) {
    throw new Error('HubSpot client not configured')
  }

  try {
    // Split full name into first and last
    const nameParts = lead.full_name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]

    // Prepare contact properties
    const contactProperties = {
      email: lead.email,
      firstname: firstName,
      lastname: lastName,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      state: lead.province,
      zip: lead.postal_code,
      
      // Custom solar properties
      solar_system_size_kw: lead.system_size_kw?.toString(),
      solar_annual_savings: lead.annual_savings?.toString(),
      solar_roof_area_sqft: lead.roof_area_sqft?.toString(),
      solar_estimated_cost: lead.estimated_cost?.toString(),
      solar_payback_years: lead.payback_years?.toString(),
      solar_annual_production_kwh: lead.annual_production_kwh?.toString(),
      solar_roof_type: lead.roof_type,
      solar_appliances: JSON.stringify(lead.appliances || []),
      landing_page_source: lead.source,
    }

    // Filter out undefined values from contactProperties
    const filteredContactProperties: { [key: string]: string } = Object.fromEntries(
      Object.entries(contactProperties).filter(([_, value]) => value !== undefined)
    ) as { [key: string]: string }

    // Search for existing contact by email
    const searchResponse = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ' as any,
          value: lead.email
        }]
      }],
      properties: ['email'],
      limit: 1,
      after: undefined,
      sorts: []
    } as any)

    let contactId: string

    // Update existing or create new contact
    if (searchResponse.results && searchResponse.results.length > 0) {
      // Update existing contact
      contactId = searchResponse.results[0].id
      await client.crm.contacts.basicApi.update(contactId, {
        properties: filteredContactProperties
      })
    } else {
      // Create new contact
      const newContact = await client.crm.contacts.basicApi.create({
        properties: filteredContactProperties,
        associations: []
      })
      contactId = newContact.id
    }

    // Create deal
    const dealProperties = {
      dealname: `Solar - ${lead.full_name} - ${lead.city || 'Ontario'}`,
      dealstage: 'appointmentscheduled',
      amount: lead.net_cost_after_incentives?.toString(),
      pipeline: 'default',
      solar_system_size: lead.system_size_kw?.toString(),
      estimated_value: lead.estimated_cost?.toString(),
      projected_annual_savings: lead.annual_savings?.toString(),
      // Close date 90 days from now
      closedate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Filter out undefined values from dealProperties
    const filteredDealProperties: { [key: string]: string } = Object.fromEntries(
      Object.entries(dealProperties).filter(([_, value]) => value !== undefined)
    ) as { [key: string]: string }

    const deal = await client.crm.deals.basicApi.create({
      properties: filteredDealProperties,
      associations: [{
        to: { id: contactId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED' as any,
          associationTypeId: 3 // Deal to Contact
        }]
      }]
    })

    return {
      success: true,
      contactId,
      dealId: deal.id
    }

  } catch (error) {
    console.error('HubSpot sync error:', error)
    throw error
  }
}

// Add note to HubSpot contact
export async function addNoteToContact(contactId: string, noteText: string) {
  const client = getHubSpotClient()
  
  if (!client) {
    throw new Error('HubSpot client not configured')
  }

  try {
    await client.crm.objects.notes.basicApi.create({
      properties: {
        hs_note_body: noteText,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [{
        to: { id: contactId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED' as any,
          associationTypeId: 202 // Note to Contact
        }]
      }]
    })

    return { success: true }
  } catch (error) {
    console.error('HubSpot note error:', error)
    throw error
  }
}

