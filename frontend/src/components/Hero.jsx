export default function Hero() {
  return (
    <header className="py-16 px-4 text-center">
      {/* Logo mark */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-6">
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
          <polygon points="8,6 26,16 8,26" fill="#7c3aed" />
          <rect x="6" y="6" width="3" height="20" rx="1.5" fill="#9d5bf0" />
        </svg>
      </div>

      {/* Brand name */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-4xl md:text-5xl font-black tracking-tight">
          Clip
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            Mind
          </span>
        </span>
      </div>

      {/* Tagline */}
      <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
        Drop a video or paste a link.{' '}
        <span className="text-violet-400 font-medium">AI finds your best moments.</span>
        {' '}Export in seconds.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        {['YouTube & TikTok', 'Whisper AI Transcription', 'GPT-4o Highlight Detection', 'One-click Export'].map(
          (tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-3 py-1 rounded-full bg-violet-600/15 border border-violet-500/20 text-violet-300"
            >
              {tag}
            </span>
          )
        )}
      </div>
    </header>
  )
}
