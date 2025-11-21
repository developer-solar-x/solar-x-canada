// Features section showcasing key benefits

import { Zap, Shield, MapPin, Users } from 'lucide-react'

export function Features() {
  // Feature cards data
  const features = [
    {
      icon: Zap,
      iconBg: 'bg-maple-500',
      title: 'Unbiased Calculator',
      description: 'Trusted, neutral solar savings calculator with transparent data. No sales pressure, just honest estimates.',
    },
    {
      icon: Shield,
      iconBg: 'bg-forest-500',
      title: 'Vetted Installers',
      description: 'All installers are carefully vetted for certifications, insurance, and experience. Quality guaranteed.',
    },
    {
      icon: MapPin,
      iconBg: 'bg-sky-500',
      title: 'Double Warranty',
      description: 'Enjoy protection from both installer warranties and our platform guarantee for complete peace of mind.',
    },
    {
      icon: Users,
      iconBg: 'bg-maple-500',
      title: 'Consumer Protection',
      description: 'Independent platform focused on your best interests. Transparent matching, no hidden fees.',
    },
  ]

  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16 space-y-4">
          <p className="eyebrow text-maple-500">WHY CHOOSE US</p>
          <h2 className="heading-lg">Independent, Transparent, Trusted</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            An unbiased platform connecting Canadian homeowners with vetted solar installers
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
              <h3 className="text-xl font-bold text-forest-500 mb-3">
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

