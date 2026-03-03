"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Note, NotesListResponse } from "@/lib/api";

type Props = {
  loading: boolean;
  error: string | null;
  listResponse: NotesListResponse | null;
  selectedId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
  onNextPage: () => Promise<void>;
  onPrevPage: () => Promise<void>;
  onNew: () => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function previewText(note: Note): string {
  const text = note.content.trim().replace(/\s+/g, " ");
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

export function NotesSidebar({
  loading,
  error,
  listResponse,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onRefresh,
  onNextPage,
  onPrevPage,
  onNew,
}: Props) {
  const [localQ, setLocalQ] = useState(query);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setLocalQ(query), [query]);

  // Keyboard shortcut: press "q" to focus search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "q" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Avoid stealing focus while typing in any input/textarea.
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const items = listResponse?.items ?? [];
  const total = listResponse?.total ?? 0;
  const limit = listResponse?.limit ?? 20;
  const offset = listResponse?.offset ?? 0;

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const headerRight = useMemo(() => {
    if (loading) return <span className="badge">Loading…</span>;
    return <span className="badge">{total} notes</span>;
  }, [loading, total]);

  return (
    <section className="panel" aria-label="Notes list">
      <div className="panelHeader">
        <div className="panelTitle">Notes Index</div>
        <div className="rowWrap">{headerRight}</div>
      </div>

      <div className="panelBody">
        <label className="label" htmlFor="search">
          Search (full-text)
        </label>
        <div className="rowWrap">
          <input
            id="search"
            ref={searchRef}
            className="input"
            value={localQ}
            placeholder="type to search…"
            onChange={(e) => setLocalQ(e.target.value)}
            disabled={loading}
          />
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => onQueryChange(localQ)}
            disabled={loading}
          >
            Search
          </button>
          <button className="btn" type="button" onClick={onRefresh} disabled={loading}>
            Refresh
          </button>
        </div>

        <div style={{ height: 10 }} />

        <div className="rowWrap">
          <button className="btn btnPrimary" type="button" onClick={onNew} disabled={loading}>
            + New Note
          </button>
          <span className="smallText">
            Shortcut: <span className="kbd">q</span> focuses search
          </span>
        </div>

        <div className="hr" />

        {error && (
          <div className="alert" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {!error && !loading && items.length === 0 && (
          <div className="smallText">No notes found. Create your first note.</div>
        )}

        <div className="noteList" role="list" aria-label="Notes results">
          {items.map((n) => {
            const active = n.id === selectedId;
            return (
              <div
                key={n.id}
                role="listitem"
                className={`noteItem${active ? " noteItemActive" : ""}`}
                tabIndex={0}
                onClick={() => onSelect(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(n.id);
                }}
                aria-current={active ? "true" : "false"}
              >
                <div className="noteTitle">{n.title}</div>
                <div className="noteMeta">
                  <span>{formatDate(n.updated_at)}</span>
                  <span>•</span>
                  <span>{previewText(n)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hr" />

        <div className="rowWrap" aria-label="Pagination controls">
          <button className="btn" type="button" onClick={onPrevPage} disabled={loading || !canPrev}>
            Prev
          </button>
          <span className="smallText">
            Showing {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)} of {total}
          </span>
          <button className="btn" type="button" onClick={onNextPage} disabled={loading || !canNext}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
