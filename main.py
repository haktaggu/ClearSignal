
import json

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from analyzer import analyze_conversation, translate_to_spanish
from speech_to_text import transcribe_audio

app = FastAPI(title="ClearSignal AI")

# Allow requests from any port the Expo web dev server might use.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConversationRequest(BaseModel):
    history: list[str] = Field(default_factory=list)
    text: str = Field(min_length=1, max_length=5000)

@app.get("/")
def home():
    return {"message": "ClearSignal is running!"}

@app.post("/analyze")
def analyze(request: ConversationRequest):
    return analyze_conversation(
        request.history,
        request.text
    )

@app.post("/analyze-text")
def analyze_text(request: ConversationRequest):
    """
    Accepts a plain-text transcript (already captured by the browser's
    Web Speech API) plus conversation history, runs Watsonx tone analysis
    and Spanish translation, and returns the same shape as /analyze-audio.
    """
    transcript = request.text
    translation = translate_to_spanish(transcript)
    analysis = analyze_conversation(request.history, transcript)

    return {
        "transcript": transcript,
        "translation": translation,
        "analysis": analysis,
    }

@app.post("/analyze-audio")
async def analyze_audio(
    file: UploadFile = File(...),
    history: str = Form("[]"),
):
    audio = await file.read()

    try:
        submitted_history = json.loads(history)
    except json.JSONDecodeError:
        submitted_history = []

    conversation_history = (
        [item for item in submitted_history if isinstance(item, str)][-40:]
        if isinstance(submitted_history, list)
        else []
    )

    transcript = transcribe_audio(
        audio,
        file.content_type or "audio/wav"
    )

    translation = translate_to_spanish(transcript)

    return {
        "transcript": transcript,
        "translation": translation,
        "analysis": analyze_conversation(conversation_history, transcript)
    }
