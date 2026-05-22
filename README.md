# ClipMind 🎬✨

> **AI-powered video highlight clipper.** Drop a video or paste a YouTube/TikTok link — ClipMind automatically transcribes it, identifies the most engaging moments, and lets you export them in seconds.

---

## Features

- 🔗 **YouTube & TikTok support** — paste any URL and yt-dlp handles the download
- 📁 **Direct file upload** — drag & drop MP4, MOV, AVI, WebM, MKV
- 🎙️ **Whisper AI transcription** — accurate speech-to-text with timestamps
- 🧠 **GPT-4o-mini highlight detection** — identifies 3–5 most engaging clips
- ✂️ **FFmpeg clip export** — one-click download of each highlight
- 🌑 **Premium dark UI** — purple/violet SaaS design, fully responsive

---

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18 + Vite + TailwindCSS      |
| Backend   | Python 3.11+ + FastAPI + Uvicorn   |
| AI        | OpenAI Whisper API + GPT-4o-mini   |
| Video     | yt-dlp + FFmpeg                    |

---

## Prerequisites

Make sure these are installed on your system:

- **Node.js** v18+ and npm
- **Python** 3.11+
- **FFmpeg** — [ffmpeg.org/download](https://ffmpeg.org/download.html)
- **yt-dlp** — `pip install yt-dlp` or via [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases)
- **OpenAI API key** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Quick Start

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd clipmind
```

### 2. Backend setup

```bash
cd backend

# Create & activate virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# → Edit .env and set your OPENAI_API_KEY
```

### 3. Start the backend

```bash
# Still inside clipmind/backend/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 4. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. 🎉

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
OPENAI_API_KEY=sk-...your-key-here...
```

This is the **only** required variable. The backend uses it for:
- Whisper API (`whisper-1` model) — audio transcription
- GPT-4o-mini — highlight detection

---

## API Reference

### `POST /api/process`

Process a video and return highlight clips.

**Form data (multipart):**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File (optional) | Video file upload |
| `url`  | string (optional) | YouTube/TikTok URL |

One of `file` or `url` is required.

**Response:**
```json
{
  "video_path": "/path/to/temp/video.mp4",
  "segment_count": 42,
  "clips": [
    {
      "start": 32.5,
      "end": 98.0,
      "title": "Explosive reveal moment",
      "caption": "The speaker drops a surprising statistic that hooks the audience instantly.",
      "score": 0.94
    }
  ]
}
```

---

### `POST /api/export`

Export a clip segment as a downloadable MP4.

**Form data:**
| Field | Type | Description |
|-------|------|-------------|
| `video_path` | string | Path returned by `/api/process` |
| `start` | float | Start time in seconds |
| `end` | float | End time in seconds |
| `filename` | string | Output filename (optional) |

**Response:** Binary MP4 file download

---

## Project Structure

```
clipmind/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main app state machine
│   │   ├── index.css                # Tailwind + global styles
│   │   ├── main.jsx                 # React entry point
│   │   └── components/
│   │       ├── Hero.jsx             # Header / branding
│   │       ├── UploadSection.jsx    # File drop + URL input
│   │       ├── ProcessingScreen.jsx # Animated progress steps
│   │       └── ClipsResult.jsx      # Clip cards + export
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── clipper.py       # yt-dlp download + FFmpeg utils
│   ├── ai.py            # Whisper transcription + GPT highlights
│   ├── requirements.txt
│   ├── .env.example
│   └── temp/            # Temporary video storage (auto-created)
│
└── README.md
```

---

## Notes & Tips

- **Temp files:** Videos are stored in `backend/temp/`. Add periodic cleanup for production use.
- **Large files:** Processing a 30-min video may take 3–5 minutes (Whisper transcribes in real-time).
- **Rate limits:** Whisper and GPT-4o-mini are subject to OpenAI rate limits. The app handles errors gracefully.
- **CORS:** The backend allows all origins by default. Restrict this in production.
- **Production:** For production, replace `allow_origins=["*"]` with your actual frontend domain and use a process manager (gunicorn/supervisor) for the backend.

---

## License

MIT — feel free to use, modify, and distribute.
