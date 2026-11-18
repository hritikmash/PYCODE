# PyFix AI

Production-grade Python debugging, AST diff analysis, interactive complexity breakdown, and in-browser WebAssembly execution platform.

---

## Architecture Overview

PyFix AI separates client presentation from LLM inference so API keys never reach browser bundles:

- **Frontend (`/src`)**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, `@monaco-editor/react`, `react-diff-viewer-continued`, `recharts`, and Pyodide WebAssembly (`v0.26.4`).
- **White-Label Configuration (`/src/config/brand.ts`)**: Centralized `BRAND_CONFIG` (`appName`, `logoUrl`, `primaryColor`, `supportEmail`, `costPerMillionTokensUsd`) enabling single-file rebranding.
- **FastAPI Backend (`/backend/main.py`)**: Async `POST /api/analyze` service using the official `google-genai` Python SDK (`gemini-2.5-flash`) with Pydantic `response_schema` structured outputs, SHA-256 request caching, and `ALLOWED_ORIGINS` CORS enforcement.
- **Integrated Express Preview Server (`/server.ts`, `/src/server/pyfixAnalyzer.ts`)**: Mirrors the `/api/analyze` structured output & SHA-256 cache contract for unified single-port execution (`http://localhost:3000`).

---

## Key Features

1. **Monaco Editor + Line Error Markers**: Highlights `error_analysis.error_line` in transparent red with gutter warning glyphs and displays a luminous scanning ring overlay during analysis.
2. **Git-Style Diff Viewer**: Side-by-side and unified diffs comparing submitted buggy Python against `corrected_code`.
3. **Browser Python WebAssembly Sandbox (Pyodide)**: Executes `corrected_code` directly in the browser with real `stdout` and `stderr` capture inside a collapsible terminal drawer.
4. **Interactive Function Chips**: Automatically detects Python built-ins and methods in `step_by_step_explanation` and attaches Framer Motion popover cards with syntax, purpose, Big-O complexity, and copyable mini examples.
5. **Analytics & History Sidebar**: Persists past analyses in `localStorage` with one-click restore/delete and renders a live `recharts` sparkline tracking session token usage and estimated API cost.

---

## Local Setup

### Option A: FastAPI Backend + Vite Frontend (Recommended Split Stack)

1. **Start the Python FastAPI Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export GEMINI_API_KEY="your_gemini_api_key"
export ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

uvicorn main:app --reload --port 8000
```

2. **Start the Vite Frontend**

```bash
npm install
VITE_API_BASE_URL="http://localhost:8000" npm run dev
```

*(Note: When pointing Vite directly to port `8000`, run `npx vite --port 5173` or update `VITE_API_BASE_URL` accordingly.)*

### Option B: Integrated Full-Stack Server (Port 3000)

```bash
npm install
export GEMINI_API_KEY="your_gemini_api_key"
npm run dev
```

Visit `http://localhost:3000`.

---

## White-Labeling

Edit `src/config/brand.ts`:

```ts
export const BRAND_CONFIG: BrandConfig = {
  appName: 'PyFix AI',
  tagline: 'Interactive Python Debugging & Code Intelligence',
  logoUrl: '',
  primaryColor: '#06B6D4',
  secondaryColor: '#38BDF8',
  supportEmail: 'support@pyfix.ai',
  companyName: 'PyFix Labs',
  costPerMillionTokensUsd: 0.30,
};
```

---

## Deployment (Vercel + Render)

### 1. Deploy Backend on Render
1. Create a new **Web Service** on [Render](https://render.com) pointing to this repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `pip install -r requirements.txt`.
4. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://pyfix-ai.vercel.app`).

### 2. Deploy Frontend on Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Framework Preset** to `Vite`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: Your Render backend URL (e.g., `https://pyfix-api.onrender.com`).
5. Deploy!
