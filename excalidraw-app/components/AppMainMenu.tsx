import React from "react";
import { LocalProfile } from "./LocalProfile";
import type { Theme } from "../../packages/excalidraw/element/types";
import { MainMenu } from "../../packages/excalidraw/index";
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  EXCALIDRAW_SOURCE_URL,
} from "../app_constants";
import { LanguageList } from "../app-language/LanguageList";
import { t } from "../../packages/excalidraw/i18n";
import { NOTES_URL } from "./NotesButton";
import { NotebookIcon } from "../notebook/icons";

export const AppMainMenu: React.FC<{
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
}> = React.memo((props) => {
  return (
    <MainMenu>
      <MainMenu.Item
        icon={NotebookIcon}
        onSelect={() => {
          window.location.href = NOTES_URL;
        }}
      >
        {t("labels.notebooks")}
      </MainMenu.Item>
      <MainMenu.Separator />
      <MainMenu.DefaultItems.LoadScene />
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      <MainMenu.DefaultItems.CommandPalette className="highlighted" />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.ToggleTheme
        allowSystemTheme
        theme={props.theme}
        onSelect={props.setTheme}
      />
      <MainMenu.ItemCustom>
        <LocalProfile />
      </MainMenu.ItemCustom>
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
      <MainMenu.Separator />
      <MainMenu.ItemCustom className="app-menu-credit">
        <span>
          Redesigned by{" "}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            {AUTHOR_NAME}
          </a>
          , from{" "}
          <a
            href={EXCALIDRAW_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Excalidraw
          </a>
        </span>
      </MainMenu.ItemCustom>
    </MainMenu>
  );
});
