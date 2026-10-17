import { MODELS } from "@/config/models";
import { creditsForModel } from "@/lib/credits";
import { getAdapter } from "@/lib/providers";
import { createClient } from "@/lib/supabase/server";
import { Playground } from "./playground";

// Temporary test surface for build step 1. Replaced by the real studio UI in step 2.
export default async function AppPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: balance } = await supabase.rpc("credit_balance", { p_user: auth.user!.id } as never);

  const models = MODELS.filter((m) => m.enabled && getAdapter(m.lab)).map((m) => ({
    key: m.key,
    label: m.label,
    kind: m.kind,
    credits: creditsForModel(m),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Playground</h1>
        <span className="text-sm opacity-70">{Number(balance ?? 0)} credits</span>
      </div>
      <Playground models={models} />
    </main>
  );
}
