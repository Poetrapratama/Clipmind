import { useState } from 'react'

export default function ClipsResult({ results, onReset }) {
  const { video_path, clips = [], segment_count } = results
  const [exportingIdx, setExportingIdx] = useState(null)
  const [exportedIdx, setExportedIdx] = useState([])

  const fmtTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleExport = async (clip, idx) => {
    setExportingIdx(idx)
    try {
      const fd = new FormData()
      fd.append('video_path', video_path)
      fd.append('start', clip.start)
      fd.append('end', clip.end)
      fd.append('filename', `clipmind_${idx + 1}_${clip.title.replace(/\s+/g, '_').slice(0, 30)}.mp4`)

      const res = await fetch('http://localhost:8000/api/export', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }))
        throw new Error(err.detail)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clipmind_${idx + 1}.mp4`
      a.click()
      URL.revokeObjectURL(url)

      setExportedIdx((prev) => [...prev, idx])
    } catch (err) {
      alert(`Export failed: ${err.message}`)
    } finally {
      setExportingIdx(null)
    }
  }

  const scoreColor = (score) => {
    if (score >= 0.85) return 'text-emerald-400'
    if (score >= 0.65) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const scoreLabel = (score) => {
    if (score >= 0.85) return 'High'
    if (score >= 0.65) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {clips.length} Highlight{clips.length !== 1 ? 's' : ''} Found
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Analyzed {segment_count} transcript segments
          </p>
        </div>
        <button onClick={onReset} className="btn-ghost text-sm px-4 py-2">
          ← New Video
        </button>
      </div>

      {/* Clip cards */}
      {clips.map((clip, idx) => (
        <ClipCard
          key={idx}
          clip={clip}
          idx={idx}
          fmtTime={fmtTime}
          scoreColor={scoreColor}
          scoreLabel={scoreLabel}
          exporting={exportingIdx === idx}
          exported={exportedIdx.includes(idx)}
          onExport={() => handleExport(clip, idx)}
        />
      ))}

      {/* Footer actions */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <p className="text-gray-500 text-sm">
          💡 Tip: Export clips individually or share directly to social media
        </p>
        <button onClick={onReset} className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap">
          + Analyze Another Video
        </button>
      </div>
    </div>
  )
}

function ClipCard({ clip, idx, fmtTime, scoreColor, scoreLabel, exporting, exported, onExport }) {
  const duration = Math.round(clip.end - clip.start)

  return (
    <div
      className="card p-6 animate-slide-up hover:border-violet-600/20 transition-all duration-200"
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Index badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <span className="text-violet-400 font-bold text-sm">#{idx + 1}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-white leading-tight">{clip.title}</h3>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-4">{clip.caption}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timestamp */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
              <ClockIcon />
              <span className="text-gray-300 text-sm font-mono font-medium">
                {fmtTime(clip.start)} → {fmtTime(clip.end)}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
              <FilmIcon />
              <span className="text-gray-400 text-sm">{duration}s</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
              <StarIcon className={scoreColor(clip.score)} />
              <span className={`text-sm font-semibold ${scoreColor(clip.score)}`}>
                {scoreLabel(clip.score)}
              </span>
              <span className="text-gray-600 text-sm">
                ({(clip.score * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="flex-shrink-0">
          <button
            onClick={onExport}
            disabled={exporting}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
              transition-all duration-200 whitespace-nowrap
              ${exported
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default'
                : exporting
                ? 'bg-violet-600/20 border border-violet-500/20 text-violet-400 cursor-wait'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 active:scale-95'
              }
            `}
          >
            {exporting ? (
              <>
                <SpinnerIcon />
                Exporting…
              </>
            ) : exported ? (
              <>
                <CheckIcon />
                Exported!
              </>
            ) : (
              <>
                <DownloadIcon />
                Export Clip
              </>
            )}
          </button>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-4 ml-14">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-1000"
            style={{ width: `${clip.score * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
    </svg>
  )
}
function FilmIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  )
}
function StarIcon({ className }) {
  return (
    <svg className={`w-3.5 h-3.5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
