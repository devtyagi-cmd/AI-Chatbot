"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { ChatResponse, getHistory, sendChat } from "@/lib/api";
import DataTable from "./DataTable";
import ChartRenderer from "./ChartRenderer";
import LoadingDots from "./LoadingDots";
import Skeleton from "./Skeleton";
import StatusBanner from "./StatusBanner";

interface Exchange {
  question: string;
  response?: ChatResponse;
  error?: string;
  loading?: boolean;
}

const SUGGESTIONS = [
  "What is total sales by month?",
  "How many rows have missing values?",
  "What are the top 5 categories by total value?",
];

export default function ChatWindow({ fileId }: { fileId: string }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    getHistory(fileId).then((items) => {
      if (cancelled) return;
      setExchanges(
        items.map((item) => ({
          question: item.question,
          response: {
            answer: item.answer,
            sql: item.sql,
            table: item.table,
            chart: item.chart,
          },
        }))
      );
      setHistoryLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Only reload history when switching to a different file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [exchanges]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion("");

    const idx = exchanges.length;
    setExchanges((prev) => [...prev, { question: trimmed, loading: true }]);

    try {
      const response = await sendChat(fileId, trimmed);
      setExchanges((prev) => {
        const copy = [...prev];
        copy[idx] = { question: trimmed, response };
        return copy;
      });
    } catch (e) {
      setExchanges((prev) => {
        const copy = [...prev];
        copy[idx] = {
          question: trimmed,
          error: e instanceof Error ? e.message : "Something went wrong",
        };
        return copy;
      });
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 flex flex-col gap-4 border border-gray-100 shadow-sm">
      <h3 className="font-medium text-gray-800">Ask a question about your data</h3>

      {historyLoading && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <LoadingDots />
          Loading previous conversation...
        </p>
      )}

      {!historyLoading && exchanges.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="inline-flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-brand-50 hover:text-brand-700 border border-gray-200 hover:border-brand-200 transition-colors rounded-full px-3 py-1.5 text-gray-700"
            >
              <Sparkles size={12} />
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex flex-col gap-5 max-h-[520px] overflow-y-auto scroll-thin pr-1"
      >
        {exchanges.map((ex, i) => (
          <div key={i} className="flex flex-col gap-3">
            {/* User message bubble, right-aligned */}
            <div className="flex justify-end gap-2 animate-fade-in">
              <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm max-w-[80%]">
                {ex.question}
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-500" />
              </div>
            </div>

            {/* Assistant response, left-aligned */}
            <div className="flex gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-brand-700" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                {ex.loading && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-3 space-y-2 max-w-[85%]">
                    <LoadingDots />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                )}

                {ex.error && <StatusBanner kind="error" message={ex.error} />}

                {ex.response && (
                  <>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-700 whitespace-pre-wrap max-w-[85%]">
                      {ex.response.answer}
                    </div>

                    {ex.response.table && ex.response.table.rows.length > 0 && (
                      <DataTable table={ex.response.table} />
                    )}

                    {ex.response.chart && <ChartRenderer chart={ex.response.chart} />}

                    {ex.response.sql && (
                      <details className="text-xs text-gray-400">
                        <summary className="cursor-pointer select-none hover:text-gray-600 transition-colors">
                          SQL used
                        </summary>
                        <pre className="whitespace-pre-wrap mt-1 bg-gray-50 border border-gray-100 rounded-lg p-2">
                          {ex.response.sql}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder='e.g. "What is total sales by month?"'
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-shadow"
        />
        <button
          onClick={() => ask(question)}
          disabled={!question.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <Send size={14} />
          Ask
        </button>
      </div>
    </div>
  );
}
