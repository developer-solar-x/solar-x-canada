# IP Geolocation Setup Guide

This document explains how IP geolocation is implemented to prevent users from bypassing location restrictions by using a Canadian address when they're actually in another country.

## Overview

The system now validates both:
1. **Address Location**: Checks if the entered address is in Ontario or Alberta (service area)
2. **IP Country**: Checks if the user's IP address is from Canada

If a user enters a Canadian address but their IP is from another country, they'll see a warning message.

## API Options

The implementation supports multiple IP geolocation APIs with automatic fallback:

### 1. **Vercel/Cloudflare Headers** (Recommended - Free)
If deployed on Vercel or using Cloudflare, the country is automatically available in headers:
- Vercel: `x-vercel-ip-country`
- Cloudflare: `cf-ipcountry`

**No API key needed** - this is the fastest and most reliable option.

### 2. **ipapi.co** (Free Tier: 1,000 requests/day)
- Simple and reliable
- Optional API key for higher limits
- Sign up at: https://ipapi.co/

### 3. **ip-api.com** (Free Tier: 45 requests/minute)
- Fallback option if ipapi.co fails
- No API key needed for free tier

## Setup Instructions

### Option 1: Using Vercel/Cloudflare (Recommended)

If you're deployed on Vercel or using Cloudflare, **no setup is needed**. The system automatically detects the country from headers.

### Option 2: Using ipapi.co API Key (Optional)

1. Sign up for a free account at https://ipapi.co/
2. Get your API key from the dashboard
3. Add to your `.env` file:

```env
IPAPI_API_KEY=your_api_key_here
```

**Note**: The system works without an API key, but you'll be limited to 1,000 requests/day. With an API key, you get higher limits.

## How It Works

### 1. IP Detection
The system extracts the user's IP address from request headers:
- `x-vercel-forwarded-for` (Vercel)
- `x-forwarded-for` (standard)
- `x-real-ip` (standard)
- `cf-connecting-ip` (Cloudflare)

### 2. Country Detection
1. **First**: Checks Vercel/Cloudflare headers (instant, no API call)
2. **Second**: If no headers, calls ipapi.co API
3. **Fallback**: If ipapi.co fails, tries ip-api.com

### 3. Validation
When a user enters an address:
1. Validates the address is in Ontario or Alberta
2. Checks if their IP country is Canada
3. If IP is not from Canada but address is Canadian, shows warning

### 4. User Experience
- **Localhost/Private IPs**: Always allowed (development)
- **IP Detection Fails**: Allows access (doesn't block users due to API issues)
- **IP Not Canada + Canadian Address**: Shows warning but allows user to proceed

## Files Created/Modified

### New Files
- `app/api/ip-geolocation/route.ts` - API endpoint for IP geolocation
- `lib/ip-geolocation.ts` - Utility functions for IP validation

### Modified Files
- `components/estimator/StepLocation/index.tsx` - Added IP validation to location step

## API Endpoint

### GET `/api/ip-geolocation`

Returns:
```json
{
  "success": true,
  "country": "CA",
  "countryName": "Canada",
  "isCanada": true,
  "source": "headers" | "ipapi.co" | "ip-api.com" | "localhost"
}
```

## Testing

### Test with Canadian IP
1. Enter a Canadian address
2. System should validate successfully

### Test with Non-Canadian IP
1. Use a VPN to connect from another country
2. Enter a Canadian address
3. System should show a warning message

### Test Localhost
- Localhost IPs are always allowed (for development)

## Privacy Considerations

- IP addresses are only used for country detection
- No IP addresses are stored in the database
- The validation is permissive - it warns but doesn't block users
- If IP detection fails, users are allowed to proceed

## Troubleshooting

### IP Detection Not Working
1. Check if you're on Vercel/Cloudflare (headers should work automatically)
2. Check API rate limits if using free tier
3. Check browser console for errors
4. The system will fallback to allowing access if detection fails

### False Positives
- VPN users may trigger warnings
- Corporate networks may show incorrect country
- The system is designed to warn, not block, to avoid false positives

## Future Enhancements

Possible improvements:
1. Store IP country in database for analytics
2. Add more granular validation (province-level)
3. Add rate limiting per IP
4. Add admin override for legitimate cases

