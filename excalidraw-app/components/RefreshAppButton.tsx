import { useState } from "react";
import clsx from "clsx";
import { t } from "../../packages/excalidraw/i18n";
import { refreshApp } from "../data/appUpdate";

const RefreshIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

/** Reload / get-latest-version button for touch devices (see appUpdate.ts). */
export const RefreshAppButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const label = t("labels.refreshApp");

  return (
    <button
      type="button"
      className={clsx("sidebar-trigger app-refresh-button", {
        "app-refresh-button--busy": isRefreshing,
      })}
      title={label}
      aria-label={label}
      data-testid="refresh-app-button"
      disabled={isRefreshing}
      onClick={() => {
        setIsRefreshing(true);
        refreshApp();
      }}
    >
      {RefreshIcon}
    </button>
  );
};
