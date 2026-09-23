import React from "react";
import { DRAW_LOGO_SHAPES } from "../../packages/excalidraw/components/LoadingMessage";

/** "Draw" wordmark — same sketchy shapes as the loading screen */
export const AppLogo = () => (
  <div className="app-logo">
    <svg
      className="app-logo__icon"
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
    <span className="app-logo__text">Draw</span>
  </div>
);
