import { t } from "../../packages/excalidraw/i18n";
import { NotebookIcon } from "../notebook/icons";

export const NOTES_URL = "/notes.html";

/** Top-right shortcut from the whiteboard to the notes page. */
export const NotesButton = () => {
  const label = t("labels.notebooks");

  return (
    <a
      className="sidebar-trigger app-notes-button"
      href={NOTES_URL}
      title={label}
      aria-label={label}
      data-testid="open-notes-button"
    >
      {NotebookIcon}
      <span className="sidebar-trigger__label">{t("labels.notes")}</span>
    </a>
  );
};
