import { Zap, Wind, Home } from 'lucide-react'
import type { AddOn } from './types'

// Available add-on options
export const ADD_ONS: AddOn[] = [
  {
    id: 'ev_charger',
    name: 'EV Charger',
    icon: Zap,
    description: 'Level 2 (240V) charger, typical 32–40A. Indoor/outdoor install, includes permitting and panel tie‑in.'
  },
  {
    id: 'heat_pump',
    name: 'Heat Pump',
    icon: Wind,
    description: 'High‑efficiency cold‑climate heat pump for year‑round heating and cooling. Ducted or ductless options.'
  },
  {
    id: 'new_roof',
    name: 'New Roof',
    icon: Home,
    description: 'Replace shingles prior to solar. Includes underlayment, flashing, and integrated solar mounts for a seamless install.'
  },
  {
    id: 'water_heater',
    name: 'Water Heater',
    icon: Zap,
    description: 'High‑efficiency heat‑pump water heater or tankless option to reduce electric hot‑water costs.'
  }
]

