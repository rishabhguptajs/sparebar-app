import { StudioView } from "@/components/studio-view";
import { sampleCharacters, sampleJobs, sampleModels, sampleProducts, sampleResult } from "@/lib/sample";

export default function PreviewStudio() {
  return (
    <StudioView
      base="/preview"
      models={sampleModels}
      characters={sampleCharacters}
      products={sampleProducts}
      recent={sampleJobs.filter((j) => j.status === "succeeded")}
      initial={{ characterId: "c1", prompt: "Unboxing a skincare set on a bright bathroom counter, handheld, natural light" }}
      notice="You have 2 free credits, enough for one image. They work for images only and expire in 14 days."
      demo={sampleResult}
    />
  );
}
