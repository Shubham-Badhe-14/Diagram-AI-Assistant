
import requests
import time
import os
import sys

# Constants
API_URL = "http://localhost:8000/api/v1"
TEST_IMAGE_PATH = "test_images/sample_flowchart.png"

def create_sample_image():
    """Generates a dummy image if one doesn't exist."""
    if not os.path.exists("test_images"):
        os.makedirs("test_images")
    
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Generating sample image at {TEST_IMAGE_PATH}")
        try:
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (500, 500), color='white')
            d = ImageDraw.Draw(img)
            d.rectangle([100, 100, 200, 200], outline="black", width=2) # Box 1
            d.text((110, 110), "Start", fill="black")
            d.rectangle([100, 300, 200, 400], outline="black", width=2) # Box 2
            d.text((110, 310), "End", fill="black")
            d.line([(150, 200), (150, 300)], fill="black", width=2) # Arrow
            img.save(TEST_IMAGE_PATH)
        except ImportError:
            print("Pillow not installed, creating dummy file")
            with open(TEST_IMAGE_PATH, "wb") as f:
                f.write(os.urandom(1024))

def test_pipeline():
    print("--- Starting Integration Test ---")
    
    # 1. Upload
    print(f"Uploading {TEST_IMAGE_PATH}...")
    with open(TEST_IMAGE_PATH, "rb") as f:
        response = requests.post(f"{API_URL}/upload", files={"file": f})
    
    if response.status_code != 200:
        print(f"Upload failed: {response.text}")
        sys.exit(1)
        
    data = response.json()
    job_id = data["job_id"]
    print(f"Upload successful. Job ID: {job_id}")
    
    # 2. Process
    print(f"Triggering processing for {job_id}...")
    response = requests.post(f"{API_URL}/process/{job_id}")
    if response.status_code != 200:
        print(f"Process trigger failed: {response.text}")
        sys.exit(1)
        
    # 3. Poll Status
    print("Polling status...")
    for _ in range(10): # Timeout after 10s
        response = requests.get(f"{API_URL}/status/{job_id}")
        status_data = response.json()
        status = status_data["status"]
        print(f"Current status: {status}")
        
        if status in ["completed", "completed_with_warnings"]:
            print("Processing completed!")
            break
        elif status.startswith("failed"):
            print(f"Processing failed: {status}")
            sys.exit(1)
            
        time.sleep(1)
    else:
        print("Timeout waiting for processing")
        sys.exit(1)

    # 4. Verify Results
    print("Verifying outputs...")
    mmd_response = requests.get(f"{API_URL}/results/{job_id}/mermaid")
    if mmd_response.status_code == 200:
        print("Mermaid code retrieved successfully:")
        print(mmd_response.text[:100] + "...")
    else:
        print("Failed to retrieve Mermaid code")
        sys.exit(1)

    print("--- Integration Test PASSED ---")

if __name__ == "__main__":
    create_sample_image()
    test_pipeline()
