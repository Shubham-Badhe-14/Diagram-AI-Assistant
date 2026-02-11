# Sketch2Flow: Hand-Drawn to Digital Flowcharts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/release/python-3100/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

**Sketch2Flow** is an intelligent tool that transforms hand-drawn diagrams into digital flowcharts and executable code. Powered by advanced Computer Vision (OpenCV) and Generative AI (Gemini/OpenAI), it bridges the gap between whiteboard brainstorming and digital implementation.

## 🚀 Features

- **Upload & Analyze**: Simply upload an image of your hand-drawn flowchart.
- **AI-Powered Recognition**: Utilizes Google Gemini or OpenAI GPT-4 Vision to interpret shapes, text, and connections.
- **Code Generation**: Automatically generates Python, JavaScript, or Mermaid.js code from your diagram.
- **Interactive UI**: View your original image side-by-side with the generated digital version.
- **Preprocessing Pipeline**: Advanced image processing with OpenCV to enhance contrast and readability before AI analysis.

## 🛠️ Tech Stack

- **Backend**: Python 3.12+, FastAPI
- **Computer Vision**: OpenCV, EasyOCR
- **AI Models**: Google Gemini Pro Vision / OpenAI GPT-4o
- **Frontend**: HTML5, JavaScript (Simple & Lightweight)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Start-0-Zero/Digram-To-Flowchart.git
    cd Digram-To-Flowchart
    ```

2.  **Create a virtual environment**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Configure Environment**
    Create a `.env` file in the root directory and add your API keys:
    ```bash
    cp .env.example .env
    # Edit .env and set GEMINI_API_KEY or OPENAI_API_KEY
    ```

## 🚦 Usage

1.  **Start the Backend Server**
    ```bash
    uvicorn backend.main:app --reload
    ```

2.  **Open the Application**
    Navigate to `http://localhost:8000` in your web browser.

3.  **Upload & Convert**
    - Click "Upload Image" to select your handwritten diagram.
    - Wait for the AI to process and generate the flowchart code.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
