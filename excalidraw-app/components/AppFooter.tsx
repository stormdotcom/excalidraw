import React from "react";
import { Footer } from "../../packages/excalidraw/index";
import { EncryptedIcon } from "./EncryptedIcon";
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  EXCALIDRAW_SOURCE_URL,
} from "../app_constants";

export const AppFooter = React.memo(() => {
  return (
    <Footer>
      <div className="app-footer">
        <EncryptedIcon />
        <span className="app-footer__credit">
          Redesigned by{" "}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            {AUTHOR_NAME}
          </a>
          <span className="app-footer__from">
            {" "}
            · from{" "}
            <a
              href={EXCALIDRAW_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Excalidraw
            </a>
          </span>
        </span>
      </div>
    </Footer>
  );
});
