# Peak Shaving Calculator - Access Control & localStorage Management

## Overview
The Peak Shaving Calculator implements a 2-use limit per email address (unlimited for @solar-x.ca emails). This document explains when localStorage is cleared to ensure limits are properly enforced.

## localStorage Key
- **Key**: `peak_shaving_verified_email`
- **Value**: Email address of verified user

## When localStorage is CLEARED (Deleted)

### 1. **On Page Load - Access Check Fails**
- **When**: User refreshes page or navigates to calculator
- **Condition**: Stored email exists but access check returns `canAccess: false`
- **Reasons**:
  - Usage limit reached (2 uses for regular users)
  - Email not verified
  - Email not found in database
- **Location**: `app/peak-shaving-sales-calculator/page.tsx` (lines 88-92)

### 2. **On Verification - Limit Already Reached**
- **When**: User verifies email but has already used 2 times
- **Condition**: `check-access` API returns `canAccess: false`
- **Location**: 
  - `app/peak-shaving-sales-calculator/page.tsx` (lines 143-148)
  - `components/peak-shaving/LeadCaptureModal.tsx` (lines 148-155)

### 3. **On Record Access Failure**
- **When**: User verifies email but `record-access` API fails
- **Condition**: `record-access` API returns error (usually limit reached)
- **Location**: `components/peak-shaving/LeadCaptureModal.tsx` (lines 159-168)

### 4. **On API Errors**
- **When**: Any error occurs during access check
- **Condition**: Network error, server error, or unexpected response
- **Location**: 
  - `app/peak-shaving-sales-calculator/page.tsx` (lines 94-98)
  - `app/peak-shaving-sales-calculator/page.tsx` (lines 155-159)

### 5. **On Tab Visibility Change**
- **When**: User returns to the tab after being away
- **Condition**: Access check returns `canAccess: false`
- **Purpose**: Catches cases where limit was reached while user was on another tab
- **Location**: `app/peak-shaving-sales-calculator/page.tsx` (lines 117-124)

## When localStorage is SET (Saved)

### 1. **On Successful Verification**
- **When**: User verifies email AND access is granted
- **Condition**: 
  - Email verified successfully
  - Access check returns `canAccess: true`
  - Access recorded successfully (usage count incremented)
- **Location**: 
  - `app/peak-shaving-sales-calculator/page.tsx` (line 152)
  - `components/peak-shaving/LeadCaptureModal.tsx` (via `onVerified` callback)

## Access Recording Logic

### Important: Access is NOT recorded on every page load
- **On Page Load**: Access is checked but NOT recorded (prevents incrementing on refresh)
- **On Verification**: Access is checked AND recorded (increments usage count)

### Flow:
1. User verifies email → Access recorded (usage count: 0 → 1)
2. User refreshes page → Access checked, NOT recorded (usage count stays 1)
3. User verifies again (new session) → Access recorded (usage count: 1 → 2)
4. User tries to verify again → Access denied, localStorage cleared

## Usage Limit Enforcement

### Regular Users (non @solar-x.ca)
- **Limit**: 2 uses (permanent)
- **Enforcement**: 
  - Checked before recording access
  - Checked on every page load
  - Checked when tab becomes visible

### Solar-X Employees (@solar-x.ca)
- **Limit**: Unlimited
- **Auto-verification**: Automatically verified on email send
- **No localStorage clearing**: Access never revoked

## API Endpoints

### `/api/peak-shaving/check-access` (POST)
- **Purpose**: Check if email can access calculator
- **Does NOT increment**: Usage count
- **Returns**: `{ canAccess: boolean, reason: string, usageCount: number }`

### `/api/peak-shaving/record-access` (POST)
- **Purpose**: Record calculator access and increment usage count
- **Increments**: Usage count (only if under limit)
- **Returns**: `{ success: boolean, usageCount: number, remainingUses: number }`
- **Error**: Returns 403 if limit reached

## Summary

**localStorage is cleared when:**
1. ✅ Usage limit reached (2 uses)
2. ✅ Email not verified
3. ✅ Access check fails
4. ✅ Record access fails
5. ✅ Any API error occurs
6. ✅ User returns to tab and limit was reached

**localStorage is set when:**
1. ✅ Email verified AND access granted AND access recorded successfully

This ensures the 2-use limit is properly enforced and localStorage cannot be used to bypass the limit.

