// Kept free of `virtual:pwa-register` so it can be imported from tests;
// the registration is handed over from index.tsx.
let registration: ServiceWorkerRegistration | undefined;

export const setServiceWorkerRegistration = (
  reg: ServiceWorkerRegistration | undefined,
) => {
  registration = reg;
};

/**
 * Checks for a newer deploy and reloads. Installed PWAs on phones and tablets
 * have no browser refresh button, so this is the only way to pick up updates
 * without closing the app.
 */
export const refreshApp = async () => {
  try {
    await registration?.update();
  } catch {
    // offline or the worker script is unreachable: a plain reload still works
  }
  if (registration?.installing || registration?.waiting) {
    // With `autoUpdate` the new worker activates and reloads the page itself;
    // fall back to a manual reload in case that doesn't happen.
    setTimeout(() => window.location.reload(), 4000);
    return;
  }
  window.location.reload();
};
