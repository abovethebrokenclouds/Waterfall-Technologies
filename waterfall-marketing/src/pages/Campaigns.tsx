/**
 * Campaigns — create campaigns (objective + product + channels), let AI build
 * the outline / per-channel content plan / timeline, and review each campaign
 * with mocked performance metrics (swap for real analytics later).
 */
import { useState } from "react";
import { Megaphone, Plus, Sparkles, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { Campaign, CampaignObjective, Channel } from "@/types";

const OBJECTIVES: CampaignObjective[] = ["launch", "nurture", "retention", "upsell", "awareness"];
const CHANNELS: Channel[] = ["email", "social", "video", "seo", "landing"];
const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  complete: "bg-info/15 text-info",
};

export default function Campaigns() {
  const { data, add, update, remove } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(data.campaigns[0]?.id ?? null);
  const selected = data.campaigns.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Campaigns"
        description="Plan multi-channel campaigns per product. AI drafts the outline, content plan, and timeline."
        icon={<Megaphone className="h-6 w-6" />}
        actions={<NewCampaignDialog onCreate={(c) => { add("campaigns", c); setSelectedId(c.id); }} />}
      />

      {data.campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" />}
          title="No campaigns yet"
          description="Create your first campaign and let AI build the plan."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          {/* List */}
          <div className="space-y-2">
            {data.campaigns.map((c) => {
              const product = data.products.find((p) => p.id === c.productId);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedId === c.id ? "border-primary bg-card" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${STATUS_VARIANT[c.status]}`}>{c.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{product?.name ?? "Brand"} · {c.objective}</div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected && <CampaignDetail key={selected.id} campaign={selected} onUpdate={(patch) => update("campaigns", selected.id, patch)} onDelete={() => { remove("campaigns", selected.id); setSelectedId(null); }} />}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ detail panel ----------------------------- */

function CampaignDetail({
  campaign,
  onUpdate,
  onDelete,
}: {
  campaign: Campaign;
  onUpdate: (patch: Partial<Campaign>) => void;
  onDelete: () => void;
}) {
  const { data } = useStore();
  const ctx = useSkillContext();
  const product = data.products.find((p) => p.id === campaign.productId);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{ channel: Channel; ideas: string[] }[] | null>(null);
  const [timeline, setTimeline] = useState<{ week: string; focus: string }[] | null>(null);

  async function build() {
    setLoading(true);
    try {
      // Run the campaign-strategy skill with this campaign's product in focus.
      const skillCtx = { brand: ctx.brand, product: product ?? null };
      const out = await skills.campaignStrategy.run({ objective: campaign.objective, channels: campaign.channels }, skillCtx);
      onUpdate({ outline: out.outline });
      setPlan(out.contentPlan);
      setTimeline(out.timeline);
      toast.success("AI campaign plan ready");
    } finally {
      setLoading(false);
    }
  }

  const m = campaign.metrics;
  const ctr = m.impressions ? ((m.clicks / m.impressions) * 100).toFixed(1) : "0.0";
  const cvr = m.clicks ? ((m.conversions / m.clicks) * 100).toFixed(1) : "0.0";

  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{campaign.name}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{product?.name ?? "Brand-level"}</span>·<span className="capitalize">{campaign.objective}</span>
            {campaign.startDate && <><span>·</span><span>starts {campaign.startDate}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={campaign.status} onValueChange={(v) => onUpdate({ status: v as Campaign["status"] })}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["draft", "active", "paused", "complete"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {campaign.channels.map((ch) => <Badge key={ch} variant="outline" className="capitalize">{ch}</Badge>)}
        </div>

        {/* Mocked performance */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["Impressions", m.impressions.toLocaleString()],
            ["CTR", `${ctr}%`],
            ["Conv. rate", `${cvr}%`],
            ["Spend", `$${m.spend.toLocaleString()}`],
          ].map(([label, val]) => (
            <div key={label} className="rounded-md border border-border/60 p-2">
              <div className="text-sm font-semibold">{val}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI campaign plan</span>
          <Button size="sm" onClick={build} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-1.5">{campaign.outline ? "Regenerate" : "Generate plan"}</span>
          </Button>
        </div>

        {campaign.outline && (
          <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-secondary-foreground">{campaign.outline}</pre>
        )}

        {plan && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plan.map((p) => (
              <div key={p.channel} className="rounded-md border border-border/60 p-3">
                <div className="mb-1 text-xs font-semibold capitalize">{p.channel}</div>
                <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {p.ideas.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {timeline && (
          <div className="space-y-1.5">
            {timeline.map((t) => (
              <div key={t.week} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 font-medium">{t.week}</span>
                <span className="text-muted-foreground">{t.focus}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={campaign.notes} onChange={(e) => onUpdate({ notes: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ create dialog ---------------------------- */

function NewCampaignDialog({ onCreate }: { onCreate: (c: Campaign) => void }) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState<string>("none");
  const [objective, setObjective] = useState<CampaignObjective>("launch");
  const [channels, setChannels] = useState<Channel[]>(["email", "social"]);

  function toggle(ch: Channel) {
    setChannels((c) => (c.includes(ch) ? c.filter((x) => x !== ch) : [...c, ch]));
  }

  function submit() {
    if (!name.trim()) { toast.error("Name your campaign"); return; }
    onCreate({
      id: uid("camp"),
      name: name.trim(),
      productId: productId === "none" ? null : productId,
      objective,
      channels,
      status: "draft",
      startDate: today(),
      notes: "",
      metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
      createdAt: today(),
    });
    toast.success("Campaign created");
    setName(""); setChannels(["email", "social"]); setObjective("launch"); setProductId("none");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /><span className="ml-1.5">New campaign</span></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Launch" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brand-level</SelectItem>
                  {data.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Objective</Label>
              <Select value={objective} onValueChange={(v) => setObjective(v as CampaignObjective)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channels</Label>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex cursor-pointer items-center gap-1.5 text-sm capitalize">
                  <Checkbox checked={channels.includes(ch)} onCheckedChange={() => toggle(ch)} />
                  {ch}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
