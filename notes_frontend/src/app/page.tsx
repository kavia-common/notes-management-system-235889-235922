"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { AuthPanel } from "@/components/AuthPanel";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import type { Note, NotesListResponse } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type NotesUiMode = "empty" | "view" | "edit" | "create";

export default function Home() {
  const { api, state: auth, actions: authActions } = useAuth();

  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesResponse, setNotesResponse] = useState<NotesListResponse | null>(
    null
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [mode, setMode] = useState<NotesUiMode>("empty");

  const isAuthed = useMemo(() => !!auth.token, [auth.token]);

  const loadNotes = useCallback(
    async (opts?: { newOffset?: number; newQuery?: string }) => {
      if (!isAuthed) return;
      setNotesLoading(true);
      setNotesError(null);
      try {
        const res = await api.listNotes({
          q: opts?.newQuery ?? query,
          limit,
          offset: opts?.newOffset ?? offset,
        });
        setNotesResponse(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load notes.";
        setNotesError(msg);
      } finally {
        setNotesLoading(false);
      }
    },
    [api, isAuthed, query, limit, offset]
  );

  const loadNote = useCallback(
    async (noteId: string) => {
      if (!isAuthed) return;
      setNoteLoading(true);
      setNoteError(null);
      try {
        const n = await api.getNote(noteId);
        setSelectedNote(n);
        setMode("view");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load note.";
        setNoteError(msg);
        setSelectedNote(null);
        setMode("empty");
      } finally {
        setNoteLoading(false);
      }
    },
    [api, isAuthed]
  );

  // When user becomes authenticated, load first page.
  useEffect(() => {
    if (!isAuthed) {
      setNotesResponse(null);
      setSelectedId(null);
      setSelectedNote(null);
      setMode("empty");
      setNotesError(null);
      setNoteError(null);
      setOffset(0);
      setQuery("");
      return;
    }
    loadNotes({ newOffset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  async function handleSelect(id: string) {
    setSelectedId(id);
    await loadNote(id);
  }

  async function handleQueryChange(q: string) {
    setQuery(q);
    setOffset(0);
    setSelectedId(null);
    setSelectedNote(null);
    setMode("empty");
    await loadNotes({ newOffset: 0, newQuery: q });
  }

  async function nextPage() {
    const total = notesResponse?.total ?? 0;
    const next = offset + limit;
    if (next >= total) return;
    setOffset(next);
    setSelectedId(null);
    setSelectedNote(null);
    setMode("empty");
    await loadNotes({ newOffset: next });
  }

  async function prevPage() {
    const prev = Math.max(0, offset - limit);
    if (prev === offset) return;
    setOffset(prev);
    setSelectedId(null);
    setSelectedNote(null);
    setMode("empty");
    await loadNotes({ newOffset: prev });
  }

  async function refresh() {
    await loadNotes();
    if (selectedId) await loadNote(selectedId);
  }

  async function create(title: string, content: string) {
    setNoteLoading(true);
    setNoteError(null);
    try {
      const n = await api.createNote({ title, content, is_archived: false });
      // Refresh list and select new note.
      setOffset(0);
      await loadNotes({ newOffset: 0 });
      setSelectedId(n.id);
      setSelectedNote(n);
      setMode("view");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create note.";
      setNoteError(msg);
    } finally {
      setNoteLoading(false);
    }
  }

  async function update(noteId: string, title: string, content: string) {
    setNoteLoading(true);
    setNoteError(null);
    try {
      const n = await api.updateNote(noteId, { title, content });
      setSelectedNote(n);
      setMode("view");
      await loadNotes();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update note.";
      setNoteError(msg);
    } finally {
      setNoteLoading(false);
    }
  }

  async function del(noteId: string) {
    setNoteLoading(true);
    setNoteError(null);
    try {
      await api.deleteNote(noteId);
      setSelectedId(null);
      setSelectedNote(null);
      setMode("empty");
      await loadNotes({ newOffset: 0 });
      setOffset(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete note.";
      setNoteError(msg);
    } finally {
      setNoteLoading(false);
    }
  }

  return (
    <div className="appShell">
      <TopBar email={auth.email} onLogout={authActions.logout} />

      <main className="container">
        {!isAuthed ? (
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            <AuthPanel
              loading={auth.loading}
              error={auth.error}
              onLogin={authActions.login}
              onRegister={authActions.register}
            />
            <div className="smallText" style={{ marginTop: 10 }}>
              Backend:{" "}
              <span className="kbd">
                {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid">
            <NotesSidebar
              loading={notesLoading}
              error={notesError}
              listResponse={notesResponse}
              selectedId={selectedId}
              query={query}
              onQueryChange={handleQueryChange}
              onSelect={handleSelect}
              onRefresh={refresh}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              onNew={() => setMode("create")}
            />

            <NoteEditor
              mode={mode}
              loading={noteLoading}
              error={noteError}
              note={selectedNote}
              onCreate={create}
              onUpdate={update}
              onDelete={del}
              onEnterCreate={() => setMode("create")}
              onEnterEdit={() => setMode("edit")}
              onCancelEditOrCreate={() => setMode(selectedNote ? "view" : "empty")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
