"""
clipper.py — Video download (yt-dlp) and FFmpeg processing utilities
"""

import os
import asyncio
import logging
import subprocess
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

TEMP_DIR = Path(__file__).parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)


def _run(cmd: list[str], timeout: int = 300) -> str:
    """Run a subprocess command, raise on failure."""
    logger.info(f"Running: {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed (exit {result.returncode}):\n"
            f"stdout: {result.stdout}\n"
            f"stderr: {result.stderr}"
        )
    return result.stdout


async def download_video(url: str) -> str:
    """
    Download a YouTube/TikTok video using yt-dlp.
    Returns the local file path of the downloaded video.
    """
    video_id = str(uuid.uuid4())[:8]
    output_template = str(TEMP_DIR / f"{video_id}.%(ext)s")

    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--output", output_template,
        "--no-warnings",
        url,
    ]

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _run(cmd, timeout=300))

    # Find the downloaded file
    matches = list(TEMP_DIR.glob(f"{video_id}.*"))
    if not matches:
        raise FileNotFoundError(f"yt-dlp did not produce output for video_id={video_id}")

    video_path = str(matches[0])
    logger.info(f"Video downloaded: {video_path}")
    return video_path


async def save_upload(file_bytes: bytes, original_filename: str) -> str:
    """
    Save an uploaded video file to the temp directory.
    Returns the local file path.
    """
    ext = Path(original_filename).suffix or ".mp4"
    filename = f"{uuid.uuid4()}{ext}"
    path = TEMP_DIR / filename

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, path.write_bytes, file_bytes)

    logger.info(f"Upload saved: {path}")
    return str(path)


async def extract_audio(video_path: str) -> str:
    """
    Extract audio from a video file using FFmpeg.
    Returns path to the extracted audio (mp3).
    """
    audio_path = str(Path(video_path).with_suffix(".mp3"))

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                        # no video
        "-acodec", "libmp3lame",
        "-ar", "16000",               # 16 kHz — optimal for Whisper
        "-ac", "1",                   # mono
        "-b:a", "64k",
        audio_path,
    ]

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _run(cmd, timeout=300))

    logger.info(f"Audio extracted: {audio_path}")
    return audio_path


async def export_clip(
    video_path: str, start: float, end: float, output_filename: str
) -> str:
    """
    Cut a clip from the source video using FFmpeg.
    Returns the path of the output clip file.
    """
    duration = end - start
    if duration <= 0:
        raise ValueError(f"Invalid clip range: {start} → {end}")

    output_path = str(TEMP_DIR / output_filename)

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-c", "copy",           # stream copy — fast, no re-encode
        "-avoid_negative_ts", "make_zero",
        output_path,
    ]

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _run(cmd, timeout=120))

    logger.info(f"Clip exported: {output_path}")
    return output_path


def cleanup_file(path: str) -> None:
    """Delete a temp file silently."""
    try:
        os.remove(path)
        logger.info(f"Cleaned up: {path}")
    except FileNotFoundError:
        pass
