import { StudioView } from "@/components/studio-view";
import { sampleCharacters, sampleJobs, sampleModels, sampleResult } from "@/lib/sample";

export default function PreviewStudio() {
  return (
    <StudioView
      base="/preview"
      models={sampleModels}
      characters={sampleCharacters}
      recent={sampleJobs.filter((j) => j.status === "succeeded")}
      initial={{ characterId: "c1", prompt: "Unboxing a skincare set on a bright bathroom counter, handheld, natural light" }}
      demo={sampleResult}
    />
  );
}
