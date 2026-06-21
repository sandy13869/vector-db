import { useEffect, useState, useCallback } from "react";
import UploadPanel from "./components/UploadPanel";
import DocumentList from "./components/DocumentList";
import ChatPanel from "./components/ChatPanel";
import { listDocuments } from "./api";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentError, setDocumentError] = useState("");

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
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-800 lg:h-full">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold">
          <span className="text-brand-600">PDF</span> Vector Search
        </h1>
        <p className="text-xs text-slate-400">Upload PDFs, then ask questions answered from their content</p>
        <a className="hidden text-xs font-medium text-brand-600 hover:text-brand-700 sm:block" href="/api-docs" target="_blank" rel="noreferrer">
          API docs
        </a>
      </header>

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <aside className="shrink-0 border-b border-slate-200 bg-white p-4 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Upload</h2>
          <UploadPanel
            onUploaded={() => {
              refresh();
            }}
          />

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Documents</h2>
          <DocumentList
            documents={documents}
            loading={loadingDocuments}
            error={documentError}
            activeDocId={activeDocId}
            onSelect={setActiveDocId}
            onChanged={refresh}
          />
        </aside>

        <main className="min-h-[32rem] flex-1 overflow-hidden bg-white lg:min-h-0">
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
