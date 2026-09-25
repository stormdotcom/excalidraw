import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { createNotebook, createPage, duplicatePage } from "./model";
import type { Notebook, NotePage, Paper } from "./model";
import { listNotebooks, saveNotebook } from "./storage";
import { PageEditor } from "./PageEditor";
import { useNotebookTheme } from "./theme";
import { ExportDialog } from "./ExportDialog";
import { NoteOpenAnimation } from "./NoteOpenAnimation";
import { DRAW_LOGO_SHAPES } from "../../packages/excalidraw/components/LoadingMessage";
import {
  BackIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  CopyIcon,
  DownloadIcon,
  ExportIcon,
  ExitFullscreenIcon,
  FocusIcon,
  FullscreenIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TrashIcon,
} from "./icons";
import "./notebook.scss";

const canFullscreen = () =>
  typeof document !== "undefined" &&
  !!document.fullscreenEnabled &&
  !!document.documentElement.requestFullscreen;

const SCREEN_SUGGESTION_KEY = "draw-notebook-large-screen-suggestion-v1";
const SMALL_SCREEN_QUERY = "(max-width: 767px)";

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

const StudioArtwork = () => (
  <svg
    className="notebook-home__art"
    viewBox="0 0 560 330"
    aria-hidden="true"
    focusable="false"
  >
    <path className="notebook-home__paper-back" d="M172 29h272v254H172z" />
    <path className="notebook-home__paper" d="M120 52h283v250H120z" />
    <path
      className="notebook-home__stroke notebook-home__stroke--cobalt"
      d="M166 115c46 -46 99 44 142 -2c32 -34 76 -23 100 10"
    />
    <path
      className="notebook-home__stroke notebook-home__stroke--coral"
      d="M161 173c37 34 74 -42 114 -2c39 39 72 -32 119 8"
    />
    <path
      className="notebook-home__stroke notebook-home__stroke--ink"
      d="M168 230c23 -20 42 19 64 -3c29 -29 67 21 93 -5"
    />
    <circle
      className="notebook-home__paint notebook-home__paint--one"
      cx="461"
      cy="85"
      r="30"
    />
    <circle
      className="notebook-home__paint notebook-home__paint--two"
      cx="471"
      cy="151"
      r="18"
    />
    <circle
      className="notebook-home__paint notebook-home__paint--three"
      cx="92"
      cy="253"
      r="24"
    />
  </svg>
);

const ScreenSuggestionIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="5" y="8" width="29" height="23" rx="3" />
    <path d="M14 39h12M20 31v8" />
    <rect x="29" y="18" width="14" height="22" rx="2.5" />
    <path d="M34 36h4" />
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

