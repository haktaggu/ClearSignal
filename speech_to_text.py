import re
import os
from dotenv import load_dotenv
from ibm_watson import SpeechToTextV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

load_dotenv()


def clean_transcript(text: str) -> str:
    # Remove IBM Speech to Text marker tokens such as %HESITATION.
    text = re.sub(r"\s*%[A-Z0-9_]+\s*", " ", text)
    return " ".join(text.split())


def transcribe_audio(audio_file, content_type="audio/wav"):
    authenticator = IAMAuthenticator(os.environ["IBM_STT_APIKEY"])

    service = SpeechToTextV1(authenticator=authenticator)
    service.set_service_url(os.environ["IBM_STT_URL"])

    result = service.recognize(
        audio=audio_file,
        content_type=content_type,
        model="en-US_BroadbandModel",  # valid IBM STT model name
        smart_formatting=True,
    ).get_result()

    transcript = " ".join(
        item["alternatives"][0]["transcript"].strip()
        for item in result.get("results", [])
        if item.get("alternatives")
    )

    return clean_transcript(transcript)
