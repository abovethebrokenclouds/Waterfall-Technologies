/**
 * ProductPicker — selects the product/app currently in focus. The choice flows
 * into the AI SkillContext so every generation is tailored to that product.
 * Rendered in the top bar so it's available on every screen.
 */
import { Boxes } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/AppStore";

export function ProductPicker() {
  const { data, selectedProductId, setSelectedProductId } = useStore();

  return (
    <Select
      value={selectedProductId ?? "all"}
      onValueChange={(v) => setSelectedProductId(v === "all" ? null : v)}
    >
      <SelectTrigger className="w-[200px] h-9">
        <Boxes className="h-4 w-4 text-primary shrink-0" />
        <SelectValue placeholder="All products" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All products (brand-level)</SelectItem>
        {data.products.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
