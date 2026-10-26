import { NextResponse } from "next/server";
import { z } from "zod";
import { adoptAvatar } from "@/lib/avatars";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 30;

// Copies a premade avatar into the signed-in user's characters. No credits: the portraits already exist.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const result = await adoptAvatar(user.id, id);
    if (!result) return NextResponse.json({ error: "That avatar is not available." }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    console.error("pick avatar failed", e);
    return NextResponse.json({ error: "Could not add that avatar. Try again." }, { status: 500 });
  }
}
