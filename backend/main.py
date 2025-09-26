from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@dataclass
class PaymentRequest:
    name: str
    amount: float
    account: str | None = None
    note: str | None = None


def parse_payment_from_text(text: str) -> PaymentRequest:
    name = None
    amount = 0.0
    account = None

    import re

    amt = re.search(r"(\d+[\.,]?\d*)", text)
    if amt:
        try:
            amount = float(amt.group(1).replace(',', '.'))
        except Exception:
            amount = 0.0

    payto = re.search(r"(?:to|pay|for)\s+([A-Z]?[a-zA-Z0-9_'\-]+)", text)
    if payto:
        name = payto.group(1)

    acct = re.search(r"account\s+(\w+)", text, re.I)
    if acct:
        account = acct.group(1)

    return PaymentRequest(name=name or "Unknown", amount=amount, account=account, note=text)


class VoicePayload(BaseModel):
    text: str


@app.get("/", response_class=FileResponse)
async def get_home(request: Request):
    # Serve the static HTML file directly (templates/index.html)
    index_path = Path(__file__).parent / "templates" / "index.html"
    return FileResponse(str(index_path))


@app.post("/process_voice")
async def process_voice(payload: VoicePayload):
    """
    Accepts JSON { "text": "recognized speech text" }
    In a real app you'd forward the text to Google ADK / other NLU and then trigger a payment provider.
    This demo will parse naively and simulate a payment response.
    """
    text = payload.text or ""
    parsed = parse_payment_from_text(text)

    if parsed.amount <= 0:
        return JSONResponse(status_code=400, content={"status": "error", "message": "no amount found"})

    time.sleep(0.4)
    tx = uuid.uuid4().hex
    return {
        "status": "success",
        "transaction_id": tx,
        "name": parsed.name,
        "amount": parsed.amount,
        "account": parsed.account,
        "note": parsed.note,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
