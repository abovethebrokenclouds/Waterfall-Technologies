/**
 * BrandApps — define the company brand (one Brand) and the catalog of apps /
 * products. The brand voice + selected product feed every AI skill, so this is
 * the foundation page. Includes an AI "Brand Voice" generator.
 */
import { useState } from "react";
import { Boxes, Plus, Trash2, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { AiHelperButton } from "@/components/common/AiHelperButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { Product, ProductStatus } from "@/types";

export default function BrandApps() {
  const { data, setBrand, add, update, remove } = useStore();
  const ctx = useSkillContext();
  const [brand, setLocalBrand] = useState(data.brand);
  const [voice, setVoice] = useState<{ guidelines: string; doList: string[]; dontList: string[] } | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  function saveBrand() {
    setBrand(brand);
    toast.success("Brand saved");
  }

  async function generateVoice() {
    setVoiceLoading(true);
    try {
      setVoice(await skills.brandVoice.run({}, ctx));
    } finally {
      setVoiceLoading(false);
    }
  }

  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Brand & Apps"
        description="Your company brand and every product under it. This drives the tone and targeting of all AI generations."
        icon={<Boxes className="h-6 w-6" />}
        actions={<AddProductDialog onAdd={(p) => add("products", p)} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Brand settings */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base">Company brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name">
              <Input value={brand.name} onChange={(e) => setLocalBrand({ ...brand, name: e.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={brand.tagline} onChange={(e) => setLocalBrand({ ...brand, tagline: e.target.value })} />
            </Field>
            <Field label="Positioning" hint="What you do, for whom, and why it's different.">
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  value={brand.positioning}
                  onChange={(e) => setLocalBrand({ ...brand, positioning: e.target.value })}
                />
                <AiHelperButton
                  text={brand.positioning}
                  instruction="Tighten this positioning statement; lead with the customer outcome."
                  onResult={(t) => setLocalBrand({ ...brand, positioning: t })}
                />
              </div>
            </Field>
            <Field label="Audience">
              <Input value={brand.audience} onChange={(e) => setLocalBrand({ ...brand, audience: e.target.value })} />
            </Field>
            <Field label="Tone words" hint="Comma-separated. These shape every AI generation.">
              <Input
                value={brand.toneWords.join(", ")}
                onChange={(e) => setLocalBrand({ ...brand, toneWords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Website">
                <Input value={brand.website} onChange={(e) => setLocalBrand({ ...brand, website: e.target.value })} />
              </Field>
              <Field label="Primary color">
                <Input type="color" value={brand.primaryColor} onChange={(e) => setLocalBrand({ ...brand, primaryColor: e.target.value })} className="h-9 p-1" />
              </Field>
            </div>
            <Button onClick={saveBrand} className="w-full">Save brand</Button>
          </CardContent>
        </Card>

        {/* Brand voice generator */}
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">AI brand voice</CardTitle>
            <Button size="sm" variant="outline" onClick={generateVoice} disabled={voiceLoading}>
              {voiceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-1.5">Generate guidelines</span>
            </Button>
          </CardHeader>
          <CardContent>
            {!voice ? (
              <p className="text-sm text-muted-foreground">
                Turn your tone words ({brand.toneWords.join(", ") || "none set"}) into concrete do/don't writing rules.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <p>{voice.guidelines}</p>
                <Separator />
                <div>
                  <div className="mb-1 font-medium text-success">Do</div>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {voice.doList.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 font-medium text-destructive">Don't</div>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {voice.dontList.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product catalog */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Apps & products ({data.products.length})
      </h2>
      {data.products.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No products yet" description="Add your first app so AI can tailor campaigns and content to it." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onChangeStatus={(status) => update("products", p.id, { status })}
              onDelete={() => { remove("products", p.id); toast.success("Product removed"); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- pieces -------------------------------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  idea: "bg-muted text-muted-foreground",
  active: "bg-info/15 text-info",
  growth: "bg-success/15 text-success",
  sunset: "bg-warning/15 text-warning",
};

function ProductCard({
  product,
  onChangeStatus,
  onDelete,
}: {
  product: Product;
  onChangeStatus: (s: ProductStatus) => void;
  onDelete: () => void;
}) {
  const order: ProductStatus[] = ["idea", "active", "growth", "sunset"];
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="font-semibold">{product.name}</div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">ICP:</span> {product.audience}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {product.keyBenefits.map((b) => (
            <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS_COLORS[product.status]}`}
            onClick={() => onChangeStatus(order[(order.indexOf(product.status) + 1) % order.length])}
            title="Click to cycle status"
          >
            {product.status}
          </button>
          {product.url && (
            <a href={product.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Visit <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddProductDialog({ onAdd }: { onAdd: (p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", audience: "", keyBenefits: "", url: "" });

  function submit() {
    if (!form.name.trim()) {
      toast.error("Give the product a name");
      return;
    }
    onAdd({
      id: uid("prod"),
      name: form.name.trim(),
      description: form.description.trim(),
      audience: form.audience.trim(),
      keyBenefits: form.keyBenefits.split(",").map((s) => s.trim()).filter(Boolean),
      url: form.url.trim() || undefined,
      status: "idea",
      createdAt: today(),
    });
    toast.success(`Added ${form.name}`);
    setForm({ name: "", description: "", audience: "", keyBenefits: "", url: "" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /><span className="ml-1.5">Add product</span></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a product / app</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. ResumAI" /></Field>
          <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Target audience (ICP)"><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="e.g. Job seekers" /></Field>
          <Field label="Key benefits" hint="Comma-separated"><Input value={form.keyBenefits} onChange={(e) => setForm({ ...form, keyBenefits: e.target.value })} placeholder="saves time, beats the ATS" /></Field>
          <Field label="URL (optional)"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
