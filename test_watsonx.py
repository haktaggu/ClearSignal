
import os
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

load_dotenv()

credentials = Credentials(
    url=os.environ["WATSONX_URL"],
    api_key=os.environ["WATSONX_API_KEY"]
)

model = ModelInference(
    model_id=os.environ["WATSONX_MODEL_ID"],
    credentials=credentials,
    project_id=os.environ["WATSONX_PROJECT_ID"],
    params={
        "max_tokens": 300
    }
)

response = model.chat(
    messages=[
        {
            "role": "system",
            "content": (
                "You are ClearSignal, an accessible "
                "communication analysis assistant. "
                "Identify potential inconsistencies "
                "without assuming malicious intent."
            )
        },
        {
            "role": "user",
            "content": (
                "Earlier: There are no additional fees.\n"
                "Later: You must pay a $200 processing fee.\n"
                "Explain any possible contradiction "
                "and suggest a clarifying question."
            )
        }
    ]
)

print(
    response["choices"][0]["message"]["content"]
)
