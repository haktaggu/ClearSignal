
from fastapi import FastAPI
from pydantic import BaseModel, Field
from analyzer import analyze_conversation
from fastapi import File, UploadFile
from speech_to_text import transcribe_audio

app = FastAPI(title="ClearSignal AI")

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
async def analyze_audio(file: UploadFile = File(...)):
    audio = await file.read()

    transcript = transcribe_audio(
        audio,
        file.content_type or "audio/wav"
    )

    return {
        "transcript": transcript,
        "analysis": analyze_conversation([], transcript)
    }
