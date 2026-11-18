import asyncio
import hashlib
import json
import os
from typing import Dict, List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(
    title="PyFix AI API",
    description="Production-ready Python debugging, AST diffing, and interactive explanation API.",
    version="1.0.0",
)

# Configure CORS from ALLOWED_ORIGINS env var (comma-separated)
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    query: str = Field(default="", description="User debugging question or intent.")
    code: str = Field(..., min_length=1, description="Python source code to analyze.")
    mode: Literal["beginner", "interview"] = Field(
        default="beginner",
        description="Explanation depth mode.",
    )


class ErrorAnalysis(BaseModel):
    has_error: bool
    error_type: str
    error_line: int
    plain_english_reason: str
    fix_summary: str


class FunctionBreakdownItem(BaseModel):
    name: str
    syntax: str
    purpose: str
    time_complexity: str
    mini_example: str


class AnalyzeResponse(BaseModel):
    corrected_code: str
    error_analysis: ErrorAnalysis
    step_by_step_explanation: List[str]
    functions_breakdown: List[FunctionBreakdownItem]
    tokens_used: int


# Simple in-memory cache keyed by SHA-256 of (code + query + mode)
ANALYSIS_CACHE: Dict[str, AnalyzeResponse] = {}


def _build_cache_key(code: str, query: str, mode: str) -> str:
    payload = json.dumps({"code": code, "query": query.strip(), "mode": mode}, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _get_genai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server.",
        )
    return genai.Client(api_key=api_key)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "pyfix-ai-backend"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_code(payload: AnalyzeRequest) -> AnalyzeResponse:
    if not payload.code.strip() and not payload.query.strip():
        raise HTTPException(status_code=400, detail="Please provide Python code or a question.")

    cache_key = _build_cache_key(payload.code, payload.query, payload.mode)
    if cache_key in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[cache_key]

    mode_guidance = (
        "Target audience is a Python beginner: use clear, jargon-free plain English, "
        "explain why the bug happens conceptually, and keep mini examples short and runnable."
        if payload.mode == "beginner"
        else "Target audience is a software engineer preparing for technical interviews: "
        "focus on edge cases, algorithmic bottlenecks, Big-O time/space complexity, and idiomatic Python."
    )

    system_instruction = (
        "You are PyFix AI, a senior Python debugging and code-intelligence engine. "
        f"{mode_guidance} "
        "Inspect the submitted Python code carefully. Identify any syntax, runtime, or logical bugs "
        "(1-based error_line; set has_error=false and error_line=0 if code has no bugs, and provide "
        "clean idiomatic improvements if helpful). Provide step_by_step_explanation sentences that "
        "explicitly name key Python built-ins, methods, or constructs listed in functions_breakdown "
        "(such as `enumerate()`, `map()`, `zip()`, `set()`, etc.) so interactive tooltips attach cleanly."
    )

    user_prompt = (
        f"Mode: {payload.mode}\n"
        f"User Question: {payload.query.strip() or 'Find and fix all bugs, and explain how this code works.'}\n\n"
        f"Python Code:\n```python\n{payload.code}\n```"
    )

    try:
        client = _get_genai_client()
        response = None
        for attempt in range(3):
            try:
                response = await client.aio.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=AnalyzeResponse,
                    ),
                )
                break
            except Exception as exc:
                msg = str(exc)
                is_transient = any(code in msg for code in ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"))
                if is_transient and attempt < 2:
                    await asyncio.sleep(0.7 * (2 ** attempt))
                    continue
                raise

        if not response or not response.text:
            raise HTTPException(status_code=502, detail="Empty response from Gemini API.")

        parsed_data = json.loads(response.text)
        tokens_used = 0
        if getattr(response, "usage_metadata", None) and getattr(
            response.usage_metadata, "total_token_count", None
        ):
            tokens_used = int(response.usage_metadata.total_token_count)
        else:
            tokens_used = int(parsed_data.get("tokens_used", 0) or 0)

        parsed_data["tokens_used"] = tokens_used
        result = AnalyzeResponse(**parsed_data)

        # Bound cache size to 500 entries to prevent unbounded memory growth
        if len(ANALYSIS_CACHE) >= 500:
            oldest_key = next(iter(ANALYSIS_CACHE))
            ANALYSIS_CACHE.pop(oldest_key, None)
        ANALYSIS_CACHE[cache_key] = result

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}") from exc
