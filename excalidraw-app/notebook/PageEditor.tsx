import { useCallback, useEffect, useRef, useState } from "react";
import {
  Excalidraw,
  MainMenu,
  convertToExcalidrawElements,
} from "../../packages/excalidraw";
import { clearAppStateForLocalStorage } from "../../packages/excalidraw/appState";
import { getSceneVersion } from "../../packages/excalidraw/element";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  BinaryFiles,
} from "../../packages/excalidraw/types";
import { FREEDRAW_PENCIL_STROKE_WIDTH } from "../../packages/excalidraw/constants";
import { A4 } from "./model";
import type { ResolvedTheme } from "./theme";
import type { NotePage } from "./model";
import {
  HIGHLIGHTER_COLORS,
  NotebookToolbar,
  PENCIL_COLORS,
} from "./NotebookToolbar";
import type { NoteTool } from "./NotebookToolbar";

const TOOL_SETTINGS_KEY = "draw-notebook-tools";
const HIGHLIGHTER_WIDTH = 6;
const HIGHLIGHTER_OPACITY = 35;

type ToolSettings = {
  pencilColor: string;
  pencilWidth: number;
  highlighterColor: string;
};

const loadToolSettings = (): ToolSettings => {
  const defaults: ToolSettings = {
    pencilColor: PENCIL_COLORS[0],
    pencilWidth: FREEDRAW_PENCIL_STROKE_WIDTH,
    highlighterColor: HIGHLIGHTER_COLORS[0],
  };
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(TOOL_SETTINGS_KEY) || "{}"),
    };
  } catch {
    return defaults;
  }
};

