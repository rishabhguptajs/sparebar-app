import { AppShell } from "@/components/app-shell";
import { getAdminUser, getBalance, requireSession } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireSession();
  const [balance, adminUser] = await Promise.all([getBalance(supabase, user.id), getAdminUser()]);
  return (
    <AppShell base="/app" balance={balance} email={user.email ?? null} canSignOut isAdmin={!!adminUser}>
      {children}
    </AppShell>
  );
}
