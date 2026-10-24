import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: profile } = await admin().from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  return NextResponse.json({
    email: user.email ?? null,
    fullName: (profile as { full_name: string | null } | null)?.full_name ?? "",
  });
}

const Body = z.object({
  fullName: z.string().trim().max(80, "Keep the name under 80 characters."),
});

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details and try again." }, { status: 400 });
  const { error } = await admin()
    .from("profiles")
    .update({ full_name: parsed.data.fullName || null } as never)
    .eq("id", user.id);
  if (error) {
    console.error("settings save failed", error.message);
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
