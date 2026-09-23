import React, { useState } from "react";
import { getLocalUser, renameLocalUser } from "../data/localUser";

/** Device-local profile: no login, the name lives in localStorage. */
export const LocalProfile = () => {
  const [name, setName] = useState(() => getLocalUser().name);

  return (
    <label
      className="local-profile"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="local-profile__label">Your name</span>
      <input
        className="local-profile__input"
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => setName(renameLocalUser(name).name)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
};
