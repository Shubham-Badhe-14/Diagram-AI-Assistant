
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

print("Checking imports...")
try:
    print("1. Importing config...")
    from backend.app.core.config import settings
    print("   - Config loaded.")

    print("2. Importing main...")
    from backend.main import app
    print("   - Main app loaded.")

    print("3. Importing Gemini Vision Provider...")
    from backend.app.services.vision.gemini import GeminiVisionProvider
    print("   - Gemini Provider loaded.")

    print("4. Importing Orchestration...")
    from backend.app.api.endpoints import process
    print("   - Process Endpoint loaded.")

    print("SUCCESS: All key modules imported correctly.")
except Exception as e:
    print(f"FAILURE: {e}")
    sys.exit(1)
