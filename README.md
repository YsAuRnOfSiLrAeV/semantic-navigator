# Semantic Navigator

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**

## Backend (FastAPI)

From the repo root:

1) Create and activate a virtual environment:

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
```

2) Install dependencies:

```bat
pip install -r requirements.txt
```

3) Start the API server:

```bat
uvicorn app.main:app --reload
```

The backend will start on `http://127.0.0.1:8000`.

Notes:
- On the **first run**, the app will download the Hugging Face dataset + the embedding model, which can take a while.
- CORS is configured for the frontend dev server (`http://localhost:5173`).

## Frontend (React + Vite)

From the repo root:

1) Install dependencies:

```bat
cd frontend
npm install
```

2) Start the dev server:

```bat
npm run dev
```

Open the app at `http://localhost:5173`.

