# No-Name — Voice Payment Demo

This repository contains a small demo that shows a voice-driven "payment" flow. It's intentionally minimal: the browser captures speech (Web Speech API), sends the recognized text to the backend, and the backend parses the text and simulates a payment response.

Files:
- `main.py` — FastAPI app that serves the page and exposes `/process_voice`.
- `templates/index.html` — frontend UI that captures microphone input.
- `static/script.js` — alternative frontend helper (kept for reference).
- `.env.example` — copy to `.env` when you add real provider keys.

Quick start (PowerShell):

```powershell
# Create & activate a venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the server (dev)
uvicorn main:app --reload --port 8000
```

Open http://127.0.0.1:8000/ in a modern browser (Chrome or Edge recommended) and click the microphone button.

Notes & next steps:
- Right now the backend parses numbers and a recipient name with a naive regex. For production wire a proper NLU (Google ADK / Dialogflow) and a real payment provider (Stripe, sandbox API).
- Keep `.env` out of source control. Use `.env.example` as a template.
- If you want I can add Google ADK integration scaffolding and a Stripe sandbox example.