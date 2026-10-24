import os
from dotenv import load_dotenv
from ibm_watson import SpeechToTextV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

load_dotenv()


def transcribe_audio(audio_file, content_type="audio/wav"):
    authenticator = IAMAuthenticator(os.environ["IBM_STT_APIKEY"])

    service = SpeechToTextV1(authenticator=authenticator)
    service.set_service_url(os.environ["IBM_STT_URL"])

    result = service.recognize(
        audio=audio_file,
        content_type=content_type
    ).get_result()

    return " ".join(
        item["alternatives"][0]["transcript"].strip()
        for item in result.get("results", [])
        if item.get("alternatives")
    )