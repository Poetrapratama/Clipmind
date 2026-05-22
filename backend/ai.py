"""
ai.py — Whisper transcription (Groq) + LLaMA highlight detection (Groq)
"""

import os
import json
import re
import logging
import httpx

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"


async def transcribe_audio(audio_path: str) -> list[dict]:
    """
    Transcribe audio file using Groq Whisper API.
    Returns a list of segments: [{start, end, text}, ...]
    """
    logger.info(f"Transcribing audio: {audio_path}")

    async with httpx.AsyncClient(timeout=120) as client:
        with open(audio_path, "rb") as audio_file:
            response = await client.post(
                f"{GROQ_BASE_URL}/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": (os.path.basename(audio_path), audio_file, "audio/mpeg")},
                data={"model": "whisper-large-v3", "response_format": "verbose_json"},
            )
        response.raise_for_status()
        data = response.json()

    segments = []
    if "segments" in data and data["segments"]:
        for seg in data["segments"]:
            segments.append(
                {
                    "start": round(float(seg.get("start", 0)), 2),
                    "end": round(float(seg.get("end", 0)), 2),
                    "text": seg.get("text", "").strip(),
                }
            )
    else:
        segments.append(
            {
                "start": 0,
                "end": float(data.get("duration", 60)),
                "text": data.get("text", ""),
            }
        )

    logger.info(f"Transcription complete: {len(segments)} segments")
    return segments


def _format_transcript(segments: list[dict]) -> str:
    """Format segments into a readable transcript with timestamps."""
    lines = []
    for seg in segments:
        start = _fmt_time(seg["start"])
        end = _fmt_time(seg["end"])
        lines.append(f"[{start} → {end}] {seg['text']}")
    return "\n".join(lines)


def _fmt_time(seconds: float) -> str:
    """Convert seconds to MM:SS format."""
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m:02d}:{s:02d}"


async def detect_highlights(segments: list[dict]) -> list[dict]:
    """
    Send transcript to Groq LLaMA to identify 3-5 highlight clips.
    Returns list of: [{start, end, title, caption, score}, ...]
    """
    transcript_text = _format_transcript(segments)
    total_duration = segments[-1]["end"] if segments else 0

    prompt = f"""You are a video content analyst. Given this transcript with timestamps, identify the 3-5 most engaging, shareable moments suitable for short-form content (TikTok, Reels, Shorts).

For each clip, provide:
- start_time (seconds, as a number)
- end_time (seconds, max 90 seconds per clip)
- title (catchy, max 8 words)
- caption (1-2 sentences describing why this is engaging)
- score (0.0-1.0, relevance/engagement score)

Total video duration: {total_duration:.1f} seconds

Transcript:
{transcript_text}

Return as a JSON array only, no markdown, no explanation. Example format:
[{{"start_time": 10, "end_time": 75, "title": "Amazing moment here", "caption": "This clip captures...", "score": 0.92}}]"""

    logger.info("Sending transcript to Groq LLaMA for highlight detection")

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1000,
            },
        )
        response.raise_for_status()
        data = response.json()

    raw = data["choices"][0]["message"]["content"].strip()
    logger.info(f"LLaMA response received: {len(raw)} chars")

    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    clips = json.loads(raw)

    # Normalise keys
    normalised = []
    for clip in clips:
        normalised.append(
            {
                "start": float(clip.get("start_time", clip.get("start", 0))),
                "end": float(clip.get("end_time", clip.get("end", 60))),
                "title": clip.get("title", "Highlight clip"),
                "caption": clip.get("caption", ""),
                "score": float(clip.get("score", 0.8)),
            }
        )

    logger.info(f"Detected {len(normalised)} highlight clips")
    return normalised
