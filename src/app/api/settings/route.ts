import { NextResponse } from "next/server";
import { z } from "zod";
import { STATES } from "@/config/plans";
import { regionOf } from "@/lib/country";
import { getProfile } from "@/lib/profile";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const profile = await getProfile(user.id, req.headers);
  return NextResponse.json({
    email: user.email ?? null,
    fullName: profile.full_name ?? "",
    stateCode: profile.state_code ?? "",
    region: regionOf(profile.country),
  });
}

const Body = z.object({
  fullName: z.string().trim().max(80, "Keep the name under 80 characters."),
  stateCode: z.string().refine((v) => v === "" || STATES.some((s) => s.code === v), "Choose a state from the list."),
});

// Country is never editable here: it decides the payment region and is set at sign-in.
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details and try again." }, { status: 400 });
  const { error } = await admin()
    .from("profiles")
    .update({ full_name: parsed.data.fullName || null, state_code: parsed.data.stateCode || null } as never)
    .eq("id", user.id);
  if (error) {
    console.error("settings save failed", error.message);
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
