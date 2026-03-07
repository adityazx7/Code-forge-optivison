"""
AI Chatbot Module — OptiVision AI
RAG-powered chatbot using local Ollama (Llama 3) for data narrative generation.
"""

import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from backend.auth import get_current_user
from backend.duckdb_engine import get_market_summary, get_strike_analysis, get_iv_context

router = APIRouter(prefix="/api", tags=["chatbot"])

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

SYSTEM_PROMPT = """You are OptiVision AI Assistant — an expert quant analyst specializing in NIFTY options market analysis.

Your role is "Data Narrative Generation": you explain complex market data in clear, actionable English.

You can analyze:
- 3D Volatility Surfaces and IV patterns
- Unusual volume clusters and OI buildup
- Put-Call Ratio trends and market sentiment
- Max Pain calculations and expiry dynamics
- Anomalous market activity detected by Isolation Forest ML

When given market data context, you should:
1. Identify key patterns and trends
2. Explain what they mean for traders
3. Suggest potential strategies (e.g., "This volatility skew suggests...")
4. Use industry terminology but explain it simply
5. Be concise and actionable

Always mention this is based on historical data analysis, not financial advice."""


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    context_used: bool


def _build_rag_context(user_message: str) -> str:
    """Build RAG context by querying DuckDB based on user's question."""
    context_parts = []

    try:
        # Always include market summary
        summary = get_market_summary()
        if summary and "error" not in summary:
            context_parts.append(f"MARKET SUMMARY: {json.dumps(summary, default=str)}")

        # Include top strikes if asking about strikes/OI/volume
        keywords = ["strike", "oi", "volume", "activity", "cluster", "zone"]
        if any(kw in user_message.lower() for kw in keywords):
            strikes = get_strike_analysis()
            if strikes and "error" not in str(strikes):
                context_parts.append(f"TOP ACTIVE STRIKES: {json.dumps(strikes[:5], default=str)}")

        # Include IV context if asking about volatility
        iv_keywords = ["volatil", "iv", "surface", "skew", "premium", "spread"]
        if any(kw in user_message.lower() for kw in iv_keywords):
            iv_data = get_iv_context()
            if iv_data and "error" not in str(iv_data):
                context_parts.append(f"IV/PREMIUM ANALYSIS: {json.dumps(iv_data[:5], default=str)}")
    except Exception as e:
        context_parts.append(f"(Data retrieval error: {e})")

    return "\n".join(context_parts) if context_parts else ""


async def _call_ollama(prompt: str, context: str = "") -> str:
    """Call local Ollama API with the prompt."""
    full_prompt = f"{SYSTEM_PROMPT}\n\n"
    if context:
        full_prompt += f"CURRENT MARKET DATA:\n{context}\n\n"
    full_prompt += f"USER QUESTION: {prompt}\n\nANALYSIS:"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 512,
                },
            },
        )
        response.raise_for_status()
        return response.json().get("response", "No response generated.")


async def _stream_ollama(prompt: str, context: str = ""):
    """Stream response from Ollama for SSE."""
    full_prompt = f"{SYSTEM_PROMPT}\n\n"
    if context:
        full_prompt += f"CURRENT MARKET DATA:\n{context}\n\n"
    full_prompt += f"USER QUESTION: {prompt}\n\nANALYSIS:"

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": full_prompt,
                "stream": True,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 512,
                },
            },
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield f"data: {json.dumps({'token': token})}\n\n"
                        if data.get("done", False):
                            yield f"data: {json.dumps({'done': True})}\n\n"
                            break
                    except json.JSONDecodeError:
                        continue


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    """Send a message to the AI chatbot (non-streaming)."""
    context = _build_rag_context(req.message)

    try:
        response = await _call_ollama(req.message, context)
        return ChatResponse(response=response, context_used=bool(context))
    except httpx.ConnectError:
        return ChatResponse(
            response="⚠️ Ollama is not running. Please start Ollama with `ollama serve` and ensure Llama 3 is pulled (`ollama pull llama3`). The chatbot requires a local Ollama instance to function.",
            context_used=False,
        )
    except Exception as e:
        return ChatResponse(
            response=f"⚠️ Error communicating with AI model: {str(e)}",
            context_used=False,
        )


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, user: dict = Depends(get_current_user)):
    """Stream a response from the AI chatbot via SSE."""
    context = _build_rag_context(req.message)

    try:
        # Test connection first
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.get("http://localhost:11434/api/tags")
    except Exception:
        async def error_stream():
            yield f"data: {json.dumps({'token': '⚠️ Ollama is not running. Start it with `ollama serve` and pull Llama 3.'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(error_stream(), media_type="text/event-stream")

    return StreamingResponse(
        _stream_ollama(req.message, context),
        media_type="text/event-stream",
    )
