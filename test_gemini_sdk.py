
import os
import sys
from dotenv import load_dotenv
from PIL import Image

# Add project root
sys.path.append(os.getcwd())
load_dotenv()

from google import genai
from google.genai import types

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No API Key found")
    sys.exit(1)

print("Initializing Client...")
client = genai.Client(api_key=api_key)

print("Creating dummy image...")
img = Image.new('RGB', (100, 100), color='red')

print("Sending request to gemini-2.5-flash...")
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            "Describe this image in one word.",
            img
        ],
        config=types.GenerateContentConfig(
            response_mime_type="text/plain"
        )
    )
    print(f"Response: {response.text}")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
    # Print available attributes to debug if needed
    # print(dir(client))
