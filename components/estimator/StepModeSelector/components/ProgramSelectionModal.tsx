'use client'

import { Sun, BatteryCharging, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface ProgramSelectionModalProps {
  isOpen: boolean
  onSelect: (programType: 'net_metering' | 'hrs_residential' | 'quick', leadType: 'residential' | 'commercial', hasBattery?: boolean) => void
  onClose?: () => void
  isQuickEstimate?: boolean
  estimatorMode?: 'easy' | 'detailed' | null
}

export function ProgramSelectionModal({ isOpen, onSelect, onClose, isQuickEstimate = false, estimatorMode = null }: ProgramSelectionModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<'net_metering' | 'hrs_residential' | null>(null)
  const [hasBattery, setHasBattery] = useState<boolean | null>(null)
  const [showLeadTypeSelection, setShowLeadTypeSelection] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [questionAnswers, setQuestionAnswers] = useState<{
    seasonal?: boolean
    nightUsage?: boolean
    steadyUsage?: boolean
    yearRound?: boolean
    wantsRebates?: boolean
    wantsControl?: boolean
  }>({})
  const [skippedQuestions, setSkippedQuestions] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedBatteryOption, setSelectedBatteryOption] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset state when modal opens
      setSelectedProgram(null)
      setHasBattery(null)
      setShowLeadTypeSelection(false)
      setShowQuestionForm(false)
      setQuestionAnswers({})
      setCurrentQuestionIndex(0)
      setSkippedQuestions(false)
      setSelectedBatteryOption(null)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  // Questions for both quick estimate and detailed analysis modes
  const questions = estimatorMode ? [
    {
      id: 'residency',
      question: 'How often do you live in this home?',
      options: [
        { label: 'Seasonally (part of the year)', value: 'seasonal', points: { netMetering: 1 } },
        { label: 'Year-round', value: 'yearRound', points: { loadDisplacement: 1 } }
      ]
    },
    {
      id: 'usagePattern',
      question: 'When do you use most of your electricity?',
      options: [
        { label: 'Mostly at night', value: 'nightUsage', points: { netMetering: 1 } },
        { label: 'Steady throughout the day', value: 'steadyUsage', points: { loadDisplacement: 1 } }
      ]
    },
    {
      id: 'rebates',
      question: 'Are you interested in solar + battery rebates (up to $10,000 CAD)?',
      options: [
        { label: 'Yes', value: 'wantsRebates', points: { loadDisplacement: 1 } },
        { label: 'Not a priority', value: 'noRebates', points: {} }
      ]
    },
    {
      id: 'control',
      question: 'Do you want more control over when your power is used?',
      options: [
        { label: 'Yes', value: 'wantsControl', points: { loadDisplacement: 1 } },
        { label: 'Not necessary', value: 'noControl', points: {} }
      ]
    }
  ] : []
  
  const handleQuestionAnswer = (questionId: string, answerValue: string) => {
    if (questions.length === 0) return
    
    const question = questions.find(q => q.id === questionId)
    const option = question?.options.find(o => o.value === answerValue)
    
    setQuestionAnswers(prev => ({
      ...prev,
      [answerValue === 'seasonal' ? 'seasonal' : answerValue === 'yearRound' ? 'yearRound' : 
       answerValue === 'nightUsage' ? 'nightUsage' : answerValue === 'steadyUsage' ? 'steadyUsage' :
       answerValue === 'wantsRebates' ? 'wantsRebates' : 'wantsControl']: true
    }))
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered, show recommendations
      setShowQuestionForm(false)
    }
  }
  
  // Calculate recommendation based on answers
  const calculateRecommendation = () => {
    let netMeteringScore = 0
    let loadDisplacementScore = 0
    
    questions.forEach(question => {
      const answerKey = Object.keys(questionAnswers).find(key => 
        question.options.some(opt => opt.value === key && questionAnswers[key as keyof typeof questionAnswers])
      )
      if (answerKey) {
        const option = question.options.find(opt => opt.value === answerKey)
        if (option?.points?.netMetering) netMeteringScore += option.points.netMetering
        if (option?.points?.loadDisplacement) loadDisplacementScore += option.points.loadDisplacement
      }
    })
    
    return loadDisplacementScore > netMeteringScore ? 'loadDisplacement' : 'netMetering'
  }

  const handleBatterySelect = (wantsBattery: boolean) => {
    setSelectedBatteryOption(wantsBattery)
  }

  const handleContinue = () => {
    if (selectedBatteryOption !== null) {
      setHasBattery(selectedBatteryOption)
      setShowLeadTypeSelection(true)
    }
  }

  const handleProgramSelect = (programType: 'net_metering' | 'hrs_residential') => {
    setSelectedProgram(programType)
    setShowLeadTypeSelection(true)
  }

  const handleLeadTypeSelect = (leadType: 'residential' | 'commercial') => {
    // If hasBattery is set (from questions flow), use it for both modes
    if (hasBattery !== null) {
      const programType = hasBattery ? 'hrs_residential' : 'net_metering'
      // Enforce: net metering always means no battery
      const finalHasBattery = programType === 'net_metering' ? false : hasBattery
      onSelect(programType, leadType, finalHasBattery)
    } else if (selectedProgram) {
      // For detailed mode without questions: selectedProgram determines program type
      const hasBatteryValue = selectedProgram === 'hrs_residential'
      onSelect(selectedProgram, leadType, hasBatteryValue)
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {}} // Prevent closing on backdrop click - user must select
      />
      
      {/* Modal container */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-navy-500">
              {showLeadTypeSelection 
                ? 'Select Property Type' 
                : showQuestionForm && estimatorMode
                  ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
                  : estimatorMode === 'easy'
                    ? 'Which Solar Option Fits Your Home Best?'
                    : estimatorMode === 'detailed'
                      ? 'Which Solar Option Fits Your Home Best?'
                      : 'Select Program Type'}
            </h3>
            <div className="flex items-center gap-3">
              {showQuestionForm && estimatorMode && (
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(prev => prev - 1)
                      // Remove the last answered question
                      const prevQuestionId = questions[currentQuestionIndex - 1].id
                      const prevQuestion = questions[currentQuestionIndex - 1]
                      const prevAnswerKey = Object.keys(questionAnswers).find(key => 
                        prevQuestion.options.some(opt => opt.value === key && questionAnswers[key as keyof typeof questionAnswers])
                      )
                      if (prevAnswerKey) {
                        setQuestionAnswers(prev => {
                          const updated = { ...prev }
                          delete updated[prevAnswerKey as keyof typeof updated]
                          return updated
                        })
                      }
                    } else {
                      setShowQuestionForm(false)
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
              )}
              {showLeadTypeSelection && (
                <button
                  onClick={() => {
                    setShowLeadTypeSelection(false)
                    setHasBattery(null)
                    setSelectedProgram(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {!showLeadTypeSelection ? (
              <>
                {estimatorMode && showQuestionForm && currentQuestionIndex < questions.length ? (
                  <>
                    {/* Question Form */}
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                        {questions[currentQuestionIndex]?.question}
                      </h4>
                      <div className="space-y-3">
                        {questions[currentQuestionIndex]?.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuestionAnswer(questions[currentQuestionIndex].id, option.value)}
                            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                          >
                            <div className="font-medium text-gray-800">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : estimatorMode && questions.length > 0 && Object.keys(questionAnswers).length === questions.length && !showQuestionForm ? (
                  <>
                    {/* Show Recommendation after questions */}
                    <div className="mb-6">
                      <p className="text-gray-700 mb-4 text-center">
                        Based on your answers, we recommend:
                      </p>
                      {(() => {
                        const recommendation = calculateRecommendation()
                        const recommendedHasBattery = recommendation === 'loadDisplacement'
                        return (
                          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-12 h-12 rounded-lg ${recommendedHasBattery ? 'bg-navy-500' : 'bg-blue-500'} flex items-center justify-center`}>
                                {recommendedHasBattery ? <BatteryCharging className="text-white" size={24} /> : <Sun className="text-white" size={24} />}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800 text-lg">
                                  {recommendedHasBattery ? 'HRS (Load Displacement)' : 'Net Metering'}
                                </div>
                                <div className="text-sm text-gray-600">Recommended for you</div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                      <p className="text-gray-600 mb-6 text-center text-sm">
                        You can also choose the other option if you prefer
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* HRS (Load Displacement) */}
                      {(() => {
                        const recommendation = calculateRecommendation()
                        const isRecommended = recommendation === 'loadDisplacement'
                        return (
                          <button
                            onClick={() => handleBatterySelect(true)}
                            className={`p-6 rounded-xl border-2 transition-all text-left group ${
                              selectedBatteryOption === true
                                ? 'border-navy-500 bg-navy-50 shadow-md ring-2 ring-navy-500 ring-offset-2' 
                                : isRecommended 
                                ? 'border-navy-500 bg-navy-50 shadow-md' 
                                : 'border-gray-300 bg-white hover:border-navy-500 hover:bg-navy-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-navy-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BatteryCharging className="text-white" size={24} />
                              </div>
                              <div className="font-semibold text-gray-800 text-lg">HRS (Load Displacement)</div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-2">
                              <p>Solar + battery system</p>
                              <p>• Store energy for peak hours</p>
                              <p>• Reduce electricity costs</p>
                              <p>• Up to $10,000 CAD in rebates</p>
                              {isRecommended && (
                                <p className="text-blue-600 font-semibold mt-2">✓ Recommended for you</p>
                              )}
                            </div>
                          </button>
                        )
                      })()}
                      
                      {/* Net Metering */}
                      {(() => {
                        const recommendation = calculateRecommendation()
                        const isRecommended = recommendation === 'netMetering'
                        return (
                          <button
                            onClick={() => handleBatterySelect(false)}
                            className={`p-6 rounded-xl border-2 transition-all text-left group ${
                              selectedBatteryOption === false
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500 ring-offset-2' 
                                : isRecommended 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sun className="text-white" size={24} />
                              </div>
                              <div className="font-semibold text-gray-800 text-lg">Net Metering</div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-2">
                              <p>Solar-only system</p>
                              <p>• Lower upfront cost</p>
                              <p>• Earn credits for excess energy</p>
                              <p>• Ideal for quick savings estimate</p>
                              {isRecommended && (
                                <p className="text-blue-600 font-semibold mt-2">✓ Recommended for you</p>
                              )}
                            </div>
                          </button>
                        )
                      })()}
                    </div>
                    
                    {/* Continue Button */}
                    <div className="mt-6">
                      <button
                        onClick={handleContinue}
                        disabled={selectedBatteryOption === null}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                          selectedBatteryOption !== null
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Continue
                      </button>
                      {selectedBatteryOption === null && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          Please select one of the options above to continue
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          setQuestionAnswers({})
                          setCurrentQuestionIndex(0)
                          setShowQuestionForm(true)
                          setSelectedBatteryOption(null)
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Retake questions
                      </button>
                    </div>
                  </>
                ) : estimatorMode && skippedQuestions ? (
                  <>
                    {/* Direct Program Selection (when skipping questions) */}
                    <p className="text-gray-700 mb-6 text-center">
                      Select your preferred program type
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* HRS (Load Displacement) */}
                      <button
                        onClick={() => handleBatterySelect(true)}
                        className={`p-6 rounded-xl border-2 transition-all text-left group ${
                          selectedBatteryOption === true
                            ? 'border-navy-500 bg-navy-50 shadow-md ring-2 ring-navy-500 ring-offset-2'
                            : 'border-gray-300 bg-white hover:border-navy-500 hover:bg-navy-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-navy-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BatteryCharging className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">HRS (Load Displacement)</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar + battery system</p>
                          <p>• Store energy for peak hours</p>
                          <p>• Reduce electricity costs</p>
                          <p>• Up to $10,000 CAD in rebates</p>
                        </div>
                      </button>
                      
                      {/* Net Metering */}
                      {/* Note: Province is not yet known at this stage (address is captured in Location step).
                          For Alberta users, Alberta Solar Club rates and messaging will appear in StepNetMetering. */}
                      <button
                        onClick={() => handleBatterySelect(false)}
                        className={`p-6 rounded-xl border-2 transition-all text-left group ${
                          selectedBatteryOption === false
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500 ring-offset-2'
                            : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sun className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">Net Metering</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar-only system</p>
                          <p>• Lower upfront cost</p>
                          <p>• Earn credits for excess energy</p>
                          <p>• Ideal for quick savings estimate</p>
                        </div>
                      </button>
                    </div>
                    
                    {/* Continue Button */}
                    <div className="mt-6">
                      <button
                        onClick={handleContinue}
                        disabled={selectedBatteryOption === null}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                          selectedBatteryOption !== null
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Continue
                      </button>
                      {selectedBatteryOption === null && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          Please select one of the options above to continue
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => {
                          setQuestionAnswers({})
                          setCurrentQuestionIndex(0)
                          setSkippedQuestions(false)
                          setShowQuestionForm(true)
                          setSelectedBatteryOption(null)
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Answer questions to get a recommendation instead
                      </button>
                    </div>
                  </>
                ) : estimatorMode ? (
                  <>
                    {/* Initial Screen - Start Questions */}
                    <p className="text-gray-700 mb-6 text-center">
                      Answer a few quick questions to find the best solar program for your home
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => {
                          setShowQuestionForm(true)
                          setCurrentQuestionIndex(0)
                          setQuestionAnswers({})
                        }}
                        className="w-full max-w-md px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Start Questions
                      </button>
                      <button
                        onClick={() => {
                          // Skip questions and show program selection directly
                          setSkippedQuestions(true)
                          setShowQuestionForm(false)
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Skip and choose directly
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Detailed Analysis: Program Options */}
                    <p className="text-gray-700 mb-6 text-center">
                      Select your preferred program type
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Solar+Battery HRS Program */}
                      <button
                        onClick={() => handleProgramSelect('hrs_residential')}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-navy-500 hover:bg-navy-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-navy-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BatteryCharging className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">Solar+Battery HRS Program</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar + battery system</p>
                          <p>• Store energy for peak hours</p>
                          <p>• Reduce electricity costs</p>
                          <p>• Up to $10,000 CAD in rebates</p>
                        </div>
                      </button>
                      
                      {/* Net Metering */}
                      {/* Note: Province is not yet known at this stage (address is captured in Location step).
                          For Alberta users, Alberta Solar Club rates and messaging will appear in StepNetMetering. */}
                      <button
                        onClick={() => handleProgramSelect('net_metering')}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sun className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">Net Metering</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar-only system</p>
                          <p>• Sell excess energy to grid</p>
                          <p>• Lower upfront cost</p>
                          <p>• Earn export credits</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-6 text-center">
                  Is this a residential or commercial property?
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Residential Option */}
                  <button
                    onClick={() => handleLeadTypeSelect('residential')}
                    className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-red-500 hover:bg-red-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                      <div className="font-semibold text-gray-800 text-lg">Residential</div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>For homes, townhouses, and residential properties</p>
                      <p>• Single-family homes</p>
                      <p>• Townhouses</p>
                      <p>• Peak shaving benefits</p>
                    </div>
                  </button>
                  
                  {/* Commercial Option - Coming Soon */}
                  <button
                    disabled
                    className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed text-left relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                        COMING SOON
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-400 flex items-center justify-center">
                        <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                        </svg>
                      </div>
                      <div className="font-semibold text-gray-500 text-lg">Commercial</div>
                    </div>
                    <div className="text-sm text-gray-500 space-y-2">
                      <p>For businesses and commercial properties</p>
                      <p>• Demand charge optimization</p>
                      <p>• Peak shaving benefits</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

