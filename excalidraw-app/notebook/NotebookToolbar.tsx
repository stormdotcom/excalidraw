import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type NoteTool = "pencil" | "highlighter" | "eraser" | "select" | "hand";

type ColorSwatch = { color: string; name: string };
type ColorPalette = { id: string; name: string; colors: ColorSwatch[] };

export const PENCIL_PALETTES: ColorPalette[] = [
  {
    id: "studio",
    name: "Studio",
    colors: [
      { color: "#1e1e1e", name: "Graphite" },
      { color: "#3157d5", name: "Cobalt" },
      { color: "#f03e3e", name: "Vermilion" },
      { color: "#2b8a3e", name: "Palm" },
      { color: "#7048e8", name: "Iris" },
      { color: "#f76707", name: "Mandarin" },
      { color: "#d6336c", name: "Raspberry" },
      { color: "#0c8599", name: "Ocean" },
    ],
  },
  {
    id: "earth",
    name: "Earth",
    colors: [
      { color: "#292524", name: "Charcoal" },
      { color: "#78716c", name: "Stone" },
      { color: "#9a3412", name: "Terracotta" },
      { color: "#b45309", name: "Ochre" },
      { color: "#4d7c0f", name: "Moss" },
      { color: "#0f766e", name: "Juniper" },
      { color: "#7c2d12", name: "Sienna" },
      { color: "#7e22ce", name: "Orchid" },
    ],
  },
  {
    id: "electric",
    name: "Electric",
    colors: [
      { color: "#111827", name: "Midnight" },
      { color: "#2563eb", name: "Electric blue" },
      { color: "#06b6d4", name: "Aqua" },
      { color: "#84cc16", name: "Acid green" },
      { color: "#facc15", name: "Solar" },
      { color: "#f97316", name: "Signal orange" },
      { color: "#ec4899", name: "Hot pink" },
      { color: "#8b5cf6", name: "Ultraviolet" },
    ],
  },
];

export const HIGHLIGHTER_PALETTES: ColorPalette[] = [
  {
    id: "soft",
    name: "Soft",
    colors: [
      { color: "#ffe066", name: "Butter" },
      { color: "#8ce99a", name: "Mint" },
      { color: "#faa2c1", name: "Petal" },
      { color: "#74c0fc", name: "Pool" },
      { color: "#b197fc", name: "Lavender" },
      { color: "#ffc078", name: "Peach" },
    ],
  },
  {
    id: "sorbet",
    name: "Sorbet",
    colors: [
      { color: "#fde68a", name: "Vanilla" },
      { color: "#fdba74", name: "Apricot" },
      { color: "#f9a8d4", name: "Dragon fruit" },
      { color: "#c4b5fd", name: "Ube" },
      { color: "#a5f3fc", name: "Ice blue" },
      { color: "#bef264", name: "Lime sorbet" },
    ],
  },
  {
    id: "neon",
    name: "Neon",
    colors: [
      { color: "#fef08a", name: "Neon yellow" },
      { color: "#bef264", name: "Neon lime" },
      { color: "#67e8f9", name: "Neon cyan" },
      { color: "#93c5fd", name: "Neon blue" },
      { color: "#d8b4fe", name: "Neon violet" },
      { color: "#f9a8d4", name: "Neon pink" },
    ],
  },
];

export const PENCIL_COLORS = PENCIL_PALETTES[0].colors.map(
  ({ color }) => color,
);
export const HIGHLIGHTER_COLORS = HIGHLIGHTER_PALETTES[0].colors.map(
  ({ color }) => color,
);

const icon = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const TOOLS: {
  tool: NoteTool;
  label: string;
  hint: string;
  icon: JSX.Element;
}[] = [
  {
    tool: "pencil",
    label: "Pencil",
    hint: "Write and sketch with a fine line",
    icon: icon(
      <>
        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
      </>,
    ),
  },
  {
    tool: "highlighter",
    label: "Highlighter",
    hint: "See-through marker for highlighting",
    icon: icon(
      <>
        <path d="M3 19h4l10.5 -10.5a2.828 2.828 0 0 0 -4 -4l-10.5 10.5v4" />
        <path d="M12.5 5.5l4 4" />
        <path d="M14 21h7" strokeWidth="3" />
      </>,
    ),
  },
  {
    tool: "eraser",
    label: "Eraser",
    hint: "Erase whole strokes",
    icon: icon(
      <>
        <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" />
        <path d="M18 13.3l-6.3 -6.3" />
      </>,
    ),
  },
  {
    tool: "select",
    label: "Select",
    hint: "Select, move and resize strokes",
    icon: icon(
      <>
        <path d="M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207a0.366 .366 0 0 0 .332 -.207l2.184 -4.793l4.787 -1.994a0.355 .355 0 0 0 .213 -.323a0.357 .357 0 0 0 -.213 -.325l-11.787 -4.358z" />
        <path d="M13.5 13.5l5.5 5.5" />
      </>,
    ),
  },
  {
    tool: "hand",
    label: "Pan",
    hint: "Move around the page",
    icon: icon(
      <>
        <path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" />
        <path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />
      </>,
    ),
  },
];

