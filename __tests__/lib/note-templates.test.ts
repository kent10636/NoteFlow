import { describe, it, expect } from "vitest";
import { getNoteTemplate, NOTE_TEMPLATES } from "@/lib/note-templates";

describe("note templates", () => {
  it("includes built-in templates", () => {
    expect(NOTE_TEMPLATES.map((t) => t.id)).toEqual([
      "blank",
      "meeting",
      "reading",
      "weekly",
    ]);
  });

  it("returns template by id", () => {
    const meeting = getNoteTemplate("meeting");
    expect(meeting.name).toBe("会议记录");
    expect(meeting.tags).toContain("会议");
  });

  it("falls back to blank for unknown id", () => {
    expect(getNoteTemplate("unknown").id).toBe("blank");
  });
});