'use client'

// Contact/Support page with simple form

import { useState, FormEvent } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Success
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setError(null)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Have questions? We're here to help. Reach out and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="heading-lg mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Whether you have questions about our calculator, need help with an estimate, or want to learn more about our platform, we're here to assist you.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500 mb-1">Email</h3>
                    <a
                      href="mailto:info@solarcalculatorcanada.org"
                      className="text-gray-700 hover:text-forest-500 transition-colors"
                    >
                      info@solarcalculatorcanada.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500 mb-1">Phone</h3>
                    <a
                      href="tel:1-800-555-1234"
                      className="text-gray-700 hover:text-forest-500 transition-colors"
                    >
                      1-800-555-1234
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8am-6pm EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500 mb-1">Address</h3>
                    <p className="text-gray-700">
                      123 Solar Street<br />
                      Toronto, ON M5V 3A8<br />
                      Canada
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-sky-50 rounded-xl border border-sky-100">
                <h3 className="font-bold text-forest-500 mb-2">Response Time</h3>
                <p className="text-gray-700 text-sm">
                  We typically respond to inquiries within 24-48 hours during business days. For urgent matters, please call us directly.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="heading-lg mb-6">Send Us a Message</h2>
              
              {submitted ? (
                <div className="bg-forest-50 border-2 border-forest-500 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-forest-500 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setError(null)
                    }}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-maple-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-maple-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject <span className="text-maple-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="calculator-question">Calculator Question</option>
                      <option value="installer-inquiry">Installer Inquiry</option>
                      <option value="general-question">General Question</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message <span className="text-maple-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full h-14 text-lg inline-flex items-center justify-center"
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="mr-2" size={20} />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    <span className="text-maple-500">*</span> Required fields
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

