from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

from ..data_store import get_or_load
from ..db import get_db_session, is_db_enabled
from ..models import ChatMessageRecord
from ..services.json_safe import records_json_safe
from ..services.sql_engine import SQLValidationError, run_sql_query
from ..services.tool_schemas import TOOLS

logger = logging.getLogger("ai_data_chatbot.chat")
logging.basicConfig(level=logging.INFO)

router = APIRouter()

_client: Optional[OpenAI] = None
MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MAX_TOOL_ITERATIONS = 6
MAX_ROWS_SENT_TO_MODEL = 50  # keep the model's context small even if the query returns more


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENROUTER_API_KEY is not configured on the server. Copy backend/.env.example to backend/.env and add your key.",
            )
        # OpenRouter exposes an OpenAI-compatible /chat/completions endpoint,
        # so the official openai SDK works unchanged - just point it at
        # OpenRouter's base URL and use an OpenRouter key.
        _client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)
    return _client


def save_chat_message(file_id: str, question: str, result: Dict[str, Any]) -> None:
    """Persists a completed Q&A turn so it's available in chat history
    (GET /api/history/{file_id}) even after a backend restart, until it
    ages out past the retention window. No-ops entirely if no database is
    configured (e.g. local dev)."""
    if not is_db_enabled():
        return
    try:
        with get_db_session() as db:
            db.add(
                ChatMessageRecord(
                    file_id=file_id,
                    question=question,
                    answer=result.get("answer", ""),
                    sql=result.get("sql"),
                    table_json=result.get("table"),
                    chart_json=result.get("chart"),
                )
            )
            db.commit()
    except Exception as e:
        # A history-logging failure shouldn't take down a successful answer
        # the user is about to receive.
        logger.warning("Failed to save chat history for file %s: %s", file_id, e)


class ChatRequest(BaseModel):
    file_id: str
    question: str


def build_system_prompt(profile: dict, filename: str) -> str:
    cols_desc = "\n".join(f"- {c['name']} ({c['dtype']})" for c in profile["columns"])
    return f"""You are a data analyst assistant. The user uploaded a file called "{filename}", loaded into a DuckDB table named "data".

Schema:
{cols_desc}

Row count: {profile['row_count']}

Rules:
- Only answer using data from the "data" table via the run_sql tool. Never invent numbers.
- Use DuckDB SQL syntax. Text columns that hold dates may need casting, e.g. CAST(col AS DATE) or strftime(CAST(col AS DATE), '%Y-%m').
- Prefer GROUP BY / aggregate functions for summary questions (totals, averages, counts, "by month/category/etc").
- Keep queries focused on exactly what's needed to answer the question.
- When you have enough information, call final_answer with a clear explanation (mention the real numbers) and a chart suggestion.
- If the question can't be answered from this data, say so honestly in final_answer with chart_type "none".
"""


@router.post("/chat")
async def chat(req: ChatRequest) -> Dict[str, Any]:
    session = get_or_load(req.file_id)
    if session is None:
        raise HTTPException(status_code=404, detail="File not found. Please upload it again.")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    client = get_client()

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": build_system_prompt(session.profile, session.filename)},
        {"role": "user", "content": req.question},
    ]

    last_table: Optional[Dict[str, Any]] = None
    last_sql: Optional[str] = None

    for iteration in range(MAX_TOOL_ITERATIONS):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
            )
        except Exception as e:
            logger.error("Model API call failed on iteration %d: %s", iteration, e)
            raise HTTPException(status_code=502, detail=f"OpenAI API error: {e}")

        msg = response.choices[0].message

        if not msg.tool_calls:
            logger.info(
                "Iteration %d: model replied without a tool call - using its text directly.",
                iteration,
            )
            # Model replied directly without using final_answer - surface its
            # text as the answer rather than erroring out.
            result = {
                "answer": msg.content or "I couldn't compute an answer from this file.",
                "sql": last_sql,
                "table": last_table,
                "chart": None,
            }
            save_chat_message(req.file_id, req.question, result)
            return result

        messages.append(msg.model_dump(exclude_unset=True))

        final_result: Optional[Dict[str, Any]] = None

        for tool_call in msg.tool_calls:
            name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments or "{}")
            except json.JSONDecodeError:
                logger.warning(
                    "Iteration %d: could not parse arguments for tool '%s': %r",
                    iteration,
                    name,
                    tool_call.function.arguments,
                )
                args = {}

            if name == "run_sql":
                sql = args.get("sql", "")
                logger.info("Iteration %d: run_sql -> %s", iteration, sql)
                try:
                    result_df, truncated = run_sql_query(session.con, sql)
                    last_sql = sql
                    columns = [str(c) for c in result_df.columns]
                    rows = records_json_safe(result_df)
                    last_table = {"columns": columns, "rows": rows, "truncated": truncated}
                    tool_output = {
                        "columns": columns,
                        "row_count": len(rows),
                        "rows": rows[:MAX_ROWS_SENT_TO_MODEL],
                        "truncated": truncated,
                    }
                    logger.info(
                        "Iteration %d: run_sql succeeded, %d row(s) returned.",
                        iteration,
                        len(rows),
                    )
                except SQLValidationError as e:
                    logger.warning("Iteration %d: run_sql rejected - %s", iteration, e)
                    tool_output = {"error": str(e)}
                except Exception as e:
                    logger.warning("Iteration %d: run_sql failed - %s", iteration, e)
                    tool_output = {"error": f"Query failed: {e}"}

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_output),
                    }
                )

            elif name == "final_answer":
                logger.info("Iteration %d: final_answer -> %s", iteration, args)
                final_result = args
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"status": "ok"}),
                    }
                )

            else:
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": f"Unknown tool '{name}'"}),
                    }
                )

        if final_result is not None:
            chart = None
            chart_type = final_result.get("chart_type", "none")
            if chart_type and chart_type != "none" and last_table and last_table["rows"]:
                x_col = final_result.get("x_column")
                y_col = final_result.get("y_column")
                cols = last_table["columns"]
                if x_col in cols and y_col in cols:
                    chart = {
                        "type": chart_type,
                        "x": x_col,
                        "y": y_col,
                        "title": final_result.get("chart_title") or req.question,
                        "data": last_table["rows"],
                    }

            result = {
                "answer": final_result.get("answer", ""),
                "sql": last_sql,
                "table": last_table,
                "chart": chart,
            }
            save_chat_message(req.file_id, req.question, result)
            return result

        # No final_answer yet - loop again so the model can keep querying.

    logger.warning(
        "Gave up after %d iterations without final_answer. Last SQL tried: %s",
        MAX_TOOL_ITERATIONS,
        last_sql,
    )
    raise HTTPException(
        status_code=500,
        detail="The assistant couldn't settle on an answer in time. Try rephrasing your question.",
    )
