import { create } from "zustand";
import type { NoteWithMeta, SearchResult } from "@/types";

interface NoteStore {
  notes: NoteWithMeta[];
  selectedNote: NoteWithMeta | null;
  searchResults: SearchResult[];
  isLoading: boolean;
  setNotes: (notes: NoteWithMeta[]) => void;
  setSelectedNote: (note: NoteWithMeta | null) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  addNote: (note: NoteWithMeta) => void;
  updateNote: (id: string, data: Partial<NoteWithMeta>) => void;
  removeNote: (id: string) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  selectedNote: null,
  searchResults: [],
  isLoading: false,
  setNotes: (notes) => set({ notes }),
  setSelectedNote: (note) => set({ selectedNote: note }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ isLoading: loading }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, data) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
      selectedNote:
        state.selectedNote?.id === id
          ? { ...state.selectedNote, ...data }
          : state.selectedNote,
    })),
  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNote:
        state.selectedNote?.id === id ? null : state.selectedNote,
    })),
}));