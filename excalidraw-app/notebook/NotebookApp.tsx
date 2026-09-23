import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { createNotebook, createPage } from "./model";
import type { Notebook, NotePage, Paper } from "./model";
import { listNotebooks, saveNotebook } from "./storage";
import { PageEditor } from "./PageEditor";
import { useNotebookTheme } from "./theme";
import { ExportDialog } from "./ExportDialog";
import { DRAW_LOGO_SHAPES } from "../../packages/excalidraw/components/LoadingMessage";
import {
  BackIcon,
  DownloadIcon,
  ExportIcon,
  ExitFullscreenIcon,
  FocusIcon,
  FullscreenIcon,
  MoonIcon,
  NotebookIcon,
  PlusIcon,
  SunIcon,
} from "./icons";
import "./notebook.scss";

const canFullscreen = () =>
  typeof document !== "undefined" &&
  !!document.fullscreenEnabled &&
  !!document.documentElement.requestFullscreen;

const DrawLogoMark = () => (
  <svg
    className="notebook-logo-mark"
    viewBox="10 14 100 94"
    aria-hidden="true"
    focusable="false"
  >
    {DRAW_LOGO_SHAPES.map((strokes, shapeIdx) => (
      <g key={shapeIdx}>
        {strokes.map((d, strokeIdx) => (
          <path key={strokeIdx} d={d} />
        ))}
      </g>
    ))}
  </svg>
);

/** Same sketchy logo as the whiteboard; links back to it. */
const DrawHomeLink = () => (
  <a
    className="notebook-logo"
    href="/"
    title="Back to the Draw whiteboard"
    aria-label="Draw whiteboard"
  >
    <DrawLogoMark />
    <span>Draw</span>
  </a>
);

const PAPERS: { value: Paper; label: string }[] = [
  { value: "blank", label: "Blank" },
  { value: "ruled", label: "Ruled" },
  { value: "grid", label: "Grid" },
];

/** Icon-only button like the whiteboard tool bar; the label is for tooltips and screen readers. */
const HeaderButton = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    className="notebook-header-button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
  >
    {icon}
    <span className="notebook-sr-only">{label}</span>
  </button>
);

