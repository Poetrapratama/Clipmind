import { useState, useRef, useCallback } from 'react'

export default function UploadSection({ onProcess }) {
  const [mode, setMode] = useState('file') // 'file' | 'url'
  const [url, setUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef(null)

  // ── Drag handlers ──────────────────────────────────────────────────
  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragActive(true)
  }, [])
  const onDragLeave = useCallback(() => setDragActive(false), [])
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }, [])

  const handleFile = (f) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mkv']
    if (!f.type.startsWith('video/') && !allowed.includes(f.type)) {
      alert('Please upload a video file (MP4, MOV, AVI, WebM, MKV).')
      return
    }
    setSelectedFile(f)
    setMode('file')
  }

  // ── URL validation ─────────────────────────────────────────────────
  const isValidUrl = (u) => {
    try {
      const parsed = new URL(u)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = () => {
    if (mode === 'file' && selectedFile) {
      onProcess({ file: selectedFile, url: null })
    } else if (mode === 'url') {
      if (!url.trim()) { setUrlError('Please enter a URL.'); return }
      if (!isValidUrl(url.trim())) { setUrlError('Please enter a valid URL.'); return }
      setUrlError('')
      onProcess({ file: null, url: url.trim() })
    }
  }

  const canSubmit = (mode === 'file' && selectedFile) || (mode === 'url' && url.trim())

  return (
    <div className="card p-8 animate-fade-in">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-black/30 rounded-xl mb-8 w-fit mx-auto">
        <TabButton active={mode === 'file'} onClick={() => setMode('file')}>
          <UploadIcon /> Upload File
        </TabButton>
        <TabButton active={mode === 'url'} onClick={() => setMode('url')}>
          <LinkIcon /> Paste URL
        </TabButton>
      </div>

      {/* File drop zone */}
      {mode === 'file' && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200 select-none
            ${dragActive
              ? 'border-violet-400 bg-violet-600/10 scale-[1.01]'
              : selectedFile
              ? 'border-violet-600/60 bg-violet-600/5'
              : 'border-white/10 hover:border-violet-600/40 hover:bg-white/2'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {selectedFile ? (
            <>
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-violet-300 font-semibold text-lg truncate max-w-sm mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                className="mt-4 text-xs text-gray-500 hover:text-red-400 underline transition-colors"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4 opacity-40">📁</div>
              <p className="text-gray-300 font-medium text-lg">
                {dragActive ? 'Drop it here!' : 'Drag & drop your video here'}
              </p>
              <p className="text-gray-600 text-sm mt-2">or click to browse</p>
              <p className="text-gray-700 text-xs mt-4">
                Supports MP4, MOV, AVI, WebM, MKV — up to 500 MB
              </p>
            </>
          )}
        </div>
      )}

      {/* URL input */}
      {mode === 'url' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            YouTube or TikTok URL
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <LinkIcon />
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@user/video/..."
              className="input-field w-full pl-10 pr-4"
            />
          </div>
          {urlError && <p className="text-red-400 text-sm">{urlError}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {['YouTube', 'TikTok', 'Instagram Reels', 'Twitter/X'].map((p) => (
              <span key={p} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-500">
                ✓ {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
        >
          <SparkleIcon />
          Analyze with AI
        </button>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-gray-400 hover:text-gray-200'}
      `}
    >
      {children}
    </button>
  )
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}
