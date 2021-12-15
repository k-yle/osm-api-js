import { osmFetch } from "../_osmFetch";

export async function createNote(
  lat: number,
  lng: number,
  text: string
): Promise<void> {
  await osmFetch("/0.6/notes", { lat, lon: lng, text });
}

export async function commentOnNote(
  nodeId: number,
  text: string
): Promise<void> {
  await osmFetch(`/0.6/notes/${nodeId}/comment`, { text });
}

export async function reopenNote(nodeId: number, text?: string): Promise<void> {
  await osmFetch(`/0.6/notes/${nodeId}/reopen`, { text });
}
