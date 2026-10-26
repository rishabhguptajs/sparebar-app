import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/avatars";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ avatars: await listAvatars() });
}
