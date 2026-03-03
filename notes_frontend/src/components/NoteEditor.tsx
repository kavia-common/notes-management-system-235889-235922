"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/api";

type Props = {
  mode: "empty" | "view" | "edit" | "create";
  loading: boolean;
  error: string | null;
  note: Note | null;

  onCreate: (title: string, content: string) => Promise<void>;
  onUpdate: (noteId: string, title: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;

  onEnterCreate: () => void;
  onEnterEdit: () => void;
  onCancelEditOrCreate: () => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function NoteEditor({
  mode,
  loading,
  error,
  note,
  onCreate,
  onUpdate,
  onDelete,
  onEnterCreate,
  onEnterEdit,
  onCancelEditOrCreate,
}: Props) {
  const canEdit = mode === "view" && !!note;
  const canDelete = mode === "view" && !!note;
  const canSave = mode === "edit" || mode === "create";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Keep form in sync with selection/mode.
  useEffect(() => {
    if (mode === "create") {
      setTitle("");
      setContent("");
      return;
    }
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [mode, note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const formError = useMemo(() => {
    if (!canSave) return null;
    if (!title.trim()) return "Title is required.";
    if (!content.trim()) return "Content is required.";
    if (title.trim().length > 200) return "Title must be ≤ 200 chars.";
    if (content.trim().length > 20000) return "Content must be ≤ 20000 chars.";
    return null;
  }, [canSave, title, content]);

  async function save() {
    if (formError) return;
    if (mode === "create") {
      await onCreate(title.trim(), content.trim());
    } else if (mode === "edit" && note) {
      await onUpdate(note.id, title.trim(), content.trim());
    }
  }

  async function del() {
    if (!note) return;
    const ok = window.confirm("Delete this note permanently?");
    if (!ok) return;
    await onDelete(note.id);
  }

  return (
    <section className="panel" aria-label="Note editor">
      <div className="panelHeader">
        <div className="panelTitle">
          {mode === "empty" && "No Signal"}
          {mode === "view" && "Note Viewer"}
          {mode === "edit" && "Edit Mode"}
          {mode === "create" && "New Note"}
        </div>

        <div className="rowWrap">
          {mode === "empty" && (
            <button className="btn btnPrimary" type="button" onClick={onEnterCreate} disabled={loading}>
              + New
            </button>
          )}

          {canEdit && (
            <button className="btn btnPrimary" type="button" onClick={onEnterEdit} disabled={loading}>
              Edit
            </button>
          )}

          {canDelete && (
            <button className="btn btnDanger" type="button" onClick={del} disabled={loading}>
              Delete
            </button>
          )}

          {(mode === "edit" || mode === "create") && (
            <button className="btn" type="button" onClick={onCancelEditOrCreate} disabled={loading}>
              Cancel
            </button>
          )}

          {canSave && (
            <button className="btn btnPrimary" type="button" onClick={save} disabled={loading || !!formError}>
              {loading ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="panelBody">
        {error && (
          <div className="alert" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {mode === "empty" && !error && (
          <div className="smallText">
            Select a note on the left, or create a new one. This console awaits input.
          </div>
        )}

        {mode === "view" && note && (
          <>
            <div className="noteMeta" aria-label="Note timestamps">
              <span>Created: {formatDate(note.created_at)}</span>
              <span>•</span>
              <span>Updated: {formatDate(note.updated_at)}</span>
            </div>
            <div className="hr" />
            <div className="noteTitle" style={{ marginBottom: 10 }}>
              {note.title}
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "var(--font)",
                fontSize: "13px",
                color: "var(--text)",
              }}
            >
              {note.content}
            </pre>
          </>
        )}

        {(mode === "edit" || mode === "create") && (
          <>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="e.g., CRT Dreams"
            />

            <div style={{ height: 10 }} />

            <label className="label" htmlFor="content">
              Content
            </label>
            <textarea
              id="content"
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              placeholder="Write your note…"
            />

            <div style={{ height: 10 }} />

            {formError && (
              <div className="alert" role="alert" aria-live="polite">
                {formError}
              </div>
            )}

            <div style={{ height: 10 }} />

            <div className="smallText">
              Limits: title ≤ 200 chars, content ≤ 20000 chars.
            </div>
          </>
        )}
      </div>
    </section>
  );
}
