import type { OrderedExcalidrawElement } from "../../packages/excalidraw/element/types";
import type { AppState, BinaryFiles } from "../../packages/excalidraw/types";

export const A4 = { width: 794, height: 1123 } as const;
export type Paper = "blank" | "ruled" | "grid";
export type NotePage = {
  id: string;
  paper: Paper;
  elements: readonly OrderedExcalidrawElement[];
  files: BinaryFiles;
  appState: Partial<AppState>;
};
export type Notebook = {
  schemaVersion: 1;
  id: string;
  title: string;
  updatedAt: number;
  revision: number;
  pages: NotePage[];
};

export const createPage = (paper: Paper = "ruled"): NotePage => ({
  id: crypto.randomUUID(),
  paper,
  elements: [],
  files: {},
  appState: {},
});

export const createNotebook = (): Notebook => ({
  schemaVersion: 1,
  id: crypto.randomUUID(),
  title: "Untitled note",
  updatedAt: Date.now(),
  revision: 0,
  pages: [createPage()],
});
