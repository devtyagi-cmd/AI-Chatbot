# AI Data Chatbot — Milestone 1

Upload one CSV or Excel file, see a quick profile of it, then ask questions
in plain English and get back a text answer, a data table, and a chart —
all computed only from that file.

```
ai-data-chatbot/
  frontend/     # Next.js app (upload UI + chat UI)
  backend/      # FastAPI app (pandas + DuckDB + OpenAI tool calling)
  uploads/      # temporary local uploaded files (gitignored)
  sample_data/  # sample sales.csv to try the milestone flow with
```

## How it works

1. **Upload** — the frontend posts the file to `POST /api/upload`. The
   backend reads it with `pandas` (`read_csv` / `read_excel`), registers it
   as a table named `data` in an in-memory **DuckDB** connection, and
   returns a profile: column names + dtypes, row count, missing values per
   column, and a 10-row preview.
2. **Ask** — the frontend posts a question to `POST /api/chat`. The backend
   sends the question to OpenAI along with the file's schema and two tools:
   - `run_sql` — lets the model run a read-only `SELECT` against the `data`
     table to get real numbers (validated to block anything but a single
     `SELECT`/`WITH` statement — no `INSERT`/`DROP`/etc).
   - `final_answer` — lets the model end the turn with a plain-English
     explanation plus a chart suggestion (type + x/y columns) based on the
     last query's result.
   The backend executes each `run_sql` call itself (the model never touches
   data directly), loops until `final_answer` is called, and returns
   `{ answer, sql, table, chart }` to the frontend.
3. **Render** — the frontend shows the text answer, the result as a table,
   and a bar/line/pie chart (via `recharts`) built from that same table.

Nothing here does logins, PDFs, forecasting, or vector databases — those are
explicitly out of scope for this milestone. Swapping the in-memory file/session
store for PostgreSQL later is a small, isolated change (`backend/app/data_store.py`
is the only place that would need to change).

## Prerequisites

- Python 3.10+
- Node.js 18+
- An OpenAI API key with access to a tool-calling model

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...

uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

## Frontend setup

```bash
cd frontend
npm install

# only needed if your backend isn't on localhost:8000
cp .env.local.example .env.local

npm run dev
```

Open `http://localhost:3000`.

## Try the milestone flow

1. Go to `http://localhost:3000`.
2. Upload `sample_data/sales.csv` (included in this repo).
3. You should see: 20 rows, 8 columns, 2 rows with missing `quantity` /
   `total_sales`, and a preview table.
4. Ask: **"What is total sales by month?"**
5. You should get back a sentence explaining the monthly totals, a table of
   month → total, and a bar chart of the same data.

Other things worth trying against the sample file:
- "Which region has the highest total sales?"
- "How many orders came from each category?"
- "What's the average unit price by category?"

## API reference (current)

`POST /api/upload` — multipart form, field `file`. Returns:
```json
{
  "file_id": "a1b2c3d4e5f6",
  "filename": "sales.csv",
  "profile": {
    "row_count": 20,
    "column_count": 8,
    "columns": [{ "name": "order_id", "dtype": "int64" }, ...],
    "missing_values": { "quantity": 2, "total_sales": 2 },
    "preview": [ { "order_id": 1001, "order_date": "2024-01-05", ... }, ... ]
  }
}
```

`POST /api/chat` — JSON body `{ "file_id": "...", "question": "..." }`. Returns:
```json
{
  "answer": "Total sales by month: January $1,135.00, February $2,026.50, ...",
  "sql": "SELECT strftime(CAST(order_date AS DATE), '%Y-%m') AS month, SUM(total_sales) AS total FROM data GROUP BY 1 ORDER BY 1",
  "table": { "columns": ["month", "total"], "rows": [...], "truncated": false },
  "chart": { "type": "bar", "x": "month", "y": "total", "title": "Total sales by month", "data": [...] }
}
```

## Known limitations (by design, for now)

- One file at a time, in-memory only — restarting the backend clears
  everything. Uploading a new file doesn't delete the old session, but
  there's no session listing/cleanup UI yet.
- No auth — anyone who can reach the API can upload/query. Fine for local
  use, not for deploying publicly as-is.
- No chat history persistence — refreshing the page clears the conversation.
- The model can only see schema + query results it asks for, not the whole
  file, so very open-ended questions ("tell me everything interesting")
  will get fairly narrow answers. That's intentional — it keeps answers
  grounded in real computed numbers instead of the model's own guesses.

## Packaging as a Windows desktop app

There's an Electron wrapper in `desktop/` that packages this into a
standalone Windows `.exe` (backend runs as a hidden background process,
frontend is served as static files, no terminal needed to use it). See
`desktop/BUILD.md` for the full step-by-step.

## Suggested next milestones

1. Persist file metadata + chat history in PostgreSQL (swap out `data_store.py`).
2. Multi-turn context: let follow-up questions reference the previous query's result.
3. Support querying across more than one uploaded file/table.
4. Streaming responses (SSE) instead of waiting for the full tool-calling loop.
5. Basic auth / per-user file isolation before any shared deployment.
