
from fastapi import FastAPI
from pydantic import BaseModel, Field
from analyzer import analyze_conversation

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
