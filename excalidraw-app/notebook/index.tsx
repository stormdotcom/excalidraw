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
registerSW();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NotebookApp />
  </StrictMode>,
);
