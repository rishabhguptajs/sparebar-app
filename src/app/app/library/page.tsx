import { LibraryView } from "@/components/library-view";
import { getJobs, requireSession } from "@/lib/data";

export default async function LibraryPage() {
  const { supabase } = await requireSession();
  const jobs = await getJobs(supabase, { limit: 120 });
  return <LibraryView base="/app" jobs={jobs} />;
}
