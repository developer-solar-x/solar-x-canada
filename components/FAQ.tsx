'use client'

// FAQ accordion section - SEO/AEO optimized for Canadian solar searches

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Script from 'next/script'

export function FAQ() {
  // Track which FAQ item is open (only one at a time)
  // Initialize to null to prevent hydration mismatch
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // FAQ questions and answers - Optimized for Canadian solar search intent
  const faqs = [
    {
      question: 'How much does solar cost in Canada?',
      answer: 'In Canada, solar panel installation costs average $2.40 to $3.30 per watt for monocrystalline panels. A typical 5 kW residential system costs $12,000 to $17,500, while a 10 kW system ranges from $24,000 to $35,000. Costs vary by province: Ontario averages $2.42–$3.05/W, Alberta $2.40–$3.02/W, and other provinces $2.60–$3.27/W. These prices typically include installation, permits, and equipment. Available federal and provincial rebates (like Ontario\'s HRS program) can reduce your net cost by thousands.',
    },
    {
      question: 'What is Canada\'s federal solar tax credit?',
      answer: 'Canada offers a federal Clean Technology Investment Tax Credit (ITC) of 30% for residential and commercial solar systems. This credit applies to eligible solar panel installations and can significantly reduce your upfront cost. For example, on a $15,000 system, you could claim a $4,500 federal credit. Businesses can also combine this with accelerated depreciation to achieve up to 55% first-year write-off. Verify your system\'s eligibility with the Canada Revenue Agency (CRA) before installation.',
    },
    {
      question: 'Are solar panels worth it in Canada?',
      answer: 'Yes, solar is increasingly valuable in Canada. Most homeowners achieve payback in 6–10 years, then enjoy 15–30 years of free electricity (panels last 25+ years). Canada receives 1,000–1,600 sun hours annually—comparable to Germany, a global solar leader. Panels perform better in cooler climates, making Canada ideal. ROI improves with rising electricity rates; Ontario rates have increased 12.8% since 2016. Combined with rebates, net metering, and tax credits, solar delivers strong financial returns.',
    },
    {
      question: 'How does Ontario solar net metering work?',
      answer: 'Ontario offers net metering for grid-connected solar systems, allowing you to send excess energy back to the grid and receive credits. The Ultra-Low Overnight (ULO) rate structure (39.1¢/kWh peak, 3¢/kWh off-peak) creates peak-shaving opportunities: charge a battery during cheap overnight hours, discharge during expensive peak hours. This arbitrage maximizes savings. All generated power reduces your grid consumption, and credits offset future consumption. The Home Renovation Savings (HRS) program provides up to $10,000 back ($5k solar + $5k battery).',
    },
    {
      question: 'What is Alberta\'s Solar Club?',
      answer: 'Alberta\'s Solar Club™ allows members to switch between high export rates (30¢/kWh) in summer to sell surplus energy and low import rates (~8¢/kWh) in winter. This dynamic rate structure maximizes year-round solar savings. Alberta also offers municipal Clean Energy Improvement Program (CEIP) financing in 27+ cities with rates as low as 1.62–3% and rebates up to $2,100. Alberta\'s 2,300–2,600 annual sun hours and deregulated energy market make it Canada\'s solar powerhouse.',
    },
    {
      question: 'What is CEIP solar financing?',
      answer: 'CEIP (Clean Energy Improvement Program) is property-tax-attached financing available in Alberta municipalities. Unlike personal loans, financing attaches to your property tax bill, not your credit. Benefits: low interest rates (1.62–6%), rebates ($350–$2,100), and portability across property changes. Available in 27+ Alberta cities including Calgary, Edmonton, Lethbridge. Some municipalities offer 0% financing on the first 73% of costs (Leduc) or 100% financing (Strathcona at 2%). Compare municipal programs via our calculator.',
    },
    {
      question: 'Do solar panels work in Canada\'s winter?',
      answer: 'Yes. While winter days are shorter, solar panels generate electricity year-round as long as there\'s daylight and clear conditions. Cold temperatures actually improve panel efficiency (~15–20% more efficient than in heat). Snow typically slides off angled panels within days, or you can gently clear it. Canada\'s winter production is 20–30% of annual total. Modern systems are designed for Canadian snow loads, wind, and temperature swings. Your installer ensures proper structural design.',
    },
    {
      question: 'What are the best provinces for solar in Canada?',
      answer: 'Top solar provinces: (1) Alberta – highest sun hours (1,400–1,600/year), Solar Club rates, CEIP programs. (2) Saskatchewan – excellent sun hours (1,400–1,600/year), growing market. (3) Ontario – strong incentives (HRS rebate), net metering, ULO rates, competitive pricing. (4) Nova Scotia – SolarHomes Program, business rebates up to $30K. (5) British Columbia – moderate-high potential, rebates, net metering. Northern regions (Nunavut, NWT) cost $4+/W due to logistics; best suited to remote off-grid applications.',
    },
    {
      question: 'How long do solar panels last?',
      answer: 'Modern solar panels last 25–30 years or longer. Most manufacturers warrant 80–90% output after 25 years, with annual degradation of ~0.6%. In Canada, panels degrade more slowly due to cooler temperatures. A well-maintained system will produce electricity for 40+ years. Balance-of-system components (inverters, wiring) may need replacement after 10–15 years. Total lifetime savings easily exceed 15–20x the initial investment, making long lifespan one of solar\'s greatest advantages.',
    },
    {
      question: 'What are solar panel installation costs broken down?',
      answer: 'Typical installation cost breakdown: (1) Solar panels 50–60%, (2) Labor 20–30%, (3) Inverter & balance-of-system 10–15%, (4) Permits & interconnection 5–10%. Material costs include panels, mounting hardware, wiring, and safety disconnects. Labor includes roof work, electrical connections, and integration with your grid or battery. Permits (building, ESA, utility) vary by municipality; Toronto requires REA approval ($1,000 fee) for Class 3 systems. Our calculator provides a localized breakdown.',
    },
    {
      question: 'How do I get solar quotes in Canada?',
      answer: 'Use our free solar calculator, solar power calculator, and solar PV calculator to get an unbiased estimate based on your address, roof, and usage. Our solar panel calculator, solar electricity calculator, and solar installation calculator help with calculating solar power needs. Then (optionally) be matched with vetted local installers who provide detailed quotes accounting for your roof condition, electrical panel, shading, and local permitting. Use our solar photovoltaic calculator and solar array calculator to compare 2–3 quotes. Ask installers about certifications (ESA or provincial), insurance, warranty terms, and experience in your province.',
    },
    {
      question: 'What is the HRS rebate in Ontario?',
      answer: 'Ontario\'s Home Renovation Savings (HRS) program provides up to $10,000 rebate: $5,000 for solar (zero-export systems) and $5,000 for battery storage. Eligibility requires a zero-export system that keeps all generated power on-site. Zero-export systems use smart controls to prevent exporting to the grid, maximizing self-consumption. Businesses can stack HRS with federal ITC for larger rebates, up to $860,000 for load displacement systems. Verify eligibility before installation.',
    },
    {
      question: 'What is the best solar panel type?',
      answer: 'Monocrystalline panels ($2.40–$3.50/W) are best for most Canadian homes: highest efficiency (18–23%), durability, and sleek appearance. Polycrystalline ($2.00–$2.80/W) offer moderate efficiency (15–17%) at lower cost. Thin-film ($1.70–$2.40/W) are cheapest but less efficient (10–15%) and shorter-lived. Building-integrated PV (BIPV, $3–$4.50/W) integrates into facades and windows for aesthetic appeal. Solar shingles ($4–$7/W) are premium but expensive. For Canadian climate, monocrystalline outperforms over 25+ year lifespan.',
    },
    {
      question: 'How much can I save with solar in Canada?',
      answer: 'Lifetime savings depend on system size and location. A typical 5 kW system saves $50,000–$100,000+ over 25 years in Ontario (with rising rates). Alberta systems save similarly with Solar Club rates. Savings increase annually as utility rates rise (Ontario up 12.8% since 2016). Net metering and time-of-use rates amplify savings. Federal 30% ITC, provincial rebates, and battery storage (peak shaving) further improve returns. Our solar calculator, solar power calculator, solar PV calculator, and solar installation calculator show personalized savings. Use our solar electricity calculator and solar panel calculator for calculating solar power and estimated returns based on your address, roof, and usage.',
    },
    {
      question: 'What is the solar permit process in Canada?',
      answer: 'Provincial and municipal permits vary. Typical requirements: (1) Building permit – structural/electrical review. (2) ESA (Electrical Safety Authority) permit – Ontario and select provinces. (3) Utility approval – interconnection agreement. (4) Zoning review – especially for ground mounts. (5) REA (Renewable Energy Approval) – Ontario, $1,000 fee for Class 3 systems (<500 kW). Timeline: 4–8 weeks. Your installer handles most paperwork. Toronto adds specific requirements (zoning bylaw, utility compliance). Budget 2–6 weeks for total permitting.',
    },
    {
      question: 'Can I get solar financing in Canada?',
      answer: 'Yes, multiple options: (1) Personal loans – unsecured, quick approval. (2) Home equity line of credit (HELOC) – lower rates, higher amounts. (3) CEIP property-tax financing (Alberta) – 0–6%, attaches to tax bill. (4) Installer financing – some offer in-house or partner programs. (5) Canada Greener Homes Loan – federal program (up to $40K, 0% for first 3 years). (6) Rebates reduce financed amount (Ontario HRS: up to $10K back). Compare all options before choosing; lower rates significantly improve ROI.',
    },
    {
      question: 'What is the solar installation timeline in Canada?',
      answer: 'Typical timeline: (1) Estimate & permitting – 4–8 weeks (largest variable). (2) Equipment ordering – 2–4 weeks. (3) Installation – 1–3 days (weather dependent). (4) Inspection & utility approval – 2–6 weeks. Total: 2–4 months from contract to system activation. Permitting takes longest due to municipal review and utility interconnection. Winter weather may delay installations. Your installer will provide a realistic timeline based on your location and local authority processing times.',
    },
    {
      question: 'How does battery storage improve solar ROI?',
      answer: 'Batteries ($700–$2,000/kWh installed) enable peak shaving and backup power. In time-of-use markets (Ontario ULO), charge during cheap hours (3¢/kWh), discharge during peak (39.1¢/kWh)—arbitrage gains. A 10 kWh lithium-ion battery costs $7K–$20K but can add $5K–$10K annual value through peak shaving alone. Plus, backup power prevents outages, valuable insurance. Federal 30% ITC and Ontario HRS ($5K rebate) improve payback. Battery-plus-solar systems typically pay back in 8–12 years, then provide free energy + resilience.',
    },
    {
      question: 'What solar companies are available in Canada?',
      answer: 'Canada has 1000s of installers ranging from large national firms to local specialists. Our platform vets installers by certifications (ESA/provincial), insurance, experience, and customer reviews. We partner with quality installers in Ontario and growing network in Alberta. Other reputable national/regional installers include Canadian Solar, Sunrun Canada, Solarmax, and regional specialists. Always verify credentials, warranties, and reviews. Avoid lowest-bidder approach; focus on reliability, warranty, and long-term support.',
    },
    {
      question: 'Is solar DIY possible in Canada?',
      answer: 'Full DIY is rare and discouraged in Canada due to code complexity. Challenges: (1) Safety – 600V DC systems; electrical code compliance mandatory. (2) Permitting – ESA, building permits required; jurisdictions won\'t approve unlicensed work. (3) Warranty – most manufacturers void warranty if not installed by certified electricians. (4) Grid interconnection – utilities require licensed electrician sign-off. A licensed electrician must sign-off final work even if you help. Cost savings rarely justify complexity and liability. Professional installation recommended.',
    },
  ]

  // FAQ schema for search engines
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title block */}
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Your Questions, Answered</h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about going solar in Canada
            </p>
          </div>

          {/* Accordion items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-xl transition-all ${
                  openIndex === index
                    ? 'border-l-4 border-l-maple-500 bg-sky-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Question row - clickable */}
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  suppressHydrationWarning
                >
                  <span
                    className={`text-lg font-semibold pr-8 ${
                      openIndex === index ? 'text-forest-500' : 'text-gray-800'
                    }`}
                  >
                    {faq.question}
                  </span>
                
                <ChevronDown
                  className={`flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180 text-maple-500' : 'text-gray-400'
                  }`}
                  size={24}
                />
              </button>

              {/* Answer panel - expandable */}
              {openIndex === index && (
                <div className="px-6 pb-5 animate-fade-in">
                  <p className="text-gray-700 leading-relaxed text-base">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  )
}

