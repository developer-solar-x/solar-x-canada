// Features section showcasing key benefits

import { Zap, Shield, MapPin, Users } from 'lucide-react'

export function Features() {
  // Feature cards data
  const features = [
    {
      icon: Zap,
      iconBg: 'bg-red-500',
      title: '60-Second Estimates',
      description: 'Advanced satellite imagery and AI-powered calculations deliver accurate solar potential instantly.',
    },
    {
      icon: Shield,
      iconBg: 'bg-navy-500',
      title: '100% Free, No Commitments',
      description: 'Explore your solar options with zero pressure. No credit card required, ever.',
    },
    {
      icon: MapPin,
      iconBg: 'bg-blue-500',
      title: 'Local Knowledge Matters',
      description: 'We understand Ontario incentives, weather patterns, and regulations inside-out.',
    },
    {
      icon: Users,
      iconBg: 'bg-red-500',
      title: 'White-Glove Service',
      description: 'From estimate to installation to monitoring, we\'re with you every step.',
    },
  ]

  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16 space-y-4">
          <p className="eyebrow text-red-500">WHY GO SOLAR</p>
          <h2 className="heading-lg">The Modern Way to Go Solar</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've streamlined the solar journey from estimate to installation
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-hover group"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon circle */}
              <div className={`${feature.iconBg} w-16 h-16 rounded-full flex items-center justify-center mb-6`}>
                <feature.icon className="text-white" size={32} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-navy-500 mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

