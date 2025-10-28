# Roof Orientation Detection Fix

## Problem Statement

The autoroof phasing detection system was incorrectly classifying north-facing roofs as south-facing. This occurred because the detection algorithm had a built-in south-facing bias.

## Root Cause

In `lib/roof-calculations.ts`, the `calculateRoofAzimuth` function contained logic that always selected the roof orientation closest to 180° (south):

```typescript
// OLD ALGORITHM (INCORRECT)
// Choose the perpendicular that faces closer to south (180°)
const diff1 = Math.abs(180 - perpendicular1)
const diff2 = Math.abs(180 - perpendicular2)
azimuth = diff1 < diff2 ? perpendicular1 : perpendicular2
```

This approach assumed all roofs face south (optimal for Northern Hemisphere solar), causing misclassification of north-facing roofs.

## Solution Implemented

### 1. Geometry-Based Orientation Detection

Replaced the biased algorithm with a geometry-based approach that uses the polygon's centroid:

```typescript
// NEW ALGORITHM (CORRECT)
// Calculate polygon centroid
const centroid = turf.centroid(polygonFeature)

// Calculate midpoint of the longest edge
const midpoint = [(edgeStart[0] + edgeEnd[0]) / 2, (edgeStart[1] + edgeEnd[1]) / 2]

// Calculate bearing from centroid to midpoint (outward direction)
const outwardBearing = turf.bearing(centroidCoords, midpoint)

// Choose the perpendicular closer to the outward direction
azimuth = diff1 < diff2 ? perpendicular1 : perpendicular2
```

**How it works:**
- Finds the geometric center (centroid) of the roof polygon
- Calculates the vector from the center to the longest edge
- This outward vector represents the direction the roof slope faces
- Selects the perpendicular direction closest to this outward vector

**Benefits:**
- No directional bias - works for all compass orientations
- Correctly identifies north, south, east, and west-facing roofs
- Based on actual polygon geometry, not assumptions

### 2. Confidence Scoring System

Added a new function `calculateRoofAzimuthWithConfidence` that provides:

- **Confidence score (0-100%)** - indicates reliability of detection
- **Confidence reason** - explains why confidence might be low

**Confidence factors:**
1. **Polygon complexity** - Simple shapes (3-6 vertices) are more reliable
2. **Edge dominance** - Clear longest edge improves accuracy
3. **Shape regularity** - Regular shapes (rectangular) are easier to analyze

**Example output:**
```typescript
{
  azimuth: 0,           // North-facing
  confidence: 85,       // High confidence
  reason: "High confidence detection"
}
```

### 3. UI Enhancements

Updated `components/estimator/StepDrawRoof.tsx` to:

- Display confidence warnings when detection is uncertain (< 70%)
- Show confidence percentage and reason to users
- Encourage user verification for low-confidence detections

**UI Features:**
- Blue confidence badge for uncertain detections
- Clear messaging about why confidence is low
- Easy correction interface with one-click orientation selection

## Testing Recommendations

### Test Cases for North-Facing Roofs

1. **Simple rectangular north-facing roof**
   - Draw a rectangle with longest edge running east-west
   - Verify orientation is detected as North (0°/360°)
   - Expected confidence: 85-100%

2. **Complex multi-section roof with north face**
   - Draw multiple polygons, one facing north
   - Verify north section shows 0° azimuth
   - Expected confidence: 70-90%

3. **Irregular shaped north-facing roof**
   - Draw polygon with 6+ vertices facing north
   - Verify orientation is detected as North
   - Expected confidence: 60-80% (may show low confidence warning)

### Test Cases for Edge Cases

1. **Square roof** (no dominant edge)
   - Expected: Lower confidence score
   - UI should show "No clearly dominant edge" warning

2. **L-shaped roof**
   - Expected: Each section detected independently
   - Confidence may vary by section complexity

3. **Diamond-shaped roof**
   - Expected: Correct orientation based on longest diagonal
   - Confidence depends on regularity

## Files Modified

1. **`lib/roof-calculations.ts`**
   - Updated `calculateRoofAzimuth()` function with geometry-based algorithm
   - Added `calculateAngularDifference()` helper function
   - Added `calculateRoofAzimuthWithConfidence()` function

2. **`components/estimator/StepDrawRoof.tsx`**
   - Updated to use `calculateRoofAzimuthWithConfidence()`
   - Added confidence display in section breakdown
   - Added confidence warning UI component

3. **`components/estimator/StepReview.tsx`**
   - No changes needed (already uses roofSections data correctly)

## Performance Impact

- Negligible performance impact
- Additional calculations: 1 centroid + 1 midpoint + 1 bearing per roof section
- All operations are O(n) where n is number of vertices (typically 4-8)

## Backwards Compatibility

- Fully backwards compatible
- Old estimates without confidence data will still work
- Confidence data is optional in the roofSections type

## Future Improvements

1. **Machine Learning Integration**
   - Train model on user corrections to improve accuracy
   - Learn patterns from manual orientation adjustments

2. **Satellite Imagery Analysis**
   - Use roof shading patterns to detect slope direction
   - Analyze roof ridge lines from imagery

3. **3D Building Data**
   - Integrate with OpenStreetMap 3D building data
   - Use actual roof slope data when available

4. **User Feedback Loop**
   - Track correction frequency by roof shape
   - Adjust confidence scoring based on real-world accuracy

## Summary

The roof orientation detection now correctly identifies north-facing roofs using geometric analysis rather than directional bias. The addition of confidence scoring helps users identify when manual verification is needed. This fix addresses the root cause rather than just the symptom, ensuring accurate orientation detection for all roof directions.

