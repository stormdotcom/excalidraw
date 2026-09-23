import type { ExcalidrawProps, UIAppState } from "../types";
import clsx from "clsx";

// The "Browse libraries" link to the public Excalidraw catalogue was removed;
// the props are kept so existing callers keep compiling.
export const LibraryMenuControlButtons = ({
  style,
  children,
  className,
}: {
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  theme: UIAppState["theme"];
  id: string;
  style: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
}) => {
  if (!children) {
    return null;
  }
  return (
    <div
      className={clsx("library-menu-control-buttons", className)}
      style={style}
    >
      {children}
    </div>
  );
};
