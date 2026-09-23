import { useEffect, useRef, useState } from "react";
import { exportNotebook } from "./exportNotebook";
import type { ExportFormat } from "./exportNotebook";
import type { Notebook } from "./model";

/**
 * Export pages as one PDF (every selected page in one file) or as PNG images
 * (one image per selected page).
 */
export const ExportDialog = ({
  note,
  currentPage,
  onClose,
}: {
  note: Notebook;
  currentPage: number;
  onClose: () => void;
}) => {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(note.pages.map((_, index) => index)),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [busy, onClose]);

  const toggle = (index: number) =>
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });

  const count = selected.size;
  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await exportNotebook(
        note,
        [...selected].sort((a, b) => a - b),
        format,
      );
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Export failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="notebook-dialog-backdrop"
      onClick={() => !busy && onClose()}
    >
      <div
        className="notebook-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notebook-export-title"
        tabIndex={-1}
        ref={dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="notebook-export-title">Export</h2>

        <fieldset className="notebook-dialog__formats">
          <legend>Format</legend>
          <label>
            <input
              type="radio"
              name="notebook-export-format"
              checked={format === "pdf"}
              onChange={() => setFormat("pdf")}
            />
            <span>
              <strong>PDF</strong>
              <small>All selected pages in one file, A4</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="notebook-export-format"
              checked={format === "png"}
              onChange={() => setFormat("png")}
            />
            <span>
              <strong>Images (PNG)</strong>
              <small>One image per selected page</small>
            </span>
          </label>
        </fieldset>

        <fieldset className="notebook-dialog__pages">
          <legend>Pages</legend>
          <div className="notebook-dialog__quick">
            <button
              type="button"
              onClick={() =>
                setSelected(new Set(note.pages.map((_, index) => index)))
              }
            >
              All pages
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set([currentPage]))}
            >
              This page
            </button>
          </div>
          <div className="notebook-dialog__page-list">
            {note.pages.map((page, index) => (
              <label key={page.id}>
                <input
                  type="checkbox"
                  checked={selected.has(index)}
                  onChange={() => toggle(index)}
                />
                Page {index + 1}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="notebook-dialog__error">
            {error}
          </p>
        )}

        <div className="notebook-dialog__actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="notebook-primary"
            disabled={!count || busy}
            onClick={() => void run()}
          >
            {busy
              ? "Exporting…"
              : format === "pdf"
              ? `Export PDF (${count} ${count === 1 ? "page" : "pages"})`
              : `Export ${count} ${count === 1 ? "image" : "images"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
