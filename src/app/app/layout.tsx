import { AppShell } from "@/components/app-shell";
import { getBalance, isAdminHint, requireSession } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireSession();
  const [balance, isAdmin] = await Promise.all([getBalance(supabase, user.id), isAdminHint()]);
  return (
    <AppShell base="/app" balance={balance} email={user.email ?? null} canSignOut isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
