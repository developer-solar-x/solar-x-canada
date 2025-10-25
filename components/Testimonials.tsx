// Testimonials section with customer reviews

import { Star } from 'lucide-react'

export function Testimonials() {
  // Customer testimonials data
  const testimonials = [
    {
      quote: "SolarX made going solar effortless. The estimate was spot-on, and we're now saving $180/month!",
      name: 'Sarah M.',
      location: 'Toronto, ON',
      system: '8.5 kW system',
      installed: 'May 2024',
      initial: 'S',
      bgColor: 'bg-blue-500',
    },
    {
      quote: "Best decision for our home! The team was professional, and the ROI is incredible.",
      name: 'David L.',
      location: 'Ottawa, ON',
      system: '6.2 kW system',
      installed: 'March 2024',
      initial: 'D',
      bgColor: 'bg-red-500',
    },
    {
      quote: "From estimate to installation took only 3 months. Couldn't be happier with SolarX!",
      name: 'Maria K.',
      location: 'Mississauga, ON',
      system: '10.1 kW system',
      installed: 'June 2024',
      initial: 'M',
      bgColor: 'bg-navy-500',
    },
  ]

  return (
    <section className="py-20 bg-navy-500 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-64 h-64 border-2 border-white rounded-full" />
        <div className="absolute bottom-10 left-10 w-96 h-96 border-2 border-white rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
            Join Thousands of Happy Homeowners
          </h2>
        </div>

        {/* Testimonial cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* 5 stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-red-500 fill-current" size={20} />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 italic text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Customer info */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                {/* Avatar */}
                <div className={`${testimonial.bgColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                  {testimonial.initial}
                </div>

                {/* Details */}
                <div>
                  <div className="font-bold text-navy-500">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.location}
                  </div>
                  <div className="text-xs text-gray-500">
                    {testimonial.system} • Installed {testimonial.installed}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

