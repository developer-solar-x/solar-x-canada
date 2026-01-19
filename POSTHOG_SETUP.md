# PostHog Integration Setup Guide

This guide explains how to set up PostHog to track user behavior in the estimate flows, specifically where users stop or drop off.

## Overview

PostHog is integrated to track:
- When users start an estimate (estimator or quick-estimate)
- Each step they view
- When they complete a step
- When they go back to a previous step
- When they abandon the estimate (leave without completing)
- When they complete the entire estimate

## Setup Instructions

### 1. Get PostHog API Key

1. Sign up for a free PostHog account at https://posthog.com
2. Create a new project
3. Copy your Project API Key from Settings → Project → API Keys

### 2. Add Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note**: 
- Use `https://us.i.posthog.com` for US region
- Use `https://eu.i.posthog.com` for EU region
- Use your custom domain if you have one configured

### 3. Verify Installation

The PostHog provider is already integrated in `app/layout.tsx`. Once you add the environment variables, PostHog will automatically start tracking.

## Events Tracked

### Estimate Events

#### `estimate_started`
Fired when a user starts an estimate.

**Properties:**
- `estimate_type`: 'estimator' | 'quick-estimate'
- `mode`: 'easy' | 'detailed' (estimator only)
- `program_type`: 'net_metering' | 'hrs_residential' | 'quick'
- `lead_type`: 'residential' | 'commercial'
- `province`: Province code (e.g., 'ON', 'AB')

#### `estimate_step_viewed`
Fired when a user views a step.

**Properties:**
- `step_name`: Name of the step (e.g., 'Location', 'Roof Size')
- `step_number`: Current step number (1-indexed)
- `total_steps`: Total number of steps
- `estimate_type`: 'estimator' | 'quick-estimate'
- `progress_percentage`: Percentage complete (0-100)
- `mode`, `program_type`, `lead_type`, `province`: Additional context

#### `estimate_step_completed`
Fired when a user completes a step and moves to the next.

**Properties:**
- Same as `estimate_step_viewed`

#### `estimate_step_back`
Fired when a user goes back to a previous step.

**Properties:**
- `step_name`: Name of the step they're leaving
- `step_number`: Step number they're leaving
- `estimate_type`: 'estimator' | 'quick-estimate'

#### `estimate_abandoned`
Fired when a user leaves the estimate without completing it.

**Properties:**
- `step_name`: Step they were on when they left
- `step_number`: Step number they were on
- `total_steps`: Total number of steps
- `estimate_type`: 'estimator' | 'quick-estimate'
- `progress_percentage`: How far they got (0-100)
- `time_spent_seconds`: How long they spent on the estimate
- `mode`, `program_type`, `lead_type`, `province`: Additional context

#### `estimate_completed`
Fired when a user completes the entire estimate.

**Properties:**
- `estimate_type`: 'estimator' | 'quick-estimate'
- `total_steps`: Total number of steps
- `time_spent_seconds`: Total time spent
- `program_type`, `lead_type`, `province`: Additional context
- `has_estimate`: Whether an estimate was generated

## Viewing Analytics in PostHog

### 1. Funnel Analysis

Create a funnel to see where users drop off:

1. Go to PostHog → Insights → New Insight → Funnel
2. Add steps:
   - `estimate_started` (filter by `estimate_type`)
   - `estimate_step_viewed` where `step_name = 'Location'`
   - `estimate_step_viewed` where `step_name = 'Roof Size'`
   - `estimate_step_viewed` where `step_name = 'Energy'`
   - ... (add all steps)
   - `estimate_completed`

### 2. Abandonment Analysis

To see where users abandon:

1. Go to PostHog → Insights → New Insight → Trends
2. Select `estimate_abandoned`
3. Group by `step_name` to see which steps have the most abandonments
4. Filter by `estimate_type` to separate estimator vs quick-estimate

### 3. Step Completion Rates

To see completion rates per step:

1. Go to PostHog → Insights → New Insight → Trends
2. Select `estimate_step_completed`
3. Group by `step_name`
4. Compare with `estimate_step_viewed` to calculate completion rates

### 4. Time Analysis

To see how long users spend:

1. Go to PostHog → Insights → New Insight → Trends
2. Select `estimate_abandoned` or `estimate_completed`
3. Use `time_spent_seconds` property to analyze duration

## Example Queries

### Find Most Common Drop-off Points

```
Event: estimate_abandoned
Group by: step_name
Order by: Count (descending)
```

### Compare Estimator vs Quick-Estimate Completion

```
Event: estimate_completed
Breakdown by: estimate_type
```

### Average Time to Complete

```
Event: estimate_completed
Property: time_spent_seconds
Aggregation: Average
```

### Step-by-Step Drop-off Rate

Create a funnel with all steps, then view the drop-off percentage between each step.

## Privacy & Compliance

PostHog is configured to:
- Only track on the client side
- Respect user privacy settings
- Not capture sensitive information (emails, addresses are not included in events by default)

To disable tracking in development, simply don't set the `NEXT_PUBLIC_POSTHOG_KEY` environment variable.

## Troubleshooting

### PostHog not tracking

1. Check that `NEXT_PUBLIC_POSTHOG_KEY` is set in `.env.local`
2. Check browser console for PostHog errors
3. Verify PostHog is loaded: Open browser console and type `posthog.__loaded` (should return `true`)

### Events not appearing

1. Wait a few minutes for events to appear in PostHog dashboard
2. Check PostHog → Activity → Live events to see real-time events
3. Verify you're looking at the correct project in PostHog

### Development mode

PostHog will only initialize if `NEXT_PUBLIC_POSTHOG_KEY` is set. In development without the key, the app will work normally but won't track events.
