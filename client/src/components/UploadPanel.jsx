import { useRef, useState } from "react";
import { uploadPdf } from "../api";
import { playClick, playSuccess, playError } from "../utils/sounds";

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_DOCS = 10;

export default function UploadPanel({ onUploaded, documentCount = 0 }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const atLimit = documentCount >= MAX_DOCS;

  async function handleFile(file) {
    setError("");
    setSuccess("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      playError();
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum allowed size is 50 MB.");
      playError();
      return;
    }
    try {
      setProgress(0);
      const res = await uploadPdf(file, setProgress);
      setProgress(null);
      setSuccess(`${res.data.filename} is ready to search.`);
      playSuccess();
      onUploaded?.(res.data);
    } catch (e) {
      setProgress(null);
      setError(e.message);
      playError();
    }
  }

  return (
    <div>
      <div
        onClick={() => {
          if (!atLimit) { playClick(); inputRef.current?.click(); }
        }}
        onDragOver={(e) => {
          if (atLimit) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!atLimit) handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          atLimit
            ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30"
            : dragging
              ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30"
              : "border-slate-300 hover:border-brand-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-brand-400 dark:hover:bg-slate-800/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={atLimit}
        />
        <div className={`text-3xl ${atLimit ? "opacity-50" : ""}`}>
          {atLimit ? "🚫" : "📄"}
        </div>
        <p className={`mt-2 text-sm font-medium ${atLimit ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
          {atLimit
            ? "Storage limit reached"
            : (
              <>
                Drop a PDF here or <span className="text-brand-600 dark:text-brand-400">browse</span>
              </>
            )}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {atLimit
            ? "Delete an existing document to upload more"
            : `Max 50 MB · ${documentCount}/${MAX_DOCS} used`}
        </p>
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {progress < 100 ? `Uploading… ${progress}%` : "Processing & embedding…"}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 animate-fade-in rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-400">
          {success}
        </div>
      )}
    </div>
  );
}
