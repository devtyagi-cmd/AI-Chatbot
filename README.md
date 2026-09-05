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

