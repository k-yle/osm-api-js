import { osmFetch } from "../_osmFetch";

export async function subscribeToNote(noteId: number): Promise<void> {
  await osmFetch(`/0.6/notes/${noteId}/subscription`, {}, { method: "POST" });
}

export async function unsubscribeFromNote(noteId: number): Promise<void> {
  await osmFetch(`/0.6/notes/${noteId}/subscription`, {}, { method: "DELETE" });
}
