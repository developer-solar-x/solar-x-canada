# SolarX Solar Rooftop Estimator

![SolarX Logo](https://via.placeholder.com/400x100/1B4E7C/FFFFFF?text=SOLARX+Modern+Solar+Solutions)

Modern solar estimation platform for Ontario homeowners. Get accurate solar estimates in minutes with our interactive rooftop drawing tool and AI-powered calculations.

## Overview

SolarX is a production-ready MVP solar rooftop estimator built with Next.js 15, featuring:

- Interactive satellite map with roof drawing tools
- Real-time solar production calculations using NREL PVWatts v8 API
- Accurate cost and savings projections with Ontario-specific data
- HubSpot CRM integration for seamless lead management
- Beautiful, responsive UI with SolarX branding
- Complete admin dashboard for managing leads

## Tech Stack

- **Framework:** Next.js 15 (App Router) with React 19
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Maps:** Mapbox GL JS with drawing tools
- **Geospatial:** Turf.js for area calculations
- **Solar API:** NREL PVWatts v8
- **CRM:** HubSpot API
- **Charts:** Recharts
- **TypeScript:** Full type safety

## Features

### For Homeowners
- 🗺️ **Interactive Roof Drawing** - Draw your roof on satellite imagery
- ⚡ **Instant Estimates** - Real-time solar potential calculations
- 💰 **Accurate Projections** - System size, costs, savings, and ROI
- 📊 **Detailed Analytics** - Monthly production charts and 25-year projections
- 🌱 **Environmental Impact** - See your carbon footprint reduction
- 📱 **Fully Responsive** - Works perfectly on all devices

### For Administrators
- 🔐 **Secure Login** - Session-based authentication with mock credentials
- 📋 **Lead Management** - View and manage all submissions
- 🔄 **HubSpot Sync** - Automatic CRM integration
- 📈 **Analytics Dashboard** - Track conversion metrics
- 📥 **CSV Export** - Export leads for further analysis
- 🔍 **Advanced Filters** - Filter by status, date, location

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))
- Mapbox account ([mapbox.com](https://mapbox.com))
- NREL API key ([developer.nrel.gov](https://developer.nrel.gov))
- HubSpot account (optional, for CRM integration)

### Installation

1. **Clone the repository**
   ```powershell
   git clone https://github.com/your-org/solarx-estimator.git
   cd solarx-estimator
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up environment variables**
   ```powershell
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Mapbox
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

   # NREL PVWatts
   NREL_API_KEY=your_nrel_api_key

   # HubSpot
   HUBSPOT_ACCESS_TOKEN=your_hubspot_token

   # Gmail (for sending estimate emails)
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password

   # Admin
   ADMIN_PASSWORD=your_secure_password

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   - Go to your Supabase project SQL Editor
   - Copy and run the contents of `supabase-setup.sql`
   - This creates all necessary tables and indexes

5. **Run the development server**
   ```powershell
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Admin Access

The admin dashboard is protected by authentication. To access:

1. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)
2. You'll be redirected to the login page
3. Use these mock credentials:
   ```
   Email: admin@solarx.ca
   Password: admin123
   ```

**Note**: These are hardcoded mock credentials for development only. See `docs/ADMIN_AUTH.md` for details on implementing proper authentication for production.

## API Keys Setup

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

### Mapbox
1. Sign up at [mapbox.com](https://mapbox.com)
2. Go to Account > Access tokens
3. Create a new token with all scopes enabled
4. Add your localhost and production URLs to the token restrictions

### NREL
1. Sign up at [developer.nrel.gov](https://developer.nrel.gov/signup/)
2. Get your API key from the dashboard
3. Note: Free tier has rate limits (1,000 requests/hour)

### HubSpot (Optional)
1. Go to HubSpot Settings > Integrations > Private Apps
2. Create a new private app
3. Grant necessary scopes (contacts, deals, CRM)
4. Generate access token
5. Create custom properties as needed (see specification)

### Gmail (for Estimate Emails)
To send estimate emails via Gmail, you need to create a Gmail App Password:

1. **Enable 2-Step Verification** (required for app passwords):
   - Go to your Google Account: [myaccount.google.com](https://myaccount.google.com)
   - Navigate to Security > 2-Step Verification
   - Follow the prompts to enable it

2. **Generate App Password**:
   - Go to Security > 2-Step Verification
   - Scroll down to "App passwords"
   - Click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Enter "SolarX Estimator" as the name
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Add to Environment Variables**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop  # Use the 16-character app password (no spaces)
   ```

**Important Notes**:
- Use the **App Password**, not your regular Gmail password
- Remove spaces from the app password when adding to `.env.local`
- The `GMAIL_USER` should be your full Gmail address
- For Google Workspace accounts, you may need to enable "Less secure app access" or use OAuth2 instead

## Project Structure

```
solarx-estimator/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── calculator/           # Quick calculator endpoint
│   │   ├── estimate/             # Full estimate calculation
│   │   ├── leads/                # Lead submission and retrieval
│   │   └── hubspot/              # HubSpot sync
│   ├── estimator/                # Estimator multi-step flow
│   ├── admin/                    # Admin dashboard (future)
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── estimator/                # Estimator step components
│   ├── Header.tsx                # Navigation header
│   ├── Hero.tsx                  # Hero section
│   ├── Features.tsx              # Features grid
│   ├── Calculator.tsx            # Interactive calculator
│   └── ...                       # Other components
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client
│   ├── pvwatts.ts                # NREL API integration
│   ├── hubspot.ts                # HubSpot integration
│   └── utils.ts                  # Helper functions
├── config/                       # Configuration
│   └── provinces.ts              # Province-specific solar data
├── supabase-setup.sql            # Database schema
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── postcss.config.mjs            # PostCSS config
└── README.md                     # This file
```

## Building for Production

1. **Build the application**
   ```powershell
   npm run build
   ```

2. **Test the production build locally**
   ```powershell
   npm start
   ```

3. **Deploy to Vercel (Recommended)**
   - Push your code to GitHub
   - Import repository in Vercel
   - Add environment variables in Vercel dashboard
   - Deploy!

## Environment Variables

Required environment variables for production:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | Mapbox Account > Tokens |
| `NREL_API_KEY` | NREL API key | developer.nrel.gov |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot API token | HubSpot > Private Apps |
| `GMAIL_USER` | Gmail address for sending emails | Your Gmail account |
| `GMAIL_APP_PASSWORD` | Gmail app password | Google Account > Security > App Passwords |
| `ADMIN_PASSWORD` | Admin dashboard password | Set your own |
| `NEXT_PUBLIC_APP_URL` | Production URL | Your domain |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

### Custom Server

1. Build the application: `npm run build`
2. Set environment variables on your server
3. Run: `npm start`
4. Use a process manager like PM2 for production

## Contributing

This is a proprietary project for SolarX. Internal contributions welcome.

## License

Proprietary - SolarX Inc. All rights reserved.

## Support

For questions or issues:
- Email: dev@solarx.ca
- Internal Wiki: [Link to wiki]

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Landing page with calculator
- ✅ Multi-step estimator flow
- ✅ NREL PVWatts integration
- ✅ Supabase database
- ✅ HubSpot CRM sync
- ✅ Lead submission

### Phase 2 (Q1 2025)
- 🔲 Full Mapbox integration with drawing tools
- 🔲 Admin dashboard with analytics
- 🔲 PDF report generation
- 🔲 Email automation
- 🔲 Photo upload functionality

### Phase 3 (Q2 2025)
- 🔲 Multi-language support (French)
- 🔲 Financing calculator
- 🔲 Customer portal
- 🔲 Installer network portal
- 🔲 Mobile app

### Phase 4 (Q3 2025)
- 🔲 Expand to all Canadian provinces
- 🔲 AI-powered roof detection
- 🔲 Virtual site visits
- 🔲 Advanced analytics

## Acknowledgments

- NREL for providing the PVWatts API
- Mapbox for mapping services
- The Next.js and React teams
- Supabase for the backend infrastructure

---

Built with ☀️ by SolarX

