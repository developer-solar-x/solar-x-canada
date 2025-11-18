// Function to calculate angle at a vertex
export function calculateAngle(p1: number[], p2: number[], p3: number[]): number {
  // Calculate angle at p2 formed by p1-p2-p3
  const angle1 = Math.atan2(p1[1] - p2[1], p1[0] - p2[0])
  const angle2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0])
  let angle = Math.abs(angle1 - angle2) * (180 / Math.PI)
  
  // Normalize to 0-180 range
  if (angle > 180) angle = 360 - angle
  
  return Math.round(angle)
}

// Function to calculate optimal label offset based on interior angle direction
export function calculateLabelOffset(
  prevCoord: number[], 
  currCoord: number[], 
  nextCoord: number[], 
  angle: number
): [number, number] {
  // Calculate vectors from current vertex to adjacent vertices
  const vec1 = [prevCoord[0] - currCoord[0], prevCoord[1] - currCoord[1]]
  const vec2 = [nextCoord[0] - currCoord[0], nextCoord[1] - currCoord[1]]
  
  // Calculate bisector (average direction pointing into the polygon)
  const bisectorX = (vec1[0] + vec2[0]) / 2
  const bisectorY = (vec1[1] + vec2[1]) / 2
  
  // Normalize and scale for label offset
  const length = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY)
  if (length === 0) return [0, -2.5]
  
  // Dynamic offset based on angle sharpness
  // Sharp angles (< 60°) need more distance, obtuse angles (> 120°) need less
  let offsetDistance = 2.5
  if (angle < 60) {
    offsetDistance = 3.5 // Sharp corners need more space
  } else if (angle > 120) {
    offsetDistance = 2.0 // Obtuse corners need less space
  }
  
  // Invert direction (we want label inside the polygon)
  const offsetX = -(bisectorX / length) * offsetDistance
  const offsetY = -(bisectorY / length) * offsetDistance
  
  return [offsetX, offsetY]
}

