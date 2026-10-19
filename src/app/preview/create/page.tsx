import { CreateView } from "@/components/create-view";
import { sampleCharacters, sampleModels, sampleProducts } from "@/lib/sample";

export default function PreviewCreate() {
  return <CreateView base="/preview" models={sampleModels} characters={sampleCharacters} products={sampleProducts} />;
}
