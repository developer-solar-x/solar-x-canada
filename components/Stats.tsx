'use client'

// Statistics section with animated counters

import { useEffect, useRef, useState } from 'react'
import { Calculator, DollarSign, Star, Zap } from 'lucide-react'
import CountUp from 'react-countup'

export function Stats() {
  // Track if component is in viewport for animation
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for triggering animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  // Statistics data
  const stats = [
    {
      icon: Calculator,
      value: 10000,
      suffix: '+',
      label: 'Estimates Generated',
      iconBg: 'bg-sky-500',
    },
    {
      icon: DollarSign,
      value: 2.5,
      suffix: 'M+',
      label: 'In Projected Savings',
      iconBg: 'bg-maple-500',
      prefix: '$',
    },
    {
      icon: Star,
      value: 4.9,
      suffix: '/5',
      label: 'Average Rating',
      iconBg: 'bg-yellow-500',
      decimals: 1,
    },
    {
      icon: Zap,
      value: 500,
      suffix: '+',
      label: 'Systems Installed',
      iconBg: 'bg-forest-500',
    },
  ]

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statistics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon */}
              <div className={`${stat.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="text-white" size={32} />
              </div>

              {/* Number with counter animation */}
              <div className="text-4xl md:text-5xl font-bold text-forest-500 mb-2 font-display">
                {isVisible ? (
                  <CountUp
                    end={stat.value}
                    duration={2}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    separator=","
                  />
                ) : (
                  '0'
                )}
              </div>

              {/* Label */}
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

