import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { askQuestion } from "../api";
import { playClick, playSend, playResponse, playError } from "../utils/sounds";

/* ── Icons ────────────────────────────────────────────── */
function SparkleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm">
      U
    </div>
  );
}

function BotIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white shadow-sm">
      AIrah
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

/* ── Typing dots ──────────────────────────────────────── */
function TypingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

/* ── Code block renderer ──────────────────────────────── */
function CodeBlock({ className, children, style }) {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  // Detect dark mode by checking parent
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 last:mb-0">
      {lang && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <span>{lang}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="rounded px-2 py-0.5 text-[10px] transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Copy
          </button>
        </div>
      )}
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={lang || "text"}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8125rem" }}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function ChatPanel({ activeDocId, activeDocName, hasDocuments, scopeKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [scopeKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scopeKey, hasDocuments]);

  async function send(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    playSend();
    setLoading(true);

    try {
      const res = await askQuestion(question, activeDocId);
      if (res.found) {
        setMessages((m) => [...m, { role: "assistant", text: res.answer, matches: res.matches }]);
        playResponse();
      } else {
        setMessages((m) => [...m, { role: "assistant", notFound: true, text: res.message, suggestions: res.suggestions || [] }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", error: true, text: err.message }]);
      playError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-4 transition-colors dark:border-slate-700 sm:px-6">
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Ask your PDFs</h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {activeDocId ? (
            <>
              Scoped to:{" "}
              <span className="font-medium text-brand-600 dark:text-brand-400">{activeDocName}</span>
            </>
          ) : (
            "Searching across all uploaded documents"
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/50 dark:to-brand-800/50">
              <SparkleIcon />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {hasDocuments
                ? "Ask AIrah anything about your PDFs"
                : "Upload a PDF on the sidebar to get started"}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {hasDocuments
                ? "AIrah searches the content and gives you answers with sources."
                : "Supports PDF, up to 50 MB each."}
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Message
              key={`${msg.role}-${i}`}
              msg={msg}
              index={i}
              onSuggestionClick={(text) => {
                setInput(text);
                inputRef.current?.focus();
              }}
            />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-1 py-2"
          >
            <BotIcon />
            <div className="flex items-center rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Searching
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm transition-colors dark:border-slate-700 dark:bg-slate-900/80">
        <form onSubmit={send} className="p-4">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(e);
                  }
                }}
                rows={1}
                placeholder={hasDocuments ? "Type your question here…" : "Upload a PDF first"}
                disabled={!hasDocuments || loading}
                maxLength={2000}
                aria-label="Question"
                className="max-h-32 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:focus:bg-slate-800 dark:focus:ring-brand-400/20"
              />
              <button
                type="submit"
                disabled={!hasDocuments || loading || !input.trim()}
                className="absolute bottom-2 right-2 rounded-lg bg-brand-600 p-2 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-500 dark:hover:bg-brand-600"
                aria-label="Send"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-600">
            Press Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Individual message ───────────────────────────────── */
function Message({ msg, index, onSuggestionClick }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        className="flex items-start justify-end gap-3 px-1 py-2"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap">{msg.text}</p>
        </div>
        <UserIcon />
      </motion.div>
    );
  }

  if (msg.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="flex items-start gap-3 px-1 py-2"
      >
        <BotIcon />
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-400">
          <div className="mb-1 flex items-center gap-1.5 font-medium">
            <ErrorIcon />
            <span>Error</span>
          </div>
          <p className="whitespace-pre-wrap">{msg.text}</p>
        </div>
      </motion.div>
    );
  }

  if (msg.notFound) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="flex items-start gap-3 px-1 py-2"
      >
        <BotIcon />
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300">
          <div className="mb-1 flex items-center gap-1.5 font-medium">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>No results found</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

          {/* Suggestion chips */}
          {msg.suggestions?.length > 0 && (
            <div className="mt-3 border-t border-amber-200/60 pt-3 dark:border-amber-700/40">
              <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Try asking about:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {msg.suggestions.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => {
                      playClick();
                      onSuggestionClick?.(suggestion);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-white hover:shadow-md active:scale-95 dark:border-amber-600/60 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:border-amber-500 dark:hover:bg-amber-900/60"
                  >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-start gap-3 px-1 py-2"
    >
      <BotIcon />
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <div className="prose-response">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm font-mono dark:bg-white/10" {...props}>
                      {children}
                    </code>
                  );
                }
                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {msg.matches?.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-700">
            {/* Collapsed pill — always visible */}
            <button
              onClick={() => { playClick(); setSourcesOpen((o) => !o); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {sourcesOpen ? "Hide sources" : `View ${msg.matches.length} source${msg.matches.length > 1 ? "s" : ""}`}
              </span>
              <svg
                className={`ml-auto h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${sourcesOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Expandable source cards */}
            <AnimatePresence initial={false}>
              {sourcesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pb-1 pt-1">
                    {msg.matches.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-xs transition hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            {m.source}
                            {m.page ? ` · p. ${m.page}` : ""}
                          </span>
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                            {m.score.toFixed(2)}
                          </span>
                        </div>
                        <p className="line-clamp-3 leading-relaxed text-slate-500 dark:text-slate-400">{m.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
