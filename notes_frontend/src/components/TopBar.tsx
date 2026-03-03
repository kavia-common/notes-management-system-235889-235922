"use client";

import React from "react";

type Props = {
  email: string | null;
  onLogout: () => void;
};

export function TopBar({ email, onLogout }: Props) {
  return (
    <header className="topBar">
      <div className="topBarInner">
        <div className="brand" aria-label="Retro Notes">
          <div className="brandTitle">Retro Notes</div>
          <div className="brandSub">FastAPI + Next.js • neon console vibes</div>
        </div>

        <div className="topBarSpacer" />

        {email ? (
          <div className="rowWrap" aria-label="Authenticated user controls">
            <span className="badge" title="Signed in email">
              {email}
            </span>
            <button className="btn" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        ) : (
          <span className="badge" title="Not signed in">
            Guest Mode
          </span>
        )}
      </div>
    </header>
  );
}
