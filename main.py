
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from analyzer import analyze_conversation, translate_to_spanish
from fastapi import File, Form, UploadFile
from speech_to_text import transcribe_audio

app = FastAPI(title="ClearSignal AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
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
