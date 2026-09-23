import { createStore, values, update } from "idb-keyval";
import type { Notebook } from "./model";

// Deliberately separate from the whiteboard scene and its image cleanup job.
const store = createStore("draw-notebooks-v1", "notebooks");

export const listNotebooks = async () => {
  const notes = await values<Notebook>(store);
  if (notes.some((note) => note.schemaVersion !== 1 || !note.pages?.length)) {
    throw new Error("This notebook format cannot be opened by this version.");
  }
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const saveNotebook = async (note: Notebook) => {
  // Compare and write in ONE IndexedDB transaction. Two tabs cannot silently
  // overwrite each other. The losing tab keeps its in-memory copy for backup.
  const saved = { ...note, revision: note.revision + 1 };
  await update<Notebook>(
    note.id,
    (stored) => {
      if ((stored?.revision ?? 0) !== note.revision) {
        throw new Error(
          "This note changed in another tab. Download a backup before reloading.",
        );
      }
      return saved;
    },
    store,
  );
  return saved.revision;
};
