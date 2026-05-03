# ⚖️ AI Legal Document Simplifier

An AI-powered web application that helps users understand complex legal documents in simple language. Upload PDFs or images and get structured summaries, key risks, obligations, and a chatbot to ask questions — all in one place.

---

## 🚀 Features

- 📄 **Document Upload**
  - Supports PDF and image files
  - Extracts text using OCR (Tesseract) and PDF parsing

- 🧠 **AI Legal Analysis**
  - Plain language summary
  - Important clauses
  - Risks and penalties
  - Obligations
  - Deadlines
  - Questions to ask before signing

- 💬 **AI Chatbot**
  - Ask questions about the uploaded document
  - Context-aware responses based on document content

- 🌍 **Translation (Experimental)**
  - Translate analysis into Hindi, Telugu, or English
  - Optimized for short-to-medium content

- 🔊 **Voice Assistant**
  - Listen to summaries in multiple languages
  - Uses browser Speech Synthesis API

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend
- FastAPI (Python)
- Groq API (LLM - LLaMA3)
- Ollama (Local fallback model)

### AI & Processing
- PyMuPDF (PDF text extraction)
- Tesseract OCR (image text extraction)

---

## 🧠 How It Works

1. User uploads a document (PDF/image)
2. Backend extracts text using:
   - PyMuPDF (for PDFs)
   - Tesseract OCR (for images)
3. Extracted text is sent to an LLM (Groq / Ollama)
4. AI returns structured legal analysis in JSON format
5. Frontend displays results in clean sections
6. User can:
   - Translate the output
   - Listen via voice
   - Ask questions using chatbot

---

## 📂 Project Structure
