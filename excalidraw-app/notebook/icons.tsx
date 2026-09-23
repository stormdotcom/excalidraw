import type { ReactNode } from "react";

// Tabler-style outline icons, matching the whiteboard's icon set.
const icon = (children: ReactNode) => (
  <svg
    className="notebook-icon"
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

export const NotebookIcon = icon(
  <>
    <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1" />
    <path d="M9 4v16" />
    <path d="M13 8h2" />
    <path d="M13 12h2" />
  </>,
);

export const BackIcon = icon(<path d="M15 6l-6 6l6 6" />);

export const PlusIcon = icon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const DownloadIcon = icon(
  <>
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
    <path d="M7 11l5 5l5 -5" />
    <path d="M12 4v12" />
  </>,
);

export const FocusIcon = icon(
  <>
    <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </>,
);

export const FullscreenIcon = icon(
  <>
    <path d="M16 4h4v4" />
    <path d="M14 10l6 -6" />
    <path d="M8 20h-4v-4" />
    <path d="M4 20l6 -6" />
  </>,
);

export const ExitFullscreenIcon = icon(
  <>
    <path d="M5 9h4v-4" />
    <path d="M3 3l6 6" />
    <path d="M5 15h4v4" />
    <path d="M3 21l6 -6" />
    <path d="M19 9h-4v-4" />
    <path d="M15 9l6 -6" />
    <path d="M19 15h-4v4" />
    <path d="M15 15l6 6" />
  </>,
);

export const SunIcon = icon(
  <>
    <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
  </>,
);

export const MoonIcon = icon(
  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />,
);
