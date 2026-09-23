import React, { useState } from "react";
import { getRandomUsername } from "@excalidraw/random-username";
import { Dialog } from "../../packages/excalidraw/components/Dialog";
import { TextField } from "../../packages/excalidraw/components/TextField";
import { FilledButton } from "../../packages/excalidraw/components/FilledButton";
import { isTestEnv } from "../../packages/excalidraw/utils";
import { getLocalUser, hasLocalUser, renameLocalUser } from "../data/localUser";

import "./FirstVisitNameDialog.scss";

/**
 * Asks for the user's name the first time this browser opens the app. The
 * name is stored locally only (see data/localUser.ts) and can be changed later
 * from the main menu.
 */
export const FirstVisitNameDialog = () => {
  const [isOpen, setIsOpen] = useState(() => !isTestEnv() && !hasLocalUser());
  const [suggestion] = useState(() => getRandomUsername());
  const [name, setName] = useState("");

  if (!isOpen) {
    return null;
  }

  const save = () => {
    renameLocalUser(name.trim() || suggestion);
    setIsOpen(false);
  };

  const skip = () => {
    // still creates the local identity so we don't ask again
    getLocalUser();
    setIsOpen(false);
  };

  return (
    <Dialog
      size="small"
      title="Welcome! What should we call you?"
      onCloseRequest={skip}
      closeOnClickOutside={false}
      className="first-visit-name-dialog"
    >
      <p className="first-visit-name-dialog__text">
        Your name stays on this device — there's no account or sign-up. You can
        change it anytime from the menu.
      </p>
      <TextField
        label="Your name"
        placeholder={suggestion}
        value={name}
        onChange={setName}
        selectOnRender
        fullWidth
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            save();
          }
        }}
      />
      <div className="first-visit-name-dialog__actions">
        <FilledButton
          variant="outlined"
          color="muted"
          label="Skip"
          onClick={skip}
        />
        <FilledButton label="Start drawing" onClick={save} />
      </div>
    </Dialog>
  );
};
