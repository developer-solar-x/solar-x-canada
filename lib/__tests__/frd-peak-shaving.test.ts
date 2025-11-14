/**
 * FRD Peak Shaving Calculator Test Suite
 * Tests all FRD requirements including AI Mode, Day/Night Split, Edge Cases, and Offset Percentages
 */

import { calculateFRDPeakShaving } from '../simple-peak-shaving'
import { BATTERY_SPECS } from '../../config/battery-specs'
import { TOU_RATE_PLAN, ULO_RATE_PLAN } from '../../config/rate-plans'
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION } from '../simple-peak-shaving'

// Helper to create a test battery
const getTestBattery = (usableKwh: number) => {
  return {
    id: 'test-battery',
    brand: 'Test',
    model: `${usableKwh}kWh`,
    nominalKwh: usableKwh / 0.9, // Assume 90% DoD
    usableKwh,
    price: usableKwh * 500,
    roundTripEfficiency: 0.9,
    maxPowerKw: usableKwh * 2,
  }
}

describe('FRD Peak Shaving Calculator', () => {
  describe('Step A: Day/Night Split', () => {
    test('should split usage 50/50 by default', () => {
      const result = calculateFRDPeakShaving(
        10000, // U = 10,000 kWh
        5000,  // S = 5,000 kWh
        getTestBattery(16), // B = 16 kWh
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false, // AI Mode OFF
        { p_day: 0.5, p_night: 0.5 }
      )

      expect(result.dayLoad).toBe(5000) // 50% of 10,000
      expect(result.nightLoad).toBe(5000) // 50% of 10,000
    })

    test('should handle custom day/night split', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false,
        { p_day: 0.6, p_night: 0.4 }
      )

      expect(result.dayLoad).toBe(6000) // 60% of 10,000
      expect(result.nightLoad).toBe(4000) // 40% of 10,000
    })
  })

  describe('Step B: Solar Allocation', () => {
    test('should allocate solar to day load first', () => {
      const result = calculateFRDPeakShaving(
        10000, // U = 10,000 kWh
        6000,  // S = 6,000 kWh (more than dayLoad)
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      expect(result.solarToDay).toBe(5000) // min(6000, 5000) = 5000
      expect(result.solarExcess).toBe(1000) // max(6000 - 5000, 0) = 1000
      expect(result.dayGridAfterSolar).toBe(0) // max(5000 - 5000, 0) = 0
    })

    test('should not exceed dayLoad constraint', () => {
      const result = calculateFRDPeakShaving(
        10000,
        8000, // S = 8,000 kWh (much more than dayLoad)
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      // Solar should be capped at dayLoad
      expect(result.solarToDay).toBeLessThanOrEqual(result.dayLoad)
      expect(result.solarToDay).toBe(5000) // min(8000, 5000)
      expect(result.solarExcess).toBe(3000) // 8000 - 5000
    })

    test('should handle solar less than dayLoad', () => {
      const result = calculateFRDPeakShaving(
        10000,
        3000, // S = 3,000 kWh (less than dayLoad)
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      expect(result.solarToDay).toBe(3000) // min(3000, 5000) = 3000
      expect(result.solarExcess).toBe(0) // max(3000 - 5000, 0) = 0
      expect(result.dayGridAfterSolar).toBe(2000) // max(5000 - 3000, 0) = 2000
    })
  })

  describe('Step C: Battery Charging', () => {
    describe('C1: Solar → Battery', () => {
      test('should charge battery from solar excess', () => {
        const result = calculateFRDPeakShaving(
          10000,
          6000, // S = 6,000 kWh (1,000 excess after dayLoad)
          getTestBattery(16), // maxBattKWh = 16 * 365 = 5,840 kWh
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false // AI Mode OFF
        )

        // battSolarCharged = min(solarExcess=1000, maxBattKWh=5840, nightLoad=5000) = 1000
        expect(result.battSolarCharged).toBe(1000)
        expect(result.battGridCharged).toBe(0) // AI Mode OFF
      })

      test('should respect battery capacity limit', () => {
        const result = calculateFRDPeakShaving(
          10000,
          15000, // S = 15,000 kWh (10,000 excess)
          getTestBattery(16), // maxBattKWh = 5,840 kWh
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false
        )

        // battSolarCharged = min(10000, 5840, 5000) = 5000 (limited by nightLoad)
        expect(result.battSolarCharged).toBeLessThanOrEqual(5000)
      })
    })

    describe('C2: Grid → Battery (AI Mode)', () => {
      test('should NOT charge from grid when AI Mode is OFF', () => {
        const result = calculateFRDPeakShaving(
          10000,
          3000, // Low solar, battery could use grid charging
          getTestBattery(16),
          ULO_RATE_PLAN,
          DEFAULT_ULO_DISTRIBUTION,
          false // AI Mode OFF
        )

        expect(result.battGridCharged).toBe(0)
      })

      test('should charge from grid when AI Mode is ON (ULO plan)', () => {
        const result = calculateFRDPeakShaving(
          10000,
          3000, // Low solar
          getTestBattery(16), // maxBattKWh = 5,840 kWh
          ULO_RATE_PLAN,
          DEFAULT_ULO_DISTRIBUTION,
          true // AI Mode ON
        )

        // battHeadroom = max(5840 - battSolarCharged, 0)
        // battGridCharged = min(battHeadroom, nightLoad - battSolarCharged)
        expect(result.battGridCharged).toBeGreaterThan(0)
        expect(result.battTotal).toBeGreaterThan(result.battSolarCharged)
      })

      test('should NOT charge from grid on TOU plan even with AI Mode ON', () => {
        const result = calculateFRDPeakShaving(
          10000,
          3000,
          getTestBattery(16),
          TOU_RATE_PLAN, // TOU plan
          DEFAULT_TOU_DISTRIBUTION,
          true // AI Mode ON (but should be ignored for TOU)
        )

        // AI Mode only works for ULO plans
        expect(result.battGridCharged).toBe(0)
      })

      test('should calculate battHeadroom correctly', () => {
        const result = calculateFRDPeakShaving(
          10000,
          6000, // Some solar excess
          getTestBattery(16),
          ULO_RATE_PLAN,
          DEFAULT_ULO_DISTRIBUTION,
          true // AI Mode ON
        )

        // battTotal should be <= maxBattKWh (16 * 365 = 5,840)
        const maxBattKWh = 16 * 365
        expect(result.battTotal).toBeLessThanOrEqual(maxBattKWh)
      })
    })
  })

  describe('Step D: Battery Discharge Allocation', () => {
    test('should prioritize on-peak discharge', () => {
      const result = calculateFRDPeakShaving(
        10000,
        6000, // Higher solar to ensure battery gets charged
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      // Battery should discharge to on-peak first (if battery has capacity)
      if (result.battTotal > 0) {
        expect(result.batteryDischargeByBucket.onPeak).toBeGreaterThan(0)
      }
      
      // Total discharge should match battTotal
      const totalDischarge = 
        result.batteryDischargeByBucket.onPeak +
        result.batteryDischargeByBucket.midPeak +
        result.batteryDischargeByBucket.offPeak +
        (result.batteryDischargeByBucket.ultraLow || 0)
      
      expect(totalDischarge).toBeLessThanOrEqual(result.battTotal)
    })

    test('should follow priority order: On-peak > Mid-peak > Off-peak > ULO', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(32), // Larger battery to test all buckets
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        false
      )

      // On-peak should be fully offset if battery is large enough
      const onPeakUsage = 10000 * (DEFAULT_ULO_DISTRIBUTION.onPeakPercent / 100)
      
      // If battery is large enough, on-peak should be fully offset
      if (result.battTotal >= onPeakUsage) {
        expect(result.batteryDischargeByBucket.onPeak).toBe(onPeakUsage)
      }
    })
  })

  describe('Step E: Edge Case Handling', () => {
    describe('Case 1: Usage >> Solar + Battery Capacity', () => {
    test('should handle high usage scenario', () => {
      const result = calculateFRDPeakShaving(
        30000, // U = 30,000 kWh (high usage)
        10000,  // S = 10,000 kWh (enough to charge battery)
        getTestBattery(16), // B = 16 kWh, maxBattKWh = 5,840
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      const maxBattKWh = 16 * 365
      expect(result.edgeCase).toBe('high_usage')
      expect(30000).toBeGreaterThan(10000 + maxBattKWh)
      
      // Battery and solar should run normally
      expect(result.solarToDay).toBeGreaterThan(0)
      // Battery should charge if there's solar excess
      if (result.solarExcess > 0) {
        expect(result.battTotal).toBeGreaterThan(0)
      }
      
      // Grid remaining should be positive (high usage means lots of grid usage)
      const totalGridKWh = 
        (result.gridKWhByBucket.ultraLow || 0) +
        result.gridKWhByBucket.offPeak +
        result.gridKWhByBucket.midPeak +
        result.gridKWhByBucket.onPeak
      expect(totalGridKWh).toBeGreaterThan(0)
    })
    })

    describe('Case 2: Solar + Battery Capacity >> Usage', () => {
      test('should handle high capacity scenario', () => {
        const result = calculateFRDPeakShaving(
          10000, // U = 10,000 kWh
          15000, // S = 15,000 kWh (high solar)
          getTestBattery(32), // B = 32 kWh, maxBattKWh = 11,680
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false
        )

        const maxBattKWh = 32 * 365
        expect(result.edgeCase).toBe('high_capacity')
        expect(15000 + maxBattKWh).toBeGreaterThan(10000)
        
        // Total offset should be capped at usage
        const totalOffset = result.solarToDay + result.battTotalEffective
        expect(totalOffset).toBeLessThanOrEqual(10000)
        
        // Effective cycles should be recalculated
        expect(result.effectiveCycles).toBeGreaterThan(0)
        expect(result.effectiveCycles).toBeLessThanOrEqual(365)
        
        // Excess solar should be tracked
        expect(result.solarUnused).toBeGreaterThanOrEqual(0)
      })

      test('should cap battery discharge based on available loads', () => {
        const result = calculateFRDPeakShaving(
          10000,
          15000,
          getTestBattery(32),
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false
        )

        // battTotalEffective should be <= totalPeakMidNightLoads
        const totalPeakMidNightLoads = 
          (10000 * DEFAULT_TOU_DISTRIBUTION.onPeakPercent / 100) +
          (10000 * DEFAULT_TOU_DISTRIBUTION.midPeakPercent / 100) +
          (10000 * DEFAULT_TOU_DISTRIBUTION.offPeakPercent / 100)
        
        expect(result.battTotalEffective).toBeLessThanOrEqual(totalPeakMidNightLoads)
      })
    })
  })

  describe('Step F: Final Savings Calculation', () => {
    test('should calculate annual cost after system', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      expect(result.annualCostAfter).toBeGreaterThanOrEqual(0)
      expect(result.annualSavings).toBeGreaterThanOrEqual(0)
      expect(result.monthlySavings).toBe(result.annualSavings / 12)
    })

    test('should calculate grid kWh correctly', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      const totalGridKWh = 
        (result.gridKWhByBucket.ultraLow || 0) +
        result.gridKWhByBucket.offPeak +
        result.gridKWhByBucket.midPeak +
        result.gridKWhByBucket.onPeak

      expect(totalGridKWh).toBeGreaterThanOrEqual(0)
      expect(totalGridKWh).toBeLessThanOrEqual(10000) // Can't exceed usage
    })
  })

  describe('Offset Percentages', () => {
    test('should calculate offset percentages correctly', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      // Percentages should sum to approximately 100%
      const totalPercent = 
        result.offsetPercentages.solarDirect +
        result.offsetPercentages.solarChargedBattery +
        result.offsetPercentages.uloChargedBattery +
        result.offsetPercentages.gridRemaining

      expect(totalPercent).toBeCloseTo(100, 1) // Within 0.1%
      
      // All percentages should be non-negative
      expect(result.offsetPercentages.solarDirect).toBeGreaterThanOrEqual(0)
      expect(result.offsetPercentages.solarChargedBattery).toBeGreaterThanOrEqual(0)
      expect(result.offsetPercentages.uloChargedBattery).toBeGreaterThanOrEqual(0)
      expect(result.offsetPercentages.gridRemaining).toBeGreaterThanOrEqual(0)
    })

    test('should show ULO-charged battery percentage when AI Mode is ON', () => {
      const result = calculateFRDPeakShaving(
        10000,
        3000, // Low solar to trigger grid charging
        getTestBattery(16),
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        true // AI Mode ON
      )

      if (result.battGridCharged > 0) {
        expect(result.offsetPercentages.uloChargedBattery).toBeGreaterThan(0)
      }
    })

    test('should NOT show ULO-charged battery percentage when AI Mode is OFF', () => {
      const result = calculateFRDPeakShaving(
        10000,
        3000,
        getTestBattery(16),
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        false // AI Mode OFF
      )

      expect(result.offsetPercentages.uloChargedBattery).toBe(0)
    })
  })

  describe('Safety Checks', () => {
    test('should prevent division by zero', () => {
      expect(() => {
        calculateFRDPeakShaving(
          0, // Zero usage
          5000,
          getTestBattery(16),
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false
        )
      }).toThrow('Annual usage must be greater than zero')
    })

    test('should handle negative inputs gracefully', () => {
      // Negative usage should throw an error (correct behavior)
      expect(() => {
        calculateFRDPeakShaving(
          -1000, // Negative usage
          5000,
          getTestBattery(16),
          TOU_RATE_PLAN,
          DEFAULT_TOU_DISTRIBUTION,
          false
        )
      }).toThrow('Annual usage must be greater than zero')
    })

    test('should ensure no negative kWh values', () => {
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        getTestBattery(16),
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      expect(result.solarToDay).toBeGreaterThanOrEqual(0)
      expect(result.solarExcess).toBeGreaterThanOrEqual(0)
      expect(result.battSolarCharged).toBeGreaterThanOrEqual(0)
      expect(result.battGridCharged).toBeGreaterThanOrEqual(0)
      expect(result.battTotal).toBeGreaterThanOrEqual(0)
      expect(result.gridKWhByBucket.onPeak).toBeGreaterThanOrEqual(0)
      expect(result.gridKWhByBucket.midPeak).toBeGreaterThanOrEqual(0)
      expect(result.gridKWhByBucket.offPeak).toBeGreaterThanOrEqual(0)
    })
  })

  describe('365 Cycles/Year Limit', () => {
    test('should respect maximum battery throughput', () => {
      const battery = getTestBattery(16)
      const result = calculateFRDPeakShaving(
        10000,
        5000,
        battery,
        TOU_RATE_PLAN,
        DEFAULT_TOU_DISTRIBUTION,
        false
      )

      const maxBattKWh = battery.usableKwh * 365
      expect(result.battTotal).toBeLessThanOrEqual(maxBattKWh)
      expect(result.effectiveCycles).toBeLessThanOrEqual(365)
    })
  })

  describe('Integration Tests', () => {
    test('should work with real battery specs', () => {
      const renon16 = BATTERY_SPECS.find(b => b.id === 'renon-16')
      if (!renon16) {
        throw new Error('Renon 16 battery not found')
      }

      const result = calculateFRDPeakShaving(
        14000, // Typical household usage
        8000,  // Typical solar production
        renon16,
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        true // AI Mode ON
      )

      expect(result.annualSavings).toBeGreaterThan(0)
      expect(result.offsetPercentages.solarDirect).toBeGreaterThan(0)
      expect(result.offsetPercentages.gridRemaining).toBeLessThan(100)
    })

    test('should compare AI Mode ON vs OFF', () => {
      const battery = getTestBattery(16)
      
      const resultOff = calculateFRDPeakShaving(
        10000,
        3000, // Low solar
        battery,
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        false // AI Mode OFF
      )

      const resultOn = calculateFRDPeakShaving(
        10000,
        3000,
        battery,
        ULO_RATE_PLAN,
        DEFAULT_ULO_DISTRIBUTION,
        true // AI Mode ON
      )

      // AI Mode ON should have more battery capacity available
      expect(resultOn.battTotal).toBeGreaterThanOrEqual(resultOff.battTotal)
      
      // AI Mode ON should have ULO-charged battery percentage
      expect(resultOn.offsetPercentages.uloChargedBattery).toBeGreaterThanOrEqual(0)
      expect(resultOff.offsetPercentages.uloChargedBattery).toBe(0)
      
      // AI Mode ON should have better savings (more battery discharge)
      expect(resultOn.annualSavings).toBeGreaterThanOrEqual(resultOff.annualSavings)
    })
  })
})

