import { describe, it, expect, beforeEach } from "vitest";
import { useNoteStore } from "@/stores/note-store";
import type { NoteWithMeta, SearchResult } from "@/types";

function makeNote(id: string, overrides: Partial<NoteWithMeta> = {}): NoteWithMeta {
  const now = new Date("2026-06-21T00:00:00.000Z");
  return {
    id,
    title: `Note ${id}`,
    content: `Content for ${id}`,
    summary: null,
    tags: [],
    published: false,
    userId: "u1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("useNoteStore", () => {
  beforeEach(() => {
    useNoteStore.setState({
      notes: [],
      selectedNote: null,
      searchResults: [],
      isLoading: false,
    });
  });

  it("setNotes replaces the notes list", () => {
    const notes = [makeNote("n1"), makeNote("n2")];
    useNoteStore.getState().setNotes(notes);
    expect(useNoteStore.getState().notes).toEqual(notes);
  });

  it("setSelectedNote updates selected note", () => {
    const note = makeNote("n1");
    useNoteStore.getState().setSelectedNote(note);
    expect(useNoteStore.getState().selectedNote).toEqual(note);

    useNoteStore.getState().setSelectedNote(null);
    expect(useNoteStore.getState().selectedNote).toBeNull();
  });

  it("setSearchResults replaces search results", () => {
    const results: SearchResult[] = [
      {
        id: "n1",
        title: "Hit",
        content: "body",
        summary: null,
        tags: ["ai"],
        similarity: 0.9,
      },
    ];
    useNoteStore.getState().setSearchResults(results);
    expect(useNoteStore.getState().searchResults).toEqual(results);
  });

  it("setLoading toggles loading state", () => {
    useNoteStore.getState().setLoading(true);
    expect(useNoteStore.getState().isLoading).toBe(true);

    useNoteStore.getState().setLoading(false);
    expect(useNoteStore.getState().isLoading).toBe(false);
  });

  it("addNote prepends to the notes list", () => {
    const existing = makeNote("n1");
    const incoming = makeNote("n2");

    useNoteStore.getState().setNotes([existing]);
    useNoteStore.getState().addNote(incoming);

    expect(useNoteStore.getState().notes).toEqual([incoming, existing]);
  });

  it("updateNote updates list entry and matching selectedNote", () => {
    const note1 = makeNote("n1", { title: "Original" });
    const note2 = makeNote("n2");

    useNoteStore.getState().setNotes([note1, note2]);
    useNoteStore.getState().setSelectedNote(note1);
    useNoteStore.getState().updateNote("n1", { title: "Updated", tags: ["tag"] });

    const state = useNoteStore.getState();
    expect(state.notes.find((n) => n.id === "n1")).toMatchObject({
      title: "Updated",
      tags: ["tag"],
    });
    expect(state.selectedNote).toMatchObject({
      id: "n1",
      title: "Updated",
      tags: ["tag"],
    });
    expect(state.notes.find((n) => n.id === "n2")?.title).toBe("Note n2");
  });

  it("updateNote leaves selectedNote unchanged when id does not match", () => {
    const selected = makeNote("n1");
    const other = makeNote("n2");

    useNoteStore.getState().setNotes([selected, other]);
    useNoteStore.getState().setSelectedNote(selected);
    useNoteStore.getState().updateNote("n2", { title: "Changed" });

    expect(useNoteStore.getState().selectedNote).toEqual(selected);
  });

  it("removeNote removes from list and clears selectedNote when matching", () => {
    const note1 = makeNote("n1");
    const note2 = makeNote("n2");

    useNoteStore.getState().setNotes([note1, note2]);
    useNoteStore.getState().setSelectedNote(note1);
    useNoteStore.getState().removeNote("n1");

    const state = useNoteStore.getState();
    expect(state.notes).toEqual([note2]);
    expect(state.selectedNote).toBeNull();
  });

  it("removeNote keeps selectedNote when removing a different note", () => {
    const note1 = makeNote("n1");
    const note2 = makeNote("n2");

    useNoteStore.getState().setNotes([note1, note2]);
    useNoteStore.getState().setSelectedNote(note1);
    useNoteStore.getState().removeNote("n2");

    const state = useNoteStore.getState();
    expect(state.notes).toEqual([note1]);
    expect(state.selectedNote).toEqual(note1);
  });
});