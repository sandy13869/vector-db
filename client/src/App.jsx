import { useEffect, useState, useCallback } from "react";
import UploadPanel from "./components/UploadPanel";
import DocumentList from "./components/DocumentList";
import ChatPanel from "./components/ChatPanel";
import { listDocuments } from "./api";
import { playClick } from "./utils/sounds";

function SunIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentError, setDocumentError] = useState("");
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const refresh = useCallback(async () => {
    try {
      setDocumentError("");
      const res = await listDocuments();
      setDocuments(res.data || []);
    } catch (e) {
      setDocumentError(e.message);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // If the active document was deleted, fall back to "all documents".
  useEffect(() => {
    if (activeDocId && !documents.some((d) => d.docId === activeDocId)) {
      setActiveDocId(null);
    }
  }, [documents, activeDocId]);

  const activeDocName = documents.find((d) => d.docId === activeDocId)?.filename;

  return (
    <div className="flex min-h-full flex-col bg-panel text-slate-800 transition-colors duration-200 dark:bg-panel-dark dark:text-slate-100 lg:h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/80 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
            V
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-brand-600 dark:text-brand-400">PDF</span> Vector Search
              <span className="ml-1.5 text-[10px] font-normal text-slate-400 dark:text-slate-500">by AIrah</span>
            </h1>
            <p className="hidden text-[11px] text-slate-400 sm:block">Upload PDFs, ask questions — AIrah answers from their content</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            className="hidden text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 sm:block"
            href="/api-docs"
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </a>

          {/* Theme toggle */}
          <button
            onClick={() => { playClick(); setDark((d) => !d); }}
            className="theme-toggle-btn"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            <span className="flex w-full items-center justify-between px-0.5">
              <SunIcon />
              <MoonIcon />
            </span>
            <span className="theme-toggle-knob absolute left-1 top-0.5 flex items-center justify-center transition-transform duration-300 dark:translate-x-6" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        {/* Sidebar */}
        <aside className="shrink-0 border-b border-slate-200 bg-white/50 backdrop-blur-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/50 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
          <div className="p-4 lg:p-0">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Upload
            </h2>
            <UploadPanel
              onUploaded={() => {
                refresh();
              }}
              documentCount={documents.length}
            />

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Documents
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {documents.length}/10
              </span>
            </div>
            <DocumentList
              documents={documents}
              loading={loadingDocuments}
              error={documentError}
              activeDocId={activeDocId}
              onSelect={setActiveDocId}
              onChanged={refresh}
            />
          </div>
        </aside>

        {/* Main chat area */}
        <main className="min-h-[32rem] flex-1 overflow-hidden bg-white transition-colors duration-200 dark:bg-slate-900 lg:min-h-0">
          <ChatPanel
            activeDocId={activeDocId}
            activeDocName={activeDocName}
            hasDocuments={documents.length > 0}
            scopeKey={activeDocId || "all"}
          />
        </main>
      </div>
    </div>
  );
}
