"""
Tool (function) definitions handed to the OpenAI API. Two tools:

- run_sql: the model's only way to touch real data. It must call this to get
  actual numbers instead of guessing.
- final_answer: how the model ends the turn - a natural language explanation
  plus a suggestion for how to chart the last run_sql result.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_sql",
            "description": (
                "Run a read-only SQL SELECT query (DuckDB dialect) against the table "
                "named 'data', which holds the user's uploaded file. Always use this "
                "tool to compute real numbers - never guess or make up values. You may "
                "call it multiple times to explore the data before answering."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "A single SELECT (or WITH ... SELECT) statement querying the 'data' table.",
                    },
                    "purpose": {
                        "type": "string",
                        "description": "One short sentence on what this query is trying to find out.",
                    },
                },
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "final_answer",
            "description": (
                "Give the final answer to the user's question. Call this once you have "
                "enough information from run_sql results. This ends the turn."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "answer": {
                        "type": "string",
                        "description": "A clear, concise natural-language explanation of the answer, citing the actual numbers found.",
                    },
                    "chart_type": {
                        "type": "string",
                        "enum": ["bar", "line", "pie", "none"],
                        "description": "Best chart type for visualizing the most recent run_sql result, or 'none' if a chart doesn't make sense for this question.",
                    },
                    "x_column": {
                        "type": "string",
                        "description": "Column name (from the most recent run_sql result) to use as the chart's category/x-axis. Empty string if chart_type is 'none'.",
                    },
                    "y_column": {
                        "type": "string",
                        "description": "Column name (from the most recent run_sql result) to use as the chart's numeric value/y-axis. Empty string if chart_type is 'none'.",
                    },
                    "chart_title": {
                        "type": "string",
                        "description": "Short, descriptive chart title.",
                    },
                },
                "required": ["answer", "chart_type"],
            },
        },
    },
]