const STUDIO_PAPERS: { value: Paper; label: string }[] = [
  { value: "dot", label: "Dot grid" },
  { value: "cornell", label: "Cornell notes" },
  { value: "storyboard", label: "Storyboard" },
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
  const [showScreenSuggestion, setShowScreenSuggestion] = useState(false);
  const current = useRef<Notebook | null>(null);
  const dirty = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<Promise<boolean> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useNotebookTheme();
  const [isExportOpen, setIsExportOpen] = useState(false);
  // bumps on every note open so the intro animation replays
  const [opening, setOpening] = useState<{ key: number; title: string } | null>(
    null,
  );
  const endOpening = useCallback(() => setOpening(null), []);

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

  useEffect(() => {
    if (!ready || !window.matchMedia?.(SMALL_SCREEN_QUERY).matches) {
      return;
    }
    try {
      setShowScreenSuggestion(
        localStorage.getItem(SCREEN_SUGGESTION_KEY) !== "dismissed",
      );
    } catch {
      setShowScreenSuggestion(true);
    }
  }, [ready]);

  const dismissScreenSuggestion = () => {
    setShowScreenSuggestion(false);
    try {
      localStorage.setItem(SCREEN_SUGGESTION_KEY, "dismissed");
    } catch {
      // The suggestion can still be dismissed for this session.
    }
  };

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
    setOpening((old) => ({
      key: (old?.key ?? 0) + 1,
      title: note.title || "Untitled note",
    }));
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
  const updatePages = (pages: NotePage[], nextPageIndex = pageIndex) => {
    const note = current.current!;
    change({ ...note, pages }, true);
    setPageIndex(nextPageIndex);
  };
  const toggleBookmark = () => {
    void navigate(() => {
      const note = current.current!;
      updatePages(
        note.pages.map((item, index) =>
          index === pageIndex
            ? { ...item, bookmarked: !item.bookmarked }
            : item,
        ),
      );
    });
  };
  const copyPage = () => {
    void navigate(() => {
      const note = current.current!;
      const pages = [...note.pages];
      pages.splice(pageIndex + 1, 0, duplicatePage(pages[pageIndex]));
      updatePages(pages, pageIndex + 1);
    });
  };
  const movePage = (offset: -1 | 1) => {
    void navigate(() => {
      const note = current.current!;
      const target = pageIndex + offset;
      if (target < 0 || target >= note.pages.length) {
        return;
      }
      const pages = [...note.pages];
      [pages[pageIndex], pages[target]] = [pages[target], pages[pageIndex]];
      updatePages(pages, target);
    });
  };
  const removePage = () => {
    if (!current.current || current.current.pages.length === 1) {
      return;
    }
    void navigate(() => {
      const note = current.current!;
      const pages = note.pages.filter((_, index) => index !== pageIndex);
      updatePages(pages, Math.min(pageIndex, pages.length - 1));
    });
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
      {showScreenSuggestion && (
        <aside
          className="notebook-screen-suggestion"
          role="region"
          aria-label="Screen size suggestion"
        >
          <span className="notebook-screen-suggestion__icon">
            <ScreenSuggestionIcon />
          </span>
          <span className="notebook-screen-suggestion__copy">
            <strong>More room, better flow.</strong>
            <span>
              Draw Notes is designed for tablets and larger screens. You can
              keep working here, with more canvas space on a bigger device.
            </span>
          </span>
          <button
            aria-label="Dismiss screen size suggestion and continue here"
            onClick={dismissScreenSuggestion}
          >
            Continue here
          </button>
        </aside>
      )}
      {!active ? (
        <main className="notebook-home">
          <section className="notebook-home__hero">
            <div className="notebook-home__intro">
              <div className="notebook-home__logo">
                <DrawLogoMark />
                <span>Draw Notes</span>
              </div>
              <h1>
                Start with paper.
                <br />
                Take it anywhere.
              </h1>
              <p className="notebook-home__heading">
                A focused A4 studio for Pencil sketches, colour studies and
                handwritten ideas. Everything stays in this browser.
              </p>
              <span className="notebook-home__studio-badge">
                <span className="notebook-studio-mark" aria-hidden="true" />
                Studio preview · artist paper pack
              </span>
              <button
                className="notebook-start-button"
                aria-label="New note"
                disabled={!ready || busy}
                onClick={startNewNote}
              >
                <span className="notebook-start-button__icon">{PlusIcon}</span>
                <span>New note</span>
                <small>Blank A4 notebook</small>
              </button>
            </div>
            <StudioArtwork />
          </section>
          <div className="notebook-home__library">
            <div className="notebook-home__library-heading">
              <div>
                <h2>Recent notes</h2>
                <p>Pick up where your last line ended.</p>
              </div>
              <div className="notebook-home__ink-key" aria-hidden="true">
                <span style={{ "--ink": "#3157d5" } as React.CSSProperties} />
                <span style={{ "--ink": "#ff6b6b" } as React.CSSProperties} />
                <span style={{ "--ink": "#d9f99d" } as React.CSSProperties} />
              </div>
            </div>
            {ready && !notes.length && (
              <button
                className="notebook-empty-note"
                disabled={busy}
                onClick={startNewNote}
              >
                <span
                  className="notebook-empty-note__paper"
                  aria-hidden="true"
                />
                <strong>Your first page is waiting.</strong>
                <span>Create a note and make the first mark.</span>
              </button>
            )}
            <div className="notebook-list">
              {notes.map((note, index) => (
                <button
                  key={note.id}
                  className={`notebook-note-card notebook-note-card--${
                    index % 4
                  }`}
                  onClick={() => openNote(note)}
                >
                  <span
                    className="notebook-note-card__cover"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                  </span>
                  <span className="notebook-note-card__body">
                    <strong>{note.title || "Untitled note"}</strong>
                    <span>
                      {note.pages.length}{" "}
                      {note.pages.length === 1 ? "page" : "pages"}
                    </span>
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
                <div className="notebook-paper-options notebook-paper-options--studio">
                  <span
                    className="notebook-panel-label"
                    id="notebook-studio-paper"
                  >
                    Studio <small>Premium preview</small>
                  </span>
                  <div
                    className="notebook-segmented"
                    role="radiogroup"
                    aria-labelledby="notebook-studio-paper"
                  >
                    {STUDIO_PAPERS.map((paper) => (
                      <button
                        key={paper.value}
                        role="radio"
                        aria-checked={page.paper === paper.value}
                        aria-label={paper.label}
                        title={`${paper.label} · Studio preview`}
                        onClick={() => setPaper(paper.value)}
                      >
                        <span
                          className={`notebook-page-preview notebook-page-preview--${paper.value}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <span className="notebook-panel-label notebook-panel-label--pages">
                  Pages{" "}
                  <small>
                    {pageIndex + 1} / {active.pages.length}
                  </small>
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
                      >
                        {item.bookmarked && (
                          <span className="notebook-page-preview__bookmark" />
                        )}
                      </span>
                      <span>Page {index + 1}</span>
                    </button>
                  ))}
                </nav>
                <div
                  className="notebook-page-actions"
                  role="toolbar"
                  aria-label={`Page ${pageIndex + 1} actions`}
                >
                  <HeaderButton
                    icon={BookmarkIcon}
                    label={
                      page.bookmarked ? "Remove bookmark" : "Bookmark page"
                    }
                    disabled={busy}
                    onClick={toggleBookmark}
                  />
                  <HeaderButton
                    icon={CopyIcon}
                    label="Duplicate page"
                    disabled={busy}
                    onClick={copyPage}
                  />
                  <HeaderButton
                    icon={ArrowUpIcon}
                    label="Move page up"
                    disabled={busy || pageIndex === 0}
                    onClick={() => movePage(-1)}
                  />
                  <HeaderButton
                    icon={ArrowDownIcon}
                    label="Move page down"
                    disabled={busy || pageIndex === active.pages.length - 1}
                    onClick={() => movePage(1)}
                  />
                  <HeaderButton
                    icon={TrashIcon}
                    label="Delete page"
                    disabled={busy || active.pages.length === 1}
                    onClick={removePage}
                  />
                </div>
                <button
                  className="notebook-add-page"
                  aria-label="Add page"
                  title="Add a new page after this page"
                  disabled={busy}
                  onClick={() =>
                    void navigate(() => {
                      const note = current.current!;
                      const pages = [...note.pages];
                      pages.splice(pageIndex + 1, 0, createPage(page.paper));
                      updatePages(pages, pageIndex + 1);
                    })
                  }
                >
                  {PlusIcon}
                  <span>Add page</span>
                </button>
              </aside>
            )}
            {opening && (
              <NoteOpenAnimation
                key={opening.key}
                title={opening.title}
                onDone={endOpening}
              />
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
