/**
 * Assets — a central library of reusable marketing building blocks: headlines,
 * CTAs, brand statements, value props, and visual ideas. Includes an AI
 * "Suggest assets" action that drafts on-brand candidates for the focused
 * product (you choose which to save).
 */
import { useState } from "react";
import { Library, Plus, Trash2, Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { Asset, AssetType } from "@/types";

const TYPES: AssetType[] = ["headline", "cta", "brand-statement", "value-prop", "visual-idea"];
const TYPE_LABEL: Record<AssetType, string> = {
  headline: "Headline",
  cta: "CTA",
  "brand-statement": "Brand statement",
  "value-prop": "Value prop",
  "visual-idea": "Visual idea",
};

export default function Assets() {
  const { data, add, remove } = useStore();
  const ctx = useSkillContext();
  const [text, setText] = useState("");
  const [type, setType] = useState<AssetType>("headline");
  const [filter, setFilter] = useState<AssetType | "all">("all");
  const [suggestions, setSuggestions] = useState<{ type: AssetType; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  function addAsset(t: AssetType, value: string) {
    const asset: Asset = {
      id: uid("a"),
      type: t,
      text: value.trim(),
      productId: ctx.product?.id ?? null,
      tags: ctx.product ? [ctx.product.name.toLowerCase()] : [],
      createdAt: today(),
    };
    add("assets", asset);
  }

  function manualAdd() {
    if (!text.trim()) { toast.error("Write the asset text"); return; }
    addAsset(type, text);
    setText("");
    toast.success("Asset saved");
  }

  // AI suggestions: derive on-brand candidates from the product + brand voice.
  async function suggest() {
    setLoading(true);
    try {
      const voice = await skills.brandVoice.run({}, ctx);
      const subject = ctx.product?.name ?? ctx.brand.name;
      const benefits = ctx.product?.keyBenefits ?? [ctx.brand.tagline];
      const out: { type: AssetType; text: string }[] = [
        { type: "headline", text: `${subject}: ${benefits[0]}.` },
        { type: "headline", text: `Finally, ${benefits[0]} — without the busywork.` },
        { type: "cta", text: `Try ${subject} free` },
        { type: "value-prop", text: benefits.slice(0, 2).join(" · ") },
        { type: "brand-statement", text: ctx.brand.tagline },
        { type: "visual-idea", text: `Before/after split-screen showing ${benefits[0]}.` },
      ];
      setSuggestions(out);
      toast.success(`Suggested ${out.length} assets (voice: ${voice.doList.length} rules applied)`);
    } finally {
      setLoading(false);
    }
  }

  const visible = data.assets.filter((a) => filter === "all" || a.type === filter);

  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Assets"
        description="Your reusable headlines, CTAs, brand statements, value props, and visual ideas."
        icon={<Library className="h-6 w-6" />}
        actions={
          <Button variant="outline" onClick={suggest} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-1.5">Suggest assets</span>
          </Button>
        }
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="glass-panel mb-4 border-primary/40">
          <CardContent className="p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI suggestions — click to save</div>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { addAsset(s.type, s.text); setSuggestions((arr) => arr.filter((_, idx) => idx !== i)); toast.success("Saved"); }}
                  className="flex w-full items-center justify-between rounded-md border border-border/60 p-2 text-left text-sm hover:border-primary/50"
                >
                  <span><Badge variant="outline" className="mr-2 text-[10px]">{TYPE_LABEL[s.type]}</Badge>{s.text}</span>
                  <Check className="h-4 w-4 text-success" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual add */}
      <Card className="glass-panel mb-4">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
          <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Asset text…" onKeyDown={(e) => e.key === "Enter" && manualAdd()} />
          <Button onClick={manualAdd}><Plus className="h-4 w-4" /><span className="ml-1.5">Add</span></Button>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>All ({data.assets.length})</Badge>
        {TYPES.map((t) => (
          <Badge key={t} variant={filter === t ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter(t)}>{TYPE_LABEL[t]}</Badge>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Library className="h-8 w-8" />} title="No assets here" description="Add one above or use AI suggestions." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((a) => {
            const product = data.products.find((p) => p.id === a.productId);
            return (
              <div key={a.id} className="group rounded-md border border-border/60 bg-card p-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[a.type]}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" onClick={() => remove("assets", a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <p className="mt-2 text-sm">{a.text}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">{product?.name ?? "Brand"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
