import { LibraryView } from "@/components/library-view";
import { sampleJobs } from "@/lib/sample";

export default function PreviewLibrary() {
  return <LibraryView base="/preview" jobs={sampleJobs} demo />;
}
