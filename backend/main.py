"""
main.py — ClipMind FastAPI backend
"""

import os
import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from clipper import download_video, save_upload, extract_audio, export_clip
from ai import transcribe_audio, detect_highlights

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ClipMind API",
    description="AI-powered video highlight clipper",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path(__file__).parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ClipMind API"}


# ─── Process ──────────────────────────────────────────────────────────────────
@app.post("/api/process")
async def process_video(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
):
    """
    Accept a video file upload OR a YouTube/TikTok URL.
    Returns detected highlight clips with timestamps.
    """
    if not file and not url:
        raise HTTPException(
            status_code=400, detail="Provide either a video file or a URL."
        )
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured on the server.",
        )

    video_path: Optional[str] = None
    audio_path: Optional[str] = None

    try:
        # 1. Acquire video
        if url:
            logger.info(f"Processing URL: {url}")
            video_path = await download_video(url)
        else:
            logger.info(f"Processing upload: {file.filename}")
            content = await file.read()
            video_path = await save_upload(content, file.filename or "upload.mp4")

        # 2. Extract audio
        audio_path = await extract_audio(video_path)

        # 3. Transcribe
        segments = await transcribe_audio(audio_path)

        # 4. Detect highlights
        clips = await detect_highlights(segments)

        return {
            "video_path": video_path,
            "clips": clips,
            "segment_count": len(segments),
        }

    except RuntimeError as exc:
        logger.error(f"Processing error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during processing")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")
    finally:
        # Always clean up audio; keep video for export
        if audio_path:
            try:
                Path(audio_path).unlink(missing_ok=True)
            except Exception:
                pass


# ─── Export ───────────────────────────────────────────────────────────────────
@app.post("/api/export")
async def export_video_clip(
    video_path: str = Form(...),
    start: float = Form(...),
    end: float = Form(...),
    filename: str = Form("clip.mp4"),
):
    """
    Cut a clip from the source video and return it as a downloadable file.
    """
    # Validate video_path is inside our temp dir (security guard)
    abs_video = Path(video_path).resolve()
    abs_temp = TEMP_DIR.resolve()
    if not str(abs_video).startswith(str(abs_temp)):
        raise HTTPException(status_code=400, detail="Invalid video_path.")

    if not abs_video.exists():
        raise HTTPException(status_code=404, detail="Source video not found.")

    safe_filename = Path(filename).stem + ".mp4"
    output_name = f"{uuid.uuid4()}_{safe_filename}"

    try:
        output_path = await export_clip(str(abs_video), start, end, output_name)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=safe_filename,
        background=None,
    )
