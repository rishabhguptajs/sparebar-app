import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

// Development-only preview of the app UI with sample data. Hidden in production.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <AppShell base="/preview" balance={38} email="maya@example.com" canSignOut={false}>
      {children}
    </AppShell>
  );
}