const saveToolSettings = (settings: ToolSettings) => {
  try {
    localStorage.setItem(TOOL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // not critical
  }
};

const EXCALIDRAW_TOOL: Record<
  NoteTool,
  "freedraw" | "eraser" | "selection" | "hand"
> = {
  pencil: "freedraw",
  highlighter: "freedraw",
  eraser: "eraser",
  select: "selection",
  hand: "hand",
};

export const PageEditor = ({
  page,
  focus,
  theme,
  onChange,
}: {
  page: NotePage;
  focus: boolean;
  theme: ResolvedTheme;
  onChange: (page: NotePage) => void;
}) => {
  const [api, setAPI] = useState<ExcalidrawImperativeAPI>();
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const previous = useRef<{
    version: number;
    files: BinaryFiles;
    state: string;
  } | null>(null);
  // Notes always open on the pencil, with the last pencil colour and width.
  const toolSettings = useRef<ToolSettings>(loadToolSettings());
  const [tool, setTool] = useState<NoteTool | null>("pencil");
  const toolRef = useRef<NoteTool | null>("pencil");
  // true while a tool switch is being applied, so intermediate editor state
  // (e.g. highlighter width) isn't remembered as the pencil's
  const switchingTool = useRef(false);
  const [colors, setColors] = useState({
    pencil: toolSettings.current.pencilColor,
    highlighter: toolSettings.current.highlighterColor,
  });
  const pencilWidth = toolSettings.current.pencilWidth;
  const initialData = useRef({
    elements: page.elements,
    files: page.files,
    appState: {
      ...page.appState,
      viewBackgroundColor: "transparent",
      currentItemStrokeWidth: pencilWidth,
      currentItemStrokeColor: toolSettings.current.pencilColor,
      currentItemOpacity: 100,
      strokeWidthByTool: {
        ...page.appState.strokeWidthByTool,
        freedraw: pencilWidth,
      },
      currentItemRoughness: 0,
      activeTool: {
        type: "freedraw" as const,
        customType: null,
        locked: true,
        lastActiveTool: null,
      },
    },
  });

  const fitPage = useCallback(() => {
    api?.scrollToContent(
      convertToExcalidrawElements([{ type: "rectangle", x: 0, y: 0, ...A4 }]),
      { fitToViewport: true, viewportZoomFactor: 0.78 },
    );
  }, [api]);

  const selectTool = useCallback(
    (next: NoteTool) => {
      if (!api) {
        return;
      }
      const type = EXCALIDRAW_TOOL[next];
      toolRef.current = next;
      setTool(next);
      api.setActiveTool({ type, locked: type === "freedraw" });
      if (type !== "freedraw") {
        return;
      }
      const settings = toolSettings.current;
      const isHighlighter = next === "highlighter";
      const width = isHighlighter ? HIGHLIGHTER_WIDTH : settings.pencilWidth;
      switchingTool.current = true;
      // after the editor has applied its own per-tool defaults
      requestAnimationFrame(() => {
        switchingTool.current = false;
        api.updateScene({
          appState: {
            currentItemStrokeColor: isHighlighter
              ? settings.highlighterColor
              : settings.pencilColor,
            currentItemOpacity: isHighlighter ? HIGHLIGHTER_OPACITY : 100,
            currentItemStrokeWidth: width,
            currentItemRoughness: 0,
            strokeWidthByTool: {
              ...api.getAppState().strokeWidthByTool,
              freedraw: width,
            },
          },
        });
      });
    },
    [api],
  );

  const selectColor = useCallback(
    (color: string) => {
      const isHighlighter = toolRef.current === "highlighter";
      toolSettings.current = {
        ...toolSettings.current,
        [isHighlighter ? "highlighterColor" : "pencilColor"]: color,
      };
      saveToolSettings(toolSettings.current);
      setColors((old) => ({
        ...old,
        [isHighlighter ? "highlighter" : "pencil"]: color,
      }));
      api?.updateScene({ appState: { currentItemStrokeColor: color } });
    },
    [api],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(fitPage);
    return () => cancelAnimationFrame(frame);
  }, [fitPage, focus]);

  const handleChange: NonNullable<ExcalidrawProps["onChange"]> = (
    elements,
    appState,
    files,
  ) => {
    // keep the note tool bar in sync when tools are picked elsewhere
    const activeType = appState.activeTool.type;
    const current = toolRef.current;
    const synced: NoteTool | null =
      activeType === "freedraw"
        ? current === "highlighter"
          ? "highlighter"
          : "pencil"
        : activeType === "selection"
        ? "select"
        : activeType === "eraser" || activeType === "hand"
        ? activeType
        : null;
    if (synced !== current) {
      if (synced === "pencil" && current !== "highlighter") {
        // freehand picked from the editor's toolbar: restore pencil settings
        selectTool("pencil");
      } else {
        toolRef.current = synced;
        setTool(synced);
      }
    }
    // remember pencil width/colour changed from the editor's own panel
    if (synced === "pencil" && current === "pencil" && !switchingTool.current) {
      const settings = toolSettings.current;
      if (
        appState.currentItemStrokeWidth !== settings.pencilWidth ||
        appState.currentItemStrokeColor !== settings.pencilColor
      ) {
        toolSettings.current = {
          ...settings,
          pencilWidth: appState.currentItemStrokeWidth,
          pencilColor: appState.currentItemStrokeColor,
        };
        saveToolSettings(toolSettings.current);
      }
    }

    const next = {
      x: appState.scrollX * appState.zoom.value,
      y: appState.scrollY * appState.zoom.value,
      zoom: appState.zoom.value,
    };
    setViewport((old) =>
      old.x === next.x && old.y === next.y && old.zoom === next.zoom
        ? old
        : next,
    );
    // The view is re-fitted on every open, so scroll/zoom are not note content.
    const {
      scrollX: _scrollX,
      scrollY: _scrollY,
      zoom: _zoom,
      ...savedState
    } = clearAppStateForLocalStorage(appState);
    const state = JSON.stringify(savedState);
    const version = getSceneVersion(elements);
    if (!previous.current) {
      // First change after mounting is the loaded page itself, not an edit.
      previous.current = { version, files, state };
      return;
    }
    if (
      previous.current.version !== version ||
      previous.current.files !== files ||
      previous.current.state !== state
    ) {
      previous.current = { version, files, state };
      onChange({ ...page, elements, files, appState: savedState });
    }
  };

  return (
    <div
      className={`notebook-editor notebook-editor--tool-${tool || "default"}`}
    >
      <svg
        className="notebook-paper"
        aria-hidden="true"
        width={A4.width}
        height={A4.height}
        viewBox={`0 0 ${A4.width} ${A4.height}`}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <defs>
          <pattern
            id="notebook-rules"
            width="24"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 27.5H24" className="notebook-paper__rule" />
            {page.paper === "grid" && (
              <path d="M23.5 0V28" className="notebook-paper__rule" />
            )}
          </pattern>
          <pattern
            id="notebook-dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="12" cy="12" r="1.25" className="notebook-paper__dot" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" className="notebook-paper__sheet" />
        {(page.paper === "ruled" || page.paper === "grid") && (
          <rect
            x="36"
            y="56"
            width="722"
            height="1010"
            fill="url(#notebook-rules)"
          />
        )}
        {page.paper === "dot" && (
          <rect
            x="36"
            y="56"
            width="722"
            height="1010"
            fill="url(#notebook-dots)"
          />
        )}
        {page.paper === "cornell" && (
          <g className="notebook-paper__cornell">
            <line x1="52" y1="126" x2="742" y2="126" />
            <line x1="224" y1="126" x2="224" y2="944" />
            <line x1="52" y1="944" x2="742" y2="944" />
            {Array.from({ length: 26 }, (_, index) => (
              <line
                key={index}
                x1="240"
                y1={154 + index * 29}
                x2="742"
                y2={154 + index * 29}
              />
            ))}
          </g>
        )}
        {page.paper === "storyboard" && (
          <g className="notebook-paper__storyboard">
            <line x1="70" y1="74" x2="340" y2="74" />
            {[0, 1, 2].flatMap((row) =>
              [0, 1].map((column) => (
                <rect
                  key={`${row}-${column}`}
                  x={70 + column * 342}
                  y={112 + row * 322}
                  width="282"
                  height="238"
                  rx="4"
                />
              )),
            )}
          </g>
        )}
        <rect
          x="0.5"
          y="0.5"
          width="793"
          height="1122"
          fill="none"
          className="notebook-paper__edge"
        />
      </svg>
      <Excalidraw
        excalidrawAPI={setAPI}
        initialData={initialData.current}
        onChange={handleChange}
        zenModeEnabled={focus}
        theme={theme}
        aiEnabled={false}
        validateEmbeddable={false}
        onLinkOpen={(_, event) => event.preventDefault()}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: false,
            changeViewBackgroundColor: false,
            toggleTheme: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.Item onSelect={fitPage}>Fit A4 page</MainMenu.Item>
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
      <NotebookToolbar
        tool={tool}
        pencilColor={colors.pencil}
        highlighterColor={colors.highlighter}
        onTool={selectTool}
        onColor={selectColor}
        onFit={fitPage}
      />
    </div>
  );
};
