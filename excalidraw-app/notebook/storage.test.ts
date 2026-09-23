import { clear, createStore, get } from "idb-keyval";
import { beforeEach, describe, expect, it } from "vitest";
import { createNotebook, createPage } from "./model";
import { listNotebooks, saveNotebook } from "./storage";

const store = createStore("draw-notebooks-v1", "notebooks");

beforeEach(async () => {
  await clear(store);
});

describe("offline notebook storage", () => {
  it("round-trips independent pages and paper styles", async () => {
    const note = createNotebook();
    note.pages.push(createPage("grid"));
    await saveNotebook(note);
    const [loaded] = await listNotebooks();
    expect(loaded.pages).toEqual(note.pages);
    expect(loaded.pages[0].id).not.toBe(loaded.pages[1].id);
    expect(loaded.revision).toBe(1);
  });

  it("keeps independent notes and returns most recently edited first", async () => {
    const older = { ...createNotebook(), updatedAt: 100 };
    const newer = { ...createNotebook(), updatedAt: 200 };
    await saveNotebook(older);
    await saveNotebook(newer);
    expect((await listNotebooks()).map((note) => note.id)).toEqual([
      newer.id,
      older.id,
    ]);
  });

  it("rejects stale writes without overwriting the latest copy", async () => {
    const note = createNotebook();
    const revision = await saveNotebook(note);
    await saveNotebook({ ...note, revision, title: "Latest" });
    await expect(
      saveNotebook({ ...note, revision, title: "Stale" }),
    ).rejects.toThrow("another tab");
    expect((await get(note.id, store)).title).toBe("Latest");
  });

  it("allows only one concurrent writer for a revision", async () => {
    const note = createNotebook();
    const results = await Promise.allSettled([
      saveNotebook({ ...note, title: "Tab A" }),
      saveNotebook({ ...note, title: "Tab B" }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
  });
});
