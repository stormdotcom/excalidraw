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
import { A4 } from "./model";
import type { ResolvedTheme } from "./theme";
import type { NotePage } from "./model";

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
  const initialData = useRef({
    elements: page.elements,
    files: page.files,
    appState: {
      ...page.appState,
      viewBackgroundColor: "transparent",
      currentItemStrokeWidth: 1,
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

  useEffect(() => {
    const frame = requestAnimationFrame(fitPage);
    return () => cancelAnimationFrame(frame);
  }, [fitPage, focus]);

  const handleChange: NonNullable<ExcalidrawProps["onChange"]> = (
    elements,
    appState,
    files,
  ) => {
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
    <div className="notebook-editor">
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
        </defs>
        <rect width="100%" height="100%" className="notebook-paper__sheet" />
        {page.paper !== "blank" && (
          <rect
            x="36"
            y="56"
            width="722"
            height="1010"
            fill="url(#notebook-rules)"
          />
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
      {!focus && (
        <button className="notebook-fit" onClick={fitPage}>
          Fit A4 page
        </button>
      )}
    </div>
  );
};
