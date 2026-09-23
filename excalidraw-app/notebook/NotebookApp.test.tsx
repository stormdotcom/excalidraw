import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotebookApp from "./NotebookApp";
import { listNotebooks, saveNotebook } from "./storage";
import type { Notebook, NotePage } from "./model";

vi.mock("./storage", () => ({ listNotebooks: vi.fn(), saveNotebook: vi.fn() }));
vi.mock("./PageEditor", () => ({
  PageEditor: ({
    page,
    onChange,
  }: {
    page: NotePage;
    onChange: (page: NotePage) => void;
  }) => (
    <button
      onClick={() => onChange({ ...page, appState: { name: "Written page" } })}
    >
      Write test stroke
    </button>
  ),
}));

beforeEach(() => {
  vi.mocked(listNotebooks).mockReset().mockResolvedValue([]);
  vi.mocked(saveNotebook)
    .mockReset()
    .mockImplementation(async (note) => note.revision + 1);
});

const startNote = async () => {
  render(<NotebookApp />);
  await waitFor(() => expect(screen.getByText("New note")).toBeEnabled());
  fireEvent.click(screen.getByText("New note"));
};

describe("notebook navigation", () => {
  it("flushes edits before switching pages and keeps the earlier page", async () => {
    await startNote();
    fireEvent.click(screen.getByText("Write test stroke"));
    fireEvent.click(screen.getByText("+ Add page"));
    await screen.findByText("Page 2");
    fireEvent.click(screen.getByText("All notes"));
    await screen.findByText("Recent notes");
    const saved = vi.mocked(saveNotebook).mock.calls.at(-1)![0];
    expect(saved.pages).toHaveLength(2);
    expect(saved.pages[0].appState.name).toBe("Written page");
    expect(saved.pages[1].appState.name).toBeUndefined();
  });

  it("stays in the editor with a backup action when storage fails", async () => {
    await startNote();
    vi.mocked(saveNotebook).mockRejectedValue(new Error("Storage is full"));
    fireEvent.click(screen.getByText("All notes"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Storage is full",
    );
    expect(screen.getByLabelText("Note title")).toBeInTheDocument();
    expect(screen.queryByText("Recent notes")).not.toBeInTheDocument();
    expect(screen.getByText("Retry save")).toBeEnabled();
  });

  it("saves edits made while a previous save is in flight before leaving", async () => {
    let release: (revision: number) => void = () => {};
    vi.mocked(saveNotebook).mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );
    await startNote();
    fireEvent.click(screen.getByText("All notes"));
    await waitFor(() => expect(saveNotebook).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Note title"), {
      target: { value: "Latest title" },
    });
    release(1);
    await screen.findByText("Recent notes");
    expect(saveNotebook).toHaveBeenCalledTimes(2);
    const saved: Notebook = vi.mocked(saveNotebook).mock.calls[1][0];
    expect(saved.title).toBe("Latest title");
    expect(saved.revision).toBe(1);
  });
});
