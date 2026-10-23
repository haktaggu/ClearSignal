
import os
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials

load_dotenv()

credentials = Credentials(
    url=os.environ["WATSONX_URL"],
    api_key=os.environ["WATSONX_API_KEY"]
)

client = APIClient(credentials)

client.set.default_project(
    os.environ["WATSONX_PROJECT_ID"]
)

print("Checking available models...")

models = client.foundation_models.get_model_specs()

for model in models.get("resources", []):
    model_id = model.get("model_id", "")
    if "granite" in model_id.lower():
        print(model_id)
