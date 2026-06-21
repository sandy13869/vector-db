import { useRef, useState, useEffect } from "react";
import { askQuestion } from "../api";

export default function ChatPanel({ activeDocId, activeDocName, hasDocuments, scopeKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [scopeKey]);

  async function send(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await askQuestion(question, activeDocId);
      if (res.found) {
        setMessages((m) => [...m, { role: "assistant", text: res.answer, matches: res.matches }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", notFound: true, text: res.message }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", error: true, text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-800">Ask your PDFs</h2>
        <p className="text-xs text-slate-400">
          {activeDocId ? `Scoped to: ${activeDocName}` : "Searching across all uploaded documents"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-sm text-slate-400">
            {hasDocuments
              ? "Ask a question about the content of your uploaded PDFs."
              : "Upload a PDF on the left to get started."}
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Searching the vector database…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-slate-200 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            rows={1}
            placeholder={hasDocuments ? "Type your question…" : "Upload a PDF first"}
            disabled={!hasDocuments || loading}
            maxLength={2000}
            aria-label="Question"
            className="max-h-32 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!hasDocuments || loading || !input.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-sm text-white">
          {msg.text}
        </div>
      </div>
    );
  }

  const tone = msg.error
    ? "bg-red-50 text-red-700"
    : msg.notFound
    ? "bg-amber-50 text-amber-800"
    : "bg-slate-100 text-slate-800";

  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm ${tone}`}>
        <p className="whitespace-pre-wrap">{msg.text}</p>

        {msg.matches?.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-slate-200 pt-2">
            <p className="text-xs font-medium text-slate-500">Sources</p>
            {msg.matches.map((m, i) => (
              <div key={i} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>
                    {m.source}
                    {m.page ? ` · page ${m.page}` : ""}
                  </span>
                  <span>score {m.score.toFixed(2)}</span>
                </div>
                <p className="line-clamp-3">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
