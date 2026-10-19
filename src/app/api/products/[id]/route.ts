import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const { error } = await admin().from("products").update({ deleted_at: new Date().toISOString() } as never).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not remove the product." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
