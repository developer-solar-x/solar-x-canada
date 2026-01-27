// Type declarations for @turf/turf
declare module '@turf/turf' {
  export * from '@turf/helpers'
  export * from '@turf/area'
  export * from '@turf/bbox'
  export * from '@turf/bearing'
  export * from '@turf/center'
  export * from '@turf/centroid'
  export * from '@turf/distance'
  export * from '@turf/length'
  export * from '@turf/along'
  export * from '@turf/destination'
  export * from '@turf/nearest-point'
  export * from '@turf/buffer'
  export * from '@turf/union'
  export * from '@turf/intersect'
  export * from '@turf/difference'
  export * from '@turf/boolean-intersects'
  export * from '@turf/line-intersect'
  export * from '@turf/midpoint'
  export * from '@turf/boolean-point-in-polygon'
  
  // Main types
  export interface Feature<G = any, P = any> {
    type: 'Feature'
    geometry: G
    properties: P
  }
  
  export interface Polygon {
    type: 'Polygon'
    coordinates: number[][][]
  }
  
  export interface Point {
    type: 'Point'
    coordinates: number[]
  }
  
  export function polygon(coordinates: number[][][], properties?: any): Feature<Polygon>
  export function point(coordinates: number[], properties?: any): Feature<Point>
  export function area(geojson: any): number
  export function centroid(geojson: any): Feature<Point>
}

