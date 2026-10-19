import { AdsView } from "@/components/ads-view";
import { sampleCharacters, sampleModels, sampleProducts } from "@/lib/sample";

export default function PreviewAds() {
  return <AdsView base="/preview" models={sampleModels} characters={sampleCharacters} products={sampleProducts} demo />;
}
