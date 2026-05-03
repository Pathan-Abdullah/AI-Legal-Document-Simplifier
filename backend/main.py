from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import fitz
import pytesseract
from PIL import Image
import io
import os
import requests
import re
import json

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel

# ------------------ LOAD ENV ------------------

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

print("Groq Key:", os.getenv("GROQ_API_KEY"))  # debug

# ------------------ FASTAPI ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tesseract_path = os.getenv(
    "TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

# ------------------ TEXT EXTRACTION ------------------


def extract_text(filetype, content):
    try:
        if filetype == "application/pdf":
            pdf = fitz.open(stream=content, filetype="pdf")
            return "".join(page.get_text() for page in pdf)
        elif filetype.startswith("image/"):
            image = Image.open(io.BytesIO(content))
            return pytesseract.image_to_string(image)
        return "Unsupported file format"
    except Exception as e:
        print(f"Extraction Error: {e}")
        return ""


# ------------------ GROQ CORE ------------------


def generate_text(prompt: str, json_mode: bool = False):
    # ---- TRY GROQ FIRST ----
    try:
        print("🚀 Using Groq...")

        kwargs = {
            "model": "llama3-70b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        }

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = groq_client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content

        if content:
            return content

    except Exception as e:
        print("❌ GROQ ERROR:", str(e))

    # ---- FALLBACK TO OLLAMA ----
    return generate_text_local(prompt)


def generate_text_local(prompt: str):
    try:
        print("🧠 Using Ollama (fallback)...")

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=60,
        )

        return response.json().get("response")

    except Exception as e:
        print("❌ OLLAMA ERROR:", str(e))
        return None


def clean_ai_output(text):
    if not text:
        return ""

    # Remove markdown, stars, etc
    text = re.sub(r"\*\*|\*|```|json", "", text)

    # Try parsing JSON
    try:
        parsed = json.loads(text)
        return parsed
    except:
        return text.strip()


# ------------------ UPLOAD ------------------


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    extracted_text = extract_text(file.content_type, content)

    short_text = extracted_text[:4000]

    prompt = f"""
You are a legal assistant.

Analyze this document and respond STRICTLY in valid JSON.

Format:

{{
  "Plain Summary": "...",
  "Important Clauses": "...",
  "Risks": "...",
  "Obligations": "...",
  "Deadlines": "...",
  "Questions to Ask": "..."
}}

Document:
{short_text}
"""
    ai_text = generate_text(prompt, json_mode=True)

    cleaned = clean_ai_output(ai_text)

    if cleaned:
        return {
            "filename": file.filename,
            "summary": cleaned,
            "raw_text": short_text,
            "ai_status": "success",
        }

    return {
        "filename": file.filename,
        "summary": None,
        "raw_text": short_text,
        "ai_status": "failed",
    }


# ------------------ TRANSLATE ------------------


class TranslateRequest(BaseModel):
    text: str
    target_lang: str


@app.post("/translate")
async def translate_text(req: TranslateRequest):

    # Reduce input size
    text = req.text[:2000]

    prompt = f"""
Translate the following into {req.target_lang}.

Return ONLY valid JSON.

Do NOT include:
- "Here is the JSON"
- explanations
- markdown
- extra text

Keys must be exactly:
Plain Summary
Important Clauses
Risks
Obligations
Deadlines
Questions to Ask

Text:
{text}
"""

    ai_text = generate_text(prompt)

    cleaned = clean_ai_output(ai_text)

    return {"translated": cleaned if cleaned else "⚠ Translation failed"}


# ------------------ CHAT ------------------


class ChatRequest(BaseModel):
    question: str
    context: str


@app.post("/chat")
async def chat(req: ChatRequest):
    prompt = f"""
Answer based ONLY on this document:

{req.context}

Question:
{req.question}

If not found, say "Not mentioned".
"""

    ai_text = generate_text(prompt)

    return {"answer": ai_text if ai_text else "⚠ AI failed"}


# ------------------ HEALTH ------------------


@app.get("/")
def home():
    return {"message": "Backend running"}
