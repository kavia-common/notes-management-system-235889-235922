"use client";

import React, { useMemo, useState } from "react";

type Props = {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthPanel({ loading, error, onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const localError = useMemo(() => {
    if (!email.trim() || !password) return null;
    if (!isValidEmail(email)) return "Enter a valid email address.";
    if (mode === "register" && password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return null;
  }, [email, password, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (!isValidEmail(email)) return;
    if (mode === "register" && password.length < 8) return;

    if (mode === "login") await onLogin(email.trim(), password);
    else await onRegister(email.trim(), password);
  }

  return (
    <section className="panel" aria-label="Authentication">
      <div className="panelHeader">
        <div className="panelTitle">
          {mode === "login" ? "Login Terminal" : "Register Terminal"}
        </div>
        <div className="row">
          <span className="smallText">Mode:</span>
          <button
            className="btn"
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            disabled={loading}
            aria-label="Toggle auth mode"
          >
            {mode === "login" ? "Switch to Register" : "Switch to Login"}
          </button>
        </div>
      </div>

      <div className="panelBody">
        <form onSubmit={submit}>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@domain.com"
            disabled={loading}
          />

          <div style={{ height: 10 }} />

          <label className="label" htmlFor="password">
            Password {mode === "register" ? "(min 8 chars)" : ""}
          </label>
          <input
            id="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            disabled={loading}
          />

          <div className="hr" />

          {(localError || error) && (
            <div className="alert" role="alert" aria-live="assertive">
              {localError ?? error}
            </div>
          )}

          <div style={{ height: 10 }} />

          <div className="rowWrap">
            <button
              className="btn btnPrimary"
              type="submit"
              disabled={loading || !!localError || !email.trim() || !password}
            >
              {loading
                ? "Processing…"
                : mode === "login"
                  ? "Login"
                  : "Register"}
            </button>
            <span className="smallText">
              Tip: use <span className="kbd">q</span> to search notes once signed
              in.
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
