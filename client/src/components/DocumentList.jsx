import { deleteDocument } from "../api";
import { playClick, playDelete } from "../utils/sounds";

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DocumentList({ documents, loading, error, activeDocId, onSelect, onChanged }) {
  async function handleDelete(e, docId) {
    e.stopPropagation();
    if (!window.confirm("Delete this PDF and all of its indexed chunks?")) return;
    try {
      await deleteDocument(docId);
      playDelete();
      onChanged?.();
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (loading) return <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">Loading documents…</p>;
  if (error) return <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{error}</p>;
  if (!documents.length) {
    return <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No PDFs uploaded yet.</p>;
  }

  return (
    <ul className="mt-4 space-y-1.5">
      <li>
        <button
          onClick={() => { playClick(); onSelect(null); }}
          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
            !activeDocId
              ? "bg-brand-100 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Search all documents
          </div>
        </button>
      </li>
      {documents.map((doc) => (
        <li key={doc.docId}>
          <div
            onClick={() => { playClick(); onSelect(doc.docId); }}
            className={`group flex cursor-pointer items-start justify-between gap-2 rounded-lg px-3 py-2.5 transition ${
              activeDocId === doc.docId
                ? "bg-brand-100 dark:bg-brand-900/40"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200" title={doc.filename}>
                <span className="mr-1.5">📄</span>
                {doc.filename}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {doc.numPages} pages · {doc.chunkCount} chunks · {formatSize(doc.sizeBytes)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.docId)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={`Delete ${doc.filename}`}
              title="Delete"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
