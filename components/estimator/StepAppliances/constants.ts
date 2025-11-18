import type { Appliance } from './types'

export const PRESET_APPLIANCES: Omit<Appliance, 'id'>[] = [
  // Essential Appliances
  { name: 'Refrigerator', quantity: 1, wattage: 150, hoursPerDay: 24, category: 'essential' },
  { name: 'Freezer', quantity: 0, wattage: 100, hoursPerDay: 24, category: 'essential' },
  { name: 'Water Heater (Electric)', quantity: 1, wattage: 4000, hoursPerDay: 3, category: 'essential' },
  { name: 'Washing Machine', quantity: 1, wattage: 500, hoursPerDay: 1, category: 'essential' },
  { name: 'Dryer (Electric)', quantity: 1, wattage: 3000, hoursPerDay: 1, category: 'essential' },
  { name: 'Dishwasher', quantity: 1, wattage: 1800, hoursPerDay: 1, category: 'essential' },
  { name: 'Microwave', quantity: 1, wattage: 1000, hoursPerDay: 0.5, category: 'essential' },
  { name: 'Oven/Stove (Electric)', quantity: 1, wattage: 2400, hoursPerDay: 1, category: 'essential' },
  
  // Comfort & Entertainment
  { name: 'Air Conditioner (Central)', quantity: 0, wattage: 3500, hoursPerDay: 8, category: 'comfort' },
  { name: 'Space Heater', quantity: 0, wattage: 1500, hoursPerDay: 6, category: 'comfort' },
  { name: 'LED Lights (per bulb)', quantity: 15, wattage: 10, hoursPerDay: 5, category: 'comfort' },
  { name: 'TV (LED)', quantity: 2, wattage: 80, hoursPerDay: 5, category: 'comfort' },
  { name: 'Computer/Laptop', quantity: 2, wattage: 150, hoursPerDay: 8, category: 'comfort' },
  { name: 'Wi-Fi Router', quantity: 1, wattage: 10, hoursPerDay: 24, category: 'comfort' },
  { name: 'Gaming Console', quantity: 0, wattage: 150, hoursPerDay: 3, category: 'comfort' },
  
  // Future Planning
  { name: 'Electric Vehicle Charger (Level 2)', quantity: 0, wattage: 7200, hoursPerDay: 4, category: 'future' },
  { name: 'Hot Tub/Spa', quantity: 0, wattage: 1500, hoursPerDay: 2, category: 'future' },
  { name: 'Pool Pump', quantity: 0, wattage: 1000, hoursPerDay: 8, category: 'future' },
  { name: 'Home Office Equipment', quantity: 0, wattage: 300, hoursPerDay: 8, category: 'future' },
]

