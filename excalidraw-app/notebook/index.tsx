import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { Fonts } from "../../packages/excalidraw/fonts";
import { FONT_FAMILY } from "../../packages/excalidraw/constants";
import NotebookApp from "./NotebookApp";

window.EXCALIDRAW_ASSET_PATH = window.location.origin;
// These two optional families use remote font files. Keep the notebook's
// picker limited to the fonts shipped with the application.
Fonts.registered.delete(FONT_FAMILY.Nunito);
Fonts.registered.delete(FONT_FAMILY["Lilita One"]);
// The home screen uses the hand-drawn font before any editor is mounted;
// adding the face lets the browser fetch it on first use (bundled, offline).
for (const { fontFace } of Fonts.registered.get(FONT_FAMILY.Excalifont)
  ?.fonts ?? []) {
  if (!document.fonts.has(fontFace)) {
    document.fonts.add(fontFace);
  }
}
registerSW();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NotebookApp />
  </StrictMode>,
);
