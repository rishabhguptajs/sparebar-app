import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";

// A caption and hashtags for a finished result, written in the character's voice.
// The answer is saved on the job, so asking again for the same result costs nothing and returns the same text.
const TEXT_MODEL = "google/gemini-2.5-flash-lite";

const Body = z.object({ jobId: z.string().uuid() });
const Kit = z.object({ caption: z.string().max(600), hashtags: z.array(z.string().max(40)).max(15) });
export type PostKit = z.infer<typeof Kit>;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, prompt, kind, status, params, character_id").eq("id", parsed.data.jobId).maybeSingle();
  const row = job as { id: string; prompt: string; kind: string; status: string; params: Record<string, unknown> | null; character_id: string | null } | null;
  if (!row || row.status !== "succeeded") return NextResponse.json({ error: "Finish a result first." }, { status: 404 });

  const saved = Kit.safeParse(row.params?.postKit);
  if (saved.success) return NextResponse.json({ kit: saved.data });

  let persona = "";
  if (row.character_id) {
    const { data } = await supabase.from("characters").select("name, niche, tone, description").eq("id", row.character_id).maybeSingle();
    const c = data as { name: string; niche?: string; tone?: string; description: string } | null;
    if (c) persona = `Creator: ${c.name}.${c.niche ? ` Niche: ${c.niche}.` : ""}${c.tone ? ` Tone of voice: ${c.tone}.` : ""}`;
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "Captions are not available right now." }, { status: 503 });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: `Write a social media caption for a ${row.kind} post. ${persona}\nWhat the post shows: ${row.prompt}\nThe caption is 1 to 3 short sentences in a natural first person voice, no emojis overload (at most two), no quotation marks. Give 5 to 8 relevant hashtags without the # sign.\nAnswer only with JSON in this shape: {"caption": string, "hashtags": string[]}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("postkit failed", res.status, (await res.text()).slice(0, 300));
    return NextResponse.json({ error: "Could not write a caption. Try again." }, { status: 502 });
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  let kit: PostKit;
  try {
    kit = Kit.parse(JSON.parse(body.choices?.[0]?.message?.content ?? ""));
  } catch {
    return NextResponse.json({ error: "Could not write a caption. Try again." }, { status: 502 });
  }
  kit.hashtags = kit.hashtags.map((h) => h.replace(/^#/, "").replace(/\s+/g, ""));
  await admin()
    .from("jobs")
    .update({ params: { ...(row.params ?? {}), postKit: kit } } as never)
    .eq("id", row.id);
  return NextResponse.json({ kit });
}