const FitIcon = icon(
  <>
    <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
    <path d="M9 8h6v8h-6z" />
  </>,
);

/**
 * Notebook tool bar. Every control has a visible tooltip and an accessible
 * name so it is usable with a keyboard, screen readers and automation.
 */
export const NotebookToolbar = ({
  tool,
  pencilColor,
  highlighterColor,
  onTool,
  onColor,
  onFit,
}: {
  tool: NoteTool | null;
  pencilColor: string;
  highlighterColor: string;
  onTool: (tool: NoteTool) => void;
  onColor: (color: string) => void;
  onFit: () => void;
}) => {
  const palettes =
    tool === "highlighter"
      ? HIGHLIGHTER_PALETTES
      : tool === "pencil"
      ? PENCIL_PALETTES
      : null;
  const activeColor = tool === "highlighter" ? highlighterColor : pencilColor;
  const paletteTool = tool === "highlighter" ? "highlighter" : "pencil";
  const [selectedPalettes, setSelectedPalettes] = useState({
    pencil: PENCIL_PALETTES[0].id,
    highlighter: HIGHLIGHTER_PALETTES[0].id,
  });
  const palette =
    palettes?.find((item) => item.id === selectedPalettes[paletteTool]) ||
    palettes?.[0];

  useEffect(() => {
    const matchingPalette = palettes?.find((item) =>
      item.colors.some(({ color }) => color === activeColor),
    );
    if (matchingPalette) {
      setSelectedPalettes((current) =>
        current[paletteTool] === matchingPalette.id
          ? current
          : { ...current, [paletteTool]: matchingPalette.id },
      );
    }
  }, [activeColor, paletteTool, palettes]);

  return (
    <>
      {palette && palettes && (
        <div className="notebook-palette">
          <span className="notebook-palette__label">
            {tool === "highlighter" ? "Marker sets" : "Ink sets"}
          </span>
          <div
            className="notebook-palette__sets"
            aria-label={
              tool === "highlighter"
                ? "Highlighter palettes"
                : "Pencil palettes"
            }
          >
            {palettes.map((item) => (
              <button
                key={item.id}
                className="notebook-palette__set"
                aria-pressed={item.id === palette.id}
                title={`${item.name} palette`}
                onClick={() =>
                  setSelectedPalettes((current) => ({
                    ...current,
                    [paletteTool]: item.id,
                  }))
                }
              >
                <span className="notebook-palette__set-preview">
                  {item.colors.slice(0, 4).map(({ color }) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          <div className="notebook-palette__swatches">
            <div
              className="notebook-palette__swatch-list"
              role="radiogroup"
              aria-label={
                tool === "highlighter"
                  ? `${palette.name} highlighter colours`
                  : `${palette.name} pencil colours`
              }
            >
              {palette.colors.map(({ color, name }) => (
                <button
                  key={color}
                  role="radio"
                  aria-checked={color === activeColor}
                  aria-label={name}
                  title={name}
                  className="notebook-palette__swatch"
                  style={{ "--swatch": color } as React.CSSProperties}
                  onClick={() => onColor(color)}
                />
              ))}
            </div>
          </div>
          <label
            className="notebook-palette__custom"
            title="Mix a custom colour"
            style={{ "--swatch": activeColor } as React.CSSProperties}
          >
            <input
              type="color"
              value={activeColor}
              aria-label="Custom colour"
              onChange={(event) => onColor(event.target.value)}
            />
            <span aria-hidden="true">+</span>
          </label>
        </div>
      )}
      <div className="notebook-toolbar" role="toolbar" aria-label="Note tools">
        {TOOLS.map((item) => (
          <button
            key={item.tool}
            className="notebook-toolbar__tool"
            aria-pressed={tool === item.tool}
            aria-label={item.label}
            title={`${item.label} — ${item.hint}`}
            data-testid={`note-tool-${item.tool}`}
            onClick={() => onTool(item.tool)}
          >
            {item.icon}
          </button>
        ))}
        <span className="notebook-toolbar__divider" />
        <button
          className="notebook-toolbar__tool"
          aria-label="Fit page"
          title="Fit page — show the whole A4 page"
          data-testid="note-fit-page"
          onClick={onFit}
        >
          {FitIcon}
        </button>
      </div>
    </>
  );
};
