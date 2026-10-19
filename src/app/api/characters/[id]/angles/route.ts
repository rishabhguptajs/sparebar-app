import { NextResponse } from "next/server";
import { adoptOutput, MAX_CHARACTER_REFS, presentCharacter, promptCharacter, type CharacterRow } from "@/lib/characters";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { buildPortraitPrompt, type PortraitAngle } from "@/lib/prompts/build";
import { getObjectBytes } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";

// Adds a three quarter shot and a full body shot to a character, made from its first photo.
// More angles of the same person give later generations stronger references to hold on to.
export const maxDuration = 60;
const ANGLES: PortraitAngle[] = ["angle", "full"];

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.from("characters").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  const row = data as CharacterRow | null;
  if (!row) return NextResponse.json({ error: "That character is no longer available." }, { status: 404 });
  if (row.reference_keys.length + ANGLES.length > MAX_CHARACTER_REFS) {
    return NextResponse.json({ error: `A character holds up to ${MAX_CHARACTER_REFS} photos. Remove one first.` }, { status: 400 });
  }

  try {
    const f = await getObjectBytes(row.reference_keys[0]);
    const reference = { mime: f.mime, base64: Buffer.from(f.bytes).toString("base64") };
    const { name, description, profile } = promptCharacter(row);
    const runs = await Promise.allSettled(
      ANGLES.map((angle) => {
        const p = buildPortraitPrompt({ name, description, profile, angle, fromReference: true });
        return startJob({
          userId: user.id,
          modelKey: "nano-banana-2.1",
          prompt: `${angle === "full" ? "Full body" : "Three quarter"} shot of ${name}`,
          providerPrompt: p.text,
          aspectRatio: "3:4",
          references: [reference],
          characterId: row.id,
          promptVersion: p.version,
          referenceKeys: [row.reference_keys[0]],
          meta: { portrait: true, angle },
        });
      }),
    );
    const keys: string[] = [];
    const tags: string[] = [];
    for (const [i, r] of runs.entries()) {
      if (r.status === "fulfilled" && r.value.status === "succeeded" && r.value.outputs[0]) {
        keys.push(await adoptOutput(user.id, row.id, ANGLES[i], r.value.outputs[0]));
        tags.push(ANGLES[i]);
      }
    }
    if (keys.length === 0) {
      const refused = runs.find((r): r is PromiseRejectedResult => r.status === "rejected" && r.reason instanceof UserFacingError);
      if (refused) return NextResponse.json({ error: (refused.reason as UserFacingError).message }, { status: (refused.reason as UserFacingError).status });
      return NextResponse.json({ error: "The extra photos could not be generated. Your credits were refunded." }, { status: 502 });
    }
    const baseTags = row.reference_tags?.length === row.reference_keys.length ? row.reference_tags : row.reference_keys.map(() => "photo");
    const { data: saved, error } = await admin()
      .from("characters")
      .update({ reference_keys: [...row.reference_keys, ...keys], reference_tags: [...baseTags, ...tags] } as never)
      .eq("id", row.id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ character: await presentCharacter(saved as CharacterRow) });
  } catch (e) {
    if (e instanceof UserFacingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("character angles failed", e);
    return NextResponse.json({ error: "Could not add the extra photos. Try again." }, { status: 500 });
  }
}
