import { t } from "../i18n";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { THEME } from "../constants";
import type { Theme } from "../element/types";

// Each shape is stroked twice with a slight offset for a sketchy look.
// Keep in sync with the pre-JS loader markup in excalidraw-app/index.html.
export const DRAW_LOGO_SHAPES = [
  [
    "M18 66 C28 65 40 67 50 66 C51 76 49 88 50 98 C40 99 28 97 18 98 C17 88 19 76 18 66",
    "M19 67 C29 67 39 65 49 67 C50 77 51 87 49 97 C39 98 29 99 19 97 C19 87 18 77 19 67",
  ],
  [
    "M62 22 C67 31 73 41 78 50 C68 51 57 50 46 51 C51 41 57 31 62 22",
    "M61 23 C66 32 72 42 77 51 C67 50 57 52 47 50 C52 40 56 32 61 23",
  ],
  [
    "M86 68 C95 68 103 75 103 84 C103 93 95 100 86 100 C77 100 70 93 70 84 C70 75 77 68 86 68",
    "M87 69 C96 70 102 76 102 85 C101 94 94 99 85 99 C76 99 71 92 71 83 C72 74 78 69 87 69",
  ],
];

export const DrawLoader = ({ label }: { label: string }) => (
  <div className="draw-loader" role="status" aria-live="polite">
    <svg
      className="draw-loader__art"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      {DRAW_LOGO_SHAPES.map((strokes, shapeIdx) => (
        <g key={shapeIdx} className={`draw-loader__shape s${shapeIdx}`}>
          {strokes.map((d, strokeIdx) => (
            <path key={strokeIdx} d={d} pathLength={1} />
          ))}
        </g>
      ))}
    </svg>
    <div className="draw-loader__title">Draw</div>
    <div className="draw-loader__label">{label}</div>
  </div>
);

export const LoadingMessage: React.FC<{ delay?: number; theme?: Theme }> = ({
  delay,
  theme,
}) => {
  const [isWaiting, setIsWaiting] = useState(!!delay);

  useEffect(() => {
    if (!delay) {
      return;
    }
    const timer = setTimeout(() => {
      setIsWaiting(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (isWaiting) {
    return null;
  }

  return (
    <div
      className={clsx("LoadingMessage", {
        "LoadingMessage--dark": theme === THEME.DARK,
        // overlay on top of an already-rendered editor (e.g. opening a file)
        "LoadingMessage--overlay": !!delay,
      })}
    >
      <DrawLoader label={t("labels.loadingScene")} />
    </div>
  );
};
