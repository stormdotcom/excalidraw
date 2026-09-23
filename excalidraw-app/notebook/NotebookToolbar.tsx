import type { ReactNode } from "react";

export type NoteTool = "pencil" | "highlighter" | "eraser" | "select" | "hand";

export const PENCIL_COLORS = ["#1e1e1e", "#1971c2", "#e03131", "#2f9e44"];
export const HIGHLIGHTER_COLORS = ["#ffd43b", "#8ce99a", "#ffa8d6", "#74c0fc"];

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
  const colors =
    tool === "highlighter"
      ? HIGHLIGHTER_COLORS
      : tool === "pencil"
      ? PENCIL_COLORS
      : null;
  const activeColor = tool === "highlighter" ? highlighterColor : pencilColor;

  return (
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
      {colors && (
        <div
          className="notebook-toolbar__colors"
          role="radiogroup"
          aria-label={
            tool === "highlighter" ? "Highlighter colour" : "Pencil colour"
          }
        >
          {colors.map((color) => (
            <button
              key={color}
              role="radio"
              aria-checked={color === activeColor}
              aria-label={`Colour ${color}`}
              title={`Colour ${color}`}
              className="notebook-toolbar__swatch"
              style={{ "--swatch": color } as React.CSSProperties}
              onClick={() => onColor(color)}
            />
          ))}
        </div>
      )}
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
  );
};
