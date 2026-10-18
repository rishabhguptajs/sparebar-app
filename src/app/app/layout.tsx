import { AppShell } from "@/components/app-shell";
import { THEME_SCRIPT } from "@/components/theme";
import { requireSession } from "@/lib/data";

// No database work here: the shell renders at once and the balance arrives from /api/me.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <AppShell base="/app" email={user.email ?? null} canSignOut>
        {children}
      </AppShell>
    </>
  );
}
