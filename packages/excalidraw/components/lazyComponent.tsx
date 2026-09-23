import React, { Suspense } from "react";
import type { ComponentType } from "react";

export type LazyComponent<P> = ComponentType<P> & {
  preload: () => Promise<ComponentType<P>>;
};

/**
 * Code-splits a component into its own chunk. Unlike plain `React.lazy`, once
 * the chunk has been loaded (e.g. via `preload()` on idle) it renders
 * synchronously, so opening a dialog never flashes an empty frame.
 */
export const lazyComponent = <P extends object>(
  load: () => Promise<ComponentType<P>>,
): LazyComponent<P> => {
  let Loaded: ComponentType<P> | null = null;
  let promise: Promise<ComponentType<P>> | null = null;

  const preload = () => {
    if (!promise) {
      promise = load().then(
        (Component) => (Loaded = Component),
        (error) => {
          // allow retrying after e.g. a network blip
          promise = null;
          throw error;
        },
      );
    }
    return promise;
  };

  const Lazy = React.lazy(() =>
    preload().then((Component) => ({ default: Component })),
  );

  const Wrapper = (props: P) =>
    Loaded ? (
      <Loaded {...props} />
    ) : (
      <Suspense fallback={null}>
        <Lazy {...(props as any)} />
      </Suspense>
    );

  return Object.assign(Wrapper, { preload });
};

/** Loads the given lazy components once the browser is idle. */
export const preloadWhenIdle = (components: LazyComponent<any>[]) => {
  const run = () =>
    components.forEach((component) => component.preload().catch(() => {}));
  if (typeof window === "undefined") {
    return;
  }
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 5000 });
  } else {
    setTimeout(run, 2000);
  }
};
