import { useRef, useState } from "react";
import { uploadPdf } from "../api";

const MAX_BYTES = 50 * 1024 * 1024;

export default function UploadPanel({ onUploaded }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFile(file) {
    setError("");
    setSuccess("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum allowed size is 50 MB.");
      return;
    }
    try {
      setProgress(0);
      const res = await uploadPdf(file, setProgress);
      setProgress(null);
      setSuccess(`${res.data.filename} is ready to search.`);
      onUploaded?.(res.data);
    } catch (e) {
      setProgress(null);
      setError(e.message);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-500 hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="text-3xl">📄</div>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Drop a PDF here or <span className="text-brand-600">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Max 50 MB · text-based PDFs</p>
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {progress < 100 ? `Uploading… ${progress}%` : "Processing & embedding…"}
          </p>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
    </div>
  );
}
