import { AppShell } from "@/components/app-shell";
import { getBalance, requireSession } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireSession();
  const balance = await getBalance(supabase, user.id);
  return (
    <AppShell base="/app" balance={balance} email={user.email ?? null} canSignOut>
      {children}
    </AppShell>
  );
}
