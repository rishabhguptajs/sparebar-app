import { ProductsView } from "@/components/products-view";
import { sampleProducts } from "@/lib/sample";

export default function PreviewProducts() {
  return <ProductsView base="/preview" products={sampleProducts} demo />;
}
