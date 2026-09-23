import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExcalidrawApp from "./App";
import { registerSW } from "virtual:pwa-register";
import { setServiceWorkerRegistration } from "./data/appUpdate";

import "../excalidraw-app/sentry";
window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
registerSW({
  onRegisteredSW: (_swUrl, registration) =>
    setServiceWorkerRegistration(registration),
});
root.render(
  <StrictMode>
    <ExcalidrawApp />
  </StrictMode>,
);
