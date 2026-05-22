import { useState } from 'react'
import Hero from './components/Hero.jsx'
import UploadSection from './components/UploadSection.jsx'
import ProcessingScreen from './components/ProcessingScreen.jsx'
import ClipsResult from './components/ClipsResult.jsx'

// App states: 'idle' | 'processing' | 'results' | 'error'
export default function App() {
  const [screen, setScreen] = useState('idle')
  const [processingStep, setProcessingStep] = useState(0)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleProcess = async ({ file, url }) => {
    setScreen('processing')
    setProcessingStep(0)
    setError(null)

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
        setProcessingStep(1) // skip download step
      } else {
        formData.append('url', url)
        setProcessingStep(0) // Downloading
      }

      // Give the UI a moment to animate the first step
      await sleep(600)
      setProcessingStep(file ? 1 : 1) // Transcribing

      const response = await fetch('http://localhost:8000/api/process', {
        method: 'POST',
        body: formData,
      })

      setProcessingStep(2) // Analyzing
      await sleep(400)

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unknown server error' }))
        throw new Error(err.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setProcessingStep(3) // Ready
      await sleep(600)

      setResults(data)
      setScreen('results')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setScreen('error')
    }
  }

  const handleReset = () => {
    setScreen('idle')
    setResults(null)
    setError(null)
    setProcessingStep(0)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-purple-800/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-indigo-700/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Hero />

        <main className="max-w-4xl mx-auto px-4 pb-24">
          {screen === 'idle' && (
            <UploadSection onProcess={handleProcess} />
          )}

          {screen === 'processing' && (
            <ProcessingScreen step={processingStep} />
          )}

          {screen === 'results' && results && (
            <ClipsResult results={results} onReset={handleReset} />
          )}

          {screen === 'error' && (
            <div className="card p-8 text-center animate-fade-in">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Processing Failed</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
              <button onClick={handleReset} className="btn-primary">
                Try Again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
