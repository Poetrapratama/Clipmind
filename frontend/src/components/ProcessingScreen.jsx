import { useEffect, useState } from 'react'

const STEPS = [
  { id: 0, icon: '⬇️', label: 'Downloading', desc: 'Fetching video from source…' },
  { id: 1, icon: '🎙️', label: 'Transcribing', desc: 'Converting speech to text with Whisper AI…' },
  { id: 2, icon: '🧠', label: 'Analyzing', desc: 'GPT-4o identifying the best highlights…' },
  { id: 3, icon: '✅', label: 'Ready', desc: 'Your clips are ready to review!' },
]

export default function ProcessingScreen({ step }) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const activeStep = STEPS[Math.min(step, STEPS.length - 1)]

  return (
    <div className="card p-10 text-center animate-fade-in">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-28 h-28 rounded-full bg-violet-600/20 animate-ping" />
        <div className="absolute w-24 h-24 rounded-full bg-violet-600/15 animate-pulse" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-violet-600/30 border border-violet-500/40 text-3xl">
          {activeStep.icon}
        </div>
      </div>

      {/* Current step */}
      <h2 className="text-2xl font-bold text-white mb-1">
        {activeStep.label}
        {step < 3 && <span className="text-violet-400">{dots}</span>}
      </h2>
      <p className="text-gray-400 text-base mb-10">{activeStep.desc}</p>

      {/* Step progress track */}
      <div className="flex items-center justify-center gap-0 max-w-sm mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="relative flex items-center justify-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                  border-2 transition-all duration-500
                  ${i < step
                    ? 'bg-violet-600 border-violet-600 text-white scale-95'
                    : i === step
                    ? 'bg-violet-600/20 border-violet-400 text-violet-300 ring-4 ring-violet-500/20 scale-110'
                    : 'bg-transparent border-white/10 text-gray-600'
                  }
                `}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1">
                <div
                  className={`h-full rounded transition-all duration-700 ${
                    i < step ? 'bg-violet-600' : 'bg-white/5'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between max-w-sm mx-auto mt-2 px-1">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`text-xs font-medium transition-colors duration-300 ${
              i === step ? 'text-violet-400' : i < step ? 'text-violet-600' : 'text-gray-700'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-gray-700 text-xs mt-8">
        This may take 1–3 minutes depending on video length.
      </p>
    </div>
  )
}
