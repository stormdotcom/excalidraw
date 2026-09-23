import { useEffect } from "react";

// Hand-drawn scribble the pencil follows (viewBox 0 0 300 90).
const SCRIBBLE =
  "M18 58 C38 30 58 30 70 52 S98 78 118 50 S150 20 170 48 S204 76 226 46 S262 28 282 50";

/** Total length of the animation in ms; keep in sync with notebook.scss. */
export const NOTE_OPEN_ANIMATION_MS = 1100;

const prefersReducedMotion = () =>
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Short "pencil writes a line" intro shown when a note opens. It never blocks
 * input (pointer-events: none) and is skipped for reduced-motion users.
 */
export const NoteOpenAnimation = ({
  title,
  onDone,
}: {
  title: string;
  onDone: () => void;
}) => {
  const skip = prefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, skip ? 0 : NOTE_OPEN_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [onDone, skip]);

  if (skip) {
    return null;
  }

  return (
    <div className="notebook-open-animation" aria-hidden="true">
      <svg viewBox="0 0 300 90" className="notebook-open-animation__art">
        <path
          className="notebook-open-animation__line"
          d={SCRIBBLE}
          pathLength={1}
        />
        {/* pencil drawn with its tip at 0,0, pointing down-left */}
        <g className="notebook-open-animation__pencil">
          <animateMotion
            dur="0.8s"
            fill="freeze"
            path={SCRIBBLE}
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.45 0 0.35 1"
          />
          <g transform="rotate(-45)">
            <path className="nb-pencil-tip" d="M0 0 L9 -4.5 L9 4.5 Z" />
            <path className="nb-pencil-lead" d="M0 0 L3 -1.5 L3 1.5 Z" />
            <rect
              className="nb-pencil-body"
              x="9"
              y="-4.5"
              width="34"
              height="9"
            />
            <rect
              className="nb-pencil-band"
              x="43"
              y="-4.5"
              width="4"
              height="9"
            />
            <rect
              className="nb-pencil-eraser"
              x="47"
              y="-4.5"
              width="7"
              height="9"
              rx="2"
            />
          </g>
        </g>
      </svg>
      <div className="notebook-open-animation__title">{title}</div>
    </div>
  );
};
