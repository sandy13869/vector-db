import { deleteDocument } from "../api";

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
      onChanged?.();
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (loading) return <p className="mt-4 text-sm text-slate-400">Loading documents…</p>;
  if (error) return <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!documents.length) {
    return <p className="mt-4 text-sm text-slate-400">No PDFs uploaded yet.</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      <li>
        <button
          onClick={() => onSelect(null)}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
            !activeDocId ? "bg-brand-100 font-medium text-brand-700" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          🔍 Search all documents
        </button>
      </li>
      {documents.map((doc) => (
        <li key={doc.docId}>
          <div
            onClick={() => onSelect(doc.docId)}
            className={`group flex cursor-pointer items-start justify-between gap-2 rounded-lg px-3 py-2 transition ${
              activeDocId === doc.docId ? "bg-brand-100" : "hover:bg-slate-100"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700" title={doc.filename}>
                {doc.filename}
              </p>
              <p className="text-xs text-slate-400">
                {doc.numPages} pages · {doc.chunkCount} chunks · {formatSize(doc.sizeBytes)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.docId)}
              className="shrink-0 rounded p-1 text-slate-400 transition hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={`Delete ${doc.filename}`}
              title="Delete"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
