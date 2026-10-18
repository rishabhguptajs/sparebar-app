import { CreateView } from "@/components/create-view";
import { sampleCharacters, sampleModels } from "@/lib/sample";

export default function PreviewCreate() {
  return <CreateView base="/preview" models={sampleModels} characters={sampleCharacters} />;
}
