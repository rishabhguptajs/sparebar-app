import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

// A quick look at a reference photo by a small vision model: is it one person with the face showing?
// Advice only. If the check cannot run, the answer is "no tips" and the upload goes ahead.
const MODEL = "gemini-3.1-flash-lite";
const MAX_BYTES = 1.4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const Verdict = z.object({
  people: z.number().int().min(0).max(20),
  faceVisible: z.boolean(),
  sunglasses: z.boolean().default(false),
  heavilyFiltered: z.boolean().default(false),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ tips: [] });

  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES || !ALLOWED.has(file.type)) return NextResponse.json({ tips: [] });

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Look at this photo that will be used as a reference for an AI character. Count the people, say whether one face is clearly visible, whether sunglasses hide the eyes, and whether a heavy beauty filter or edit is applied." },
              { inline_data: { mime_type: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { people: { type: "INTEGER" }, faceVisible: { type: "BOOLEAN" }, sunglasses: { type: "BOOLEAN" }, heavilyFiltered: { type: "BOOLEAN" } },
            required: ["people", "faceVisible"],
          },
        },
      }),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ tips: [] });
    const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const v = Verdict.parse(JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? ""));
    return NextResponse.json({ tips: tipsFor(v) });
  } catch {
    return NextResponse.json({ tips: [] });
  }
}

function tipsFor(v: z.infer<typeof Verdict>): string[] {
  const tips: string[] = [];
  if (v.people === 0 || !v.faceVisible) tips.push("We could not see a clear face. Use a photo where the face is in view.");
  else if (v.people > 1) tips.push("There is more than one person in this photo. Use a photo of just your character.");
  if (v.sunglasses) tips.push("Sunglasses hide the eyes. A photo without them holds the face better.");
  if (v.heavilyFiltered) tips.push("This photo looks heavily filtered. An unfiltered photo gives a more stable face.");
  return tips;
}
