import io
import os
import json
import tempfile
import requests
import numpy as np
import soundfile as sf
import librosa
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Multimodal AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Lazy-load heavy models to avoid crash on startup if not installed
_whisper_model  = None
_deepface_ready = False

def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model("base")
    return _whisper_model

def call_openai(prompt: str) -> str:
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI error: {str(e)}"


@app.get("/health")
def health():
    return {"status": "ok", "service": "multimodal-service"}


@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file (WAV/MP3/WebM).
    Returns transcript, speech rate, confidence score, hesitation count, filler words.
    """
    contents = await file.read()
    suffix = ".webm" if file.content_type and "webm" in file.content_type else ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Transcription
        model = get_whisper()
        result = model.transcribe(tmp_path)
        transcript = result.get("text", "").strip()

        # Audio features via librosa
        y, sr = librosa.load(tmp_path, sr=None)
        duration_sec = librosa.get_duration(y=y, sr=sr)

        # Speech rate: words per minute
        word_count  = len(transcript.split())
        speech_rate = round((word_count / max(duration_sec, 1)) * 60, 1)

        # Filler words
        filler_list = ["um", "uh", "like", "you know", "basically", "literally", "sort of", "kind of"]
        transcript_lower = transcript.lower()
        filler_hits = {w: transcript_lower.count(w) for w in filler_list if transcript_lower.count(w) > 0}
        hesitation_count = sum(filler_hits.values())

        # Confidence score heuristic: high speech rate + low fillers = high confidence
        rate_score   = min(speech_rate / 180 * 100, 100)
        filler_penalty = min(hesitation_count * 8, 40)
        confidence_score = max(0, round(rate_score - filler_penalty))

        return {
            "transcript":      transcript,
            "speechRatePct":   speech_rate,
            "confidenceScore": confidence_score,
            "hesitationCount": hesitation_count,
            "fillerWords":     filler_hits,
            "durationSec":     round(duration_sec, 1),
            "wordCount":       word_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@app.post("/analyze-video-frame")
async def analyze_video_frame(file: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG image frame.
    Returns dominant emotion and per-emotion confidence scores via DeepFace.
    """
    try:
        from deepface import DeepFace
    except ImportError:
        raise HTTPException(status_code=503, detail="DeepFace not installed. Run: pip install deepface tf-keras")

    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = DeepFace.analyze(img_path=tmp_path, actions=["emotion"], enforce_detection=False)
        if isinstance(result, list):
            result = result[0]
        emotions = result.get("emotion", {})
        dominant = result.get("dominant_emotion", "neutral")
        return {
            "dominantEmotion": dominant,
            "emotions":        {k: round(float(v), 1) for k, v in emotions.items()},
            "confidence":      round(float(emotions.get(dominant, 0)), 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video frame analysis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@app.post("/analyze-communication")
async def analyze_communication(transcript: str = Form(...)):
    """
    Accepts a transcript string.
    Returns communication quality scores via OpenAI.
    """
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="transcript is required")

    prompt = (
        f"Analyze this interview answer transcript for communication quality:\n\n"
        f"\"{transcript}\"\n\n"
        "Return EXACTLY these key:value lines (no extra text):\n"
        "CLARITY_SCORE: (0-100)\n"
        "PROFESSIONALISM_SCORE: (0-100)\n"
        "TECHNICAL_DEPTH_SCORE: (0-100)\n"
        "OVERALL_COMMUNICATION_SCORE: (0-100)\n"
        "SUGGESTION_1: (one specific improvement)\n"
        "SUGGESTION_2: (another specific improvement)\n"
        "STRENGTH: (what was done well)\n"
    )
    raw = call_openai(prompt)

    def extract(key):
        for line in raw.split("\n"):
            if line.upper().startswith(key.upper()):
                idx = line.find(":")
                return line[idx+1:].strip() if idx >= 0 else ""
        return "N/A"

    def parse_int(key, fallback=50):
        try:
            return int(extract(key).replace("%", "").strip())
        except:
            return fallback

    return {
        "clarityScore":            parse_int("CLARITY_SCORE"),
        "professionalismScore":    parse_int("PROFESSIONALISM_SCORE"),
        "technicalDepthScore":     parse_int("TECHNICAL_DEPTH_SCORE"),
        "overallCommunicationScore": parse_int("OVERALL_COMMUNICATION_SCORE"),
        "suggestions":             [extract("SUGGESTION_1"), extract("SUGGESTION_2")],
        "strength":                extract("STRENGTH"),
    }


@app.post("/analyze-github")
async def analyze_github(username: str = Form(...), token: str = Form("")):
    """
    Fetches public GitHub profile + top repos and returns AI-driven maturity scores.
    """
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        user_resp = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if user_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub user not found")
        user_data = user_resp.json()

        repos_resp = requests.get(
            f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10",
            headers=headers, timeout=10
        )
        repos = repos_resp.json() if repos_resp.status_code == 200 else []

        languages   = {}
        repo_summaries = []
        for repo in repos:
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
            repo_summaries.append({
                "name":        repo.get("name"),
                "description": repo.get("description", ""),
                "stars":       repo.get("stargazers_count", 0),
                "language":    lang,
                "topics":      repo.get("topics", []),
            })

        top_languages = sorted(languages, key=languages.get, reverse=True)[:5]
        top_repos_by_stars = sorted(repo_summaries, key=lambda r: r["stars"], reverse=True)[:5]

        context = (
            f"GitHub Profile: {username}\n"
            f"Public repos: {user_data.get('public_repos', 0)}\n"
            f"Followers: {user_data.get('followers', 0)}\n"
            f"Top languages: {', '.join(top_languages)}\n"
            f"Top repositories (by stars):\n" +
            "\n".join([f"  - {r['name']} ({r['stars']} stars, {r['language']}): {r['description']}"
                       for r in top_repos_by_stars])
        )

        prompt = (
            context + "\n\n"
            "Analyze this developer's GitHub profile and return EXACTLY these key:value lines:\n"
            "TECHNICAL_DEPTH: (0-100)\n"
            "CODE_DIVERSITY: (0-100)\n"
            "OPEN_SOURCE_SCORE: (0-100)\n"
            "PROJECT_QUALITY: (0-100)\n"
            "STANDOUT_PROJECTS: (comma-separated project names, max 3)\n"
            "PROFILE_SUMMARY: (2-sentence honest assessment)\n"
            "TOP_RECOMMENDATION: (single most impactful thing to improve profile)\n"
        )
        raw = call_openai(prompt)

        def extract(key):
            for line in raw.split("\n"):
                if line.upper().startswith(key.upper()):
                    idx = line.find(":")
                    return line[idx+1:].strip() if idx >= 0 else ""
            return "N/A"

        def parse_int(key, fallback=50):
            try:
                return int(extract(key).replace("%","").strip())
            except:
                return fallback

        return {
            "username":          username,
            "technicalDepth":    parse_int("TECHNICAL_DEPTH"),
            "codeDiversity":     parse_int("CODE_DIVERSITY"),
            "openSourceScore":   parse_int("OPEN_SOURCE_SCORE"),
            "projectQuality":    parse_int("PROJECT_QUALITY"),
            "topLanguages":      top_languages,
            "standoutProjects":  [s.strip() for s in extract("STANDOUT_PROJECTS").split(",") if s.strip()],
            "profileSummary":    extract("PROFILE_SUMMARY"),
            "topRecommendation": extract("TOP_RECOMMENDATION"),
            "publicRepos":       user_data.get("public_repos", 0),
            "followers":         user_data.get("followers", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub analysis failed: {str(e)}")
