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
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 flex flex-col gap-4 border border-white/10">
      <h3 className="font-display italic text-lg text-white">Ask your data</h3>

      {historyLoading && (
        <p className="text-xs text-mist-400 flex items-center gap-1.5">
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
              className="inline-flex items-center gap-1.5 text-xs bg-white/[0.03] hover:bg-brass-500/10 hover:text-brass-400 border border-white/10 hover:border-brass-500/30 transition-colors rounded-full px-3 py-1.5 text-mist-300"
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
            {/* User message, right-aligned */}
            <div className="flex justify-end gap-2 animate-fade-in">
              <div className="bg-brass-500 text-ink-950 rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm max-w-[80%] font-medium">
                {ex.question}
              </div>
              <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                <User size={13} className="text-mist-300" />
              </div>
            </div>

            {/* Assistant response, left-aligned */}
            <div className="flex gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-md bg-brass-500/15 border border-brass-500/25 flex items-center justify-center shrink-0">
                <Bot size={13} className="text-brass-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                {ex.loading && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl rounded-tl-sm px-3.5 py-3 space-y-2 max-w-[85%]">
                    <LoadingDots />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                )}

                {ex.error && <StatusBanner kind="error" message={ex.error} />}

                {ex.response && (
                  <>
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-mist-100/90 whitespace-pre-wrap max-w-[85%]">
                      {ex.response.answer}
                    </div>

                    {ex.response.table && ex.response.table.rows.length > 0 && (
                      <DataTable table={ex.response.table} />
                    )}

                    {ex.response.chart && <ChartRenderer chart={ex.response.chart} />}

                    {ex.response.sql && (
                      <details className="text-xs text-mist-400">
                        <summary className="cursor-pointer select-none hover:text-mist-300 transition-colors">
                          SQL used
                        </summary>
                        <pre className="whitespace-pre-wrap mt-1 bg-black/30 border border-white/10 rounded-lg p-2 font-mono text-[11px] text-mist-300">
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

      <div className="flex gap-2 pt-1 border-t border-white/10">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder='e.g. "What is total sales by month?"'
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-mist-100 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-brass-500/30 focus:border-brass-500/40 transition-shadow"
        />
        <button
          onClick={() => ask(question)}
          disabled={!question.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brass-500 hover:bg-brass-600 active:bg-brass-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-ink-950 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brass-400/50"
        >
          <Send size={14} />
          Ask
        </button>
      </div>
    </div>
  );
}