export default function NotebookApp() {
  const [notes, setNotes] = useState<Notebook[]>([]);
  const [active, setActive] = useState<Notebook | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [focus, setFocus] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Opening notes…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useRef<Notebook | null>(null);
  const dirty = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<Promise<boolean> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useNotebookTheme();
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listNotebooks().then(
      (stored) => {
        if (!cancelled) {
          setNotes(stored);
          setReady(true);
          setStatus("Stored on this device");
        }
      },
      () => {
        if (!cancelled) {
          setError(
            "Notes could not be opened. Allow browser storage and reload. Existing notes have not been replaced.",
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const flush = useCallback((): Promise<boolean> => {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (pending.current) {
      return pending.current;
    }
    if (!dirty.current || !current.current) {
      return Promise.resolve(true);
    }
    const operation = Promise.resolve().then(async () => {
      try {
        while (dirty.current && current.current) {
          const note = structuredClone(current.current);
          const savedGeneration = generation.current;
          setStatus("Saving…");
          const revision = await saveNotebook(note);
          current.current = { ...current.current, revision };
          dirty.current = generation.current !== savedGeneration;
          setNotes((existing) => [
            { ...note, revision },
            ...existing.filter((item) => item.id !== note.id),
          ]);
        }
        setStatus("Saved on this device");
        setError("");
        return true;
      } catch (reason) {
        setStatus("Not saved");
        setError(
          reason instanceof Error
            ? reason.message
            : "Storage is unavailable. Download a backup before leaving.",
        );
        return false;
      } finally {
        pending.current = null;
      }
    });
    pending.current = operation;
    return operation;
  }, []);

  const change = useCallback(
    (note: Notebook, render = false) => {
      current.current = { ...note, updatedAt: Date.now() };
      dirty.current = true;
      generation.current++;
      setStatus("Unsaved changes");
      if (render) {
        setActive(current.current);
      }
      // A bounded throttle also saves during continuous handwriting.
      if (!timer.current) {
        timer.current = setTimeout(() => {
          void flush();
        }, 700);
      }
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    };
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        void flush();
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocus(false);
      }
    };
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [flush]);

  const openNote = (note: Notebook) => {
    current.current = note;
    setActive(note);
    setPageIndex(0);
  };

  const navigate = async (action: () => void) => {
    setBusy(true);
    if (await flush()) {
      action();
    }
    setBusy(false);
  };

  const updatePage = (page: NotePage) => {
    const note = current.current;
    if (note) {
      change({
        ...note,
        pages: note.pages.map((item) => (item.id === page.id ? page : item)),
      });
    }
  };

  const downloadBackup = () => {
    if (!current.current) {
      return;
    }
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify({
            format: "draw-notebook",
            notebook: current.current,
          }),
        ],
        { type: "application/json" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${
      current.current.title.replace(/[^a-z0-9 _-]/gi, "_") || "note"
    }.drawnote.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (root.current?.requestFullscreen) {
        await root.current.requestFullscreen();
      } else {
        setFocus(true);
        setStatus(
          "Focus mode enabled. Full screen is unavailable in this browser.",
        );
      }
    } catch {
      setFocus(true);
      setStatus("Focus mode enabled. The browser declined full screen.");
    }
  };

  const page = active?.pages[pageIndex];
  const setPaper = (paper: Paper) => {
    const note = current.current!;
    change(
      {
        ...note,
        pages: note.pages.map((item, index) =>
          index === pageIndex ? { ...item, paper } : item,
        ),
      },
      true,
    );
  };
  const startNewNote = () => {
    const note = createNotebook();
    openNote(note);
    change(note);
  };

  return (
    <div
      className={clsx("notebook excalidraw", {
        "theme--dark": theme === "dark",
        "notebook--focus": focus,
      })}
      ref={root}
    >
      {!focus && (
        <header className="notebook-header">
          <div className="notebook-island notebook-header__left">
            <DrawHomeLink />
            {active && (
              <HeaderButton
                icon={BackIcon}
                label="All notes"
                disabled={busy}
                onClick={() =>
                  void navigate(() => {
                    current.current = null;
                    setActive(null);
                  })
                }
              />
            )}
            {active ? (
              <input
                className="notebook-title"
                aria-label="Note title"
                value={active.title}
                maxLength={120}
                onChange={(event) =>
                  current.current &&
                  change(
                    { ...current.current, title: event.target.value },
                    true,
                  )
                }
              />
            ) : (
              <span className="notebook-title">My notes</span>
            )}
          </div>
          <span role="status" className="notebook-status">
            {status}
          </span>
          <div className="notebook-island notebook-actions">
            {active && (
              <>
                <HeaderButton
                  icon={ExportIcon}
                  label="Export PDF or images"
                  onClick={() => setIsExportOpen(true)}
                />
                <HeaderButton
                  icon={DownloadIcon}
                  label="Download backup"
                  onClick={downloadBackup}
                />
                <HeaderButton
                  icon={FocusIcon}
                  label="Focus"
                  onClick={() => setFocus(true)}
                />
                {canFullscreen() && (
                  <HeaderButton
                    icon={fullscreen ? ExitFullscreenIcon : FullscreenIcon}
                    label={fullscreen ? "Exit full screen" : "Full screen"}
                    onClick={() => void toggleFullscreen()}
                  />
                )}
                <div className="notebook-divider" />
              </>
            )}
            <HeaderButton
              icon={theme === "dark" ? SunIcon : MoonIcon}
              label={theme === "dark" ? "Light mode" : "Dark mode"}
              onClick={toggleTheme}
            />
          </div>
        </header>
      )}
      {error && (
        <div role="alert" className="notebook-error">
          <span>{error}</span>
          {active && (
            <>
              <button onClick={() => void flush()}>Retry save</button>
              <button onClick={downloadBackup}>Download backup</button>
            </>
          )}
        </div>
      )}
      {!active ? (
        <main className="notebook-home">
          <div className="notebook-home__logo">
            <DrawLogoMark />
            <span>Notes</span>
          </div>
          <p className="notebook-home__heading">
            A4 pages for handwriting, sketches and ideas.
            <br />
            Everything stays in this browser.
          </p>
          <div className="notebook-home__menu">
            <button
              className="notebook-menu-item notebook-menu-item--primary"
              aria-label="New note"
              disabled={!ready || busy}
              onClick={startNewNote}
            >
              <span className="notebook-menu-item__icon">{PlusIcon}</span>
              <span className="notebook-menu-item__text">New note</span>
            </button>
            {notes.length > 0 && (
              <h2 className="notebook-home__section">Recent notes</h2>
            )}
            {ready && !notes.length && (
              <p className="notebook-home__empty">
                No notes yet. Create one to start writing.
              </p>
            )}
            <div className="notebook-list">
              {notes.map((note) => (
                <button
                  key={note.id}
                  className="notebook-menu-item"
                  onClick={() => openNote(note)}
                >
                  <span className="notebook-menu-item__icon">
                    {NotebookIcon}
                  </span>
                  <span className="notebook-menu-item__text">
                    {note.title || "Untitled note"}
                  </span>
                  <span className="notebook-menu-item__meta">
                    {note.pages.length}{" "}
                    {note.pages.length === 1 ? "page" : "pages"} ·{" "}
                    <time>{new Date(note.updatedAt).toLocaleDateString()}</time>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="notebook-storage-note">
            Clearing browser data removes local notes. Use Download backup
            inside a note to keep a separate copy.
          </p>
        </main>
      ) : (
        page && (
          <div className="notebook-workspace">
            {!focus && (
              <aside
                className="notebook-island notebook-sidebar"
                aria-label="Pages"
              >
                <div className="notebook-paper-options">
                  <span className="notebook-panel-label" id="notebook-paper">
                    Paper
                  </span>
                  <div
                    className="notebook-segmented"
                    role="radiogroup"
                    aria-labelledby="notebook-paper"
                  >
                    {PAPERS.map((paper) => (
                      <button
                        key={paper.value}
                        role="radio"
                        aria-checked={page.paper === paper.value}
                        aria-label={paper.label}
                        title={`${paper.label} paper`}
                        onClick={() => setPaper(paper.value)}
                      >
                        <span
                          className={`notebook-page-preview notebook-page-preview--${paper.value}`}
                        />
                      </button>
                    ))}
                  </div>
                  <small>A4 · 210 × 297 mm</small>
                </div>
                <span className="notebook-panel-label notebook-panel-label--pages">
                  Pages
                </span>
                <nav aria-label="Note pages">
                  {active.pages.map((item, index) => (
                    <button
                      key={item.id}
                      className="notebook-page-button"
                      disabled={busy}
                      aria-current={index === pageIndex ? "page" : undefined}
                      onClick={() =>
                        void navigate(() => {
                          setActive(current.current);
                          setPageIndex(index);
                        })
                      }
                    >
                      <span
                        className={`notebook-page-preview notebook-page-preview--${item.paper}`}
                      />
                      Page {index + 1}
                    </button>
                  ))}
                </nav>
                <button
                  className="notebook-add-page"
                  aria-label="Add page"
                  title="Add a new page after the last one"
                  disabled={busy}
                  onClick={() =>
                    void navigate(() => {
                      const note = current.current!;
                      change(
                        {
                          ...note,
                          pages: [...note.pages, createPage(page.paper)],
                        },
                        true,
                      );
                      setPageIndex(note.pages.length);
                    })
                  }
                >
                  {PlusIcon}
                  <span>Add page</span>
                </button>
              </aside>
            )}
            <PageEditor
              key={page.id}
              page={page}
              focus={focus}
              theme={theme}
              onChange={updatePage}
            />
          </div>
        )
      )}
      {isExportOpen && current.current && (
        <ExportDialog
          note={current.current}
          currentPage={pageIndex}
          onClose={() => setIsExportOpen(false)}
        />
      )}
      {focus && (
        <button className="notebook-exit-focus" onClick={() => setFocus(false)}>
          Exit focus
        </button>
      )}
    </div>
  );
}
