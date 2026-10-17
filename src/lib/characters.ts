import "server-only";
import { getObjectBytes, signedUrl } from "@/lib/r2";
import type { ReferenceImage } from "@/lib/providers";
import type { CharacterCard } from "@/lib/ui-types";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  reference_keys: string[];
  created_at: string;
};

export async function presentCharacter(row: CharacterRow): Promise<CharacterCard> {
  const cover = row.reference_keys[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverUrl: cover ? await signedUrl(cover) : null,
  };
}

/** Reference photos for a generation. Video models take one, images take up to three. */
export async function loadReferences(row: CharacterRow, max: number): Promise<ReferenceImage[]> {
  const keys = row.reference_keys.slice(0, max);
  const files = await Promise.all(keys.map((k) => getObjectBytes(k)));
  return files.map((f) => ({ mime: f.mime, base64: Buffer.from(f.bytes).toString("base64") }));
}

/** Text sent to the lab: keeps the look fixed and adds the scene the user asked for. */
export function characterPrompt(row: CharacterRow, prompt: string): string {
  const look = row.description.trim();
  return [
    "Keep the same person as in the reference photos, with the same face, hair and build.",
    look ? `Character details: ${look}` : null,
    `Scene: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");
}
