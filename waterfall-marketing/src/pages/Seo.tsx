/**
 * Seo — two jobs in one place:
 *  1) SEO Workspace: turn a topic "pillar" into keywords, blog titles, page
 *     sections, FAQs, and metadata (seo-outline skill). Save as a topic.
 *  2) Content Calendar: a simple dated list of upcoming content, with an AI
 *     "Fill the calendar" action that drafts a week of ideas for the product.
 */
import { useState } from "react";
import { Search, Sparkles, Loader2, Plus, Trash2, CalendarDays, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, addDays, today, uid } from "@/ai";
import type { ContentItem, ContentType, SeoTopic } from "@/types";

type Outline = Awaited<ReturnType<typeof skills.seoOutline.run>>;

export default function Seo() {
  return (
    <div className="animate-slide-in">
      <PageHeader
        title="SEO & Content"
        description="Plan topic clusters and metadata, then keep a content calendar full — with AI doing the heavy lifting."
        icon={<Search className="h-6 w-6" />}
      />
      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">SEO Workspace</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="workspace" className="mt-4"><SeoWorkspace /></TabsContent>
        <TabsContent value="calendar" className="mt-4"><ContentCalendar /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------ SEO workspace ---------------------------- */

function SeoWorkspace() {
  const { data, add, remove } = useStore();
  const ctx = useSkillContext();
  const [pillar, setPillar] = useState("");
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);

  async function generate() {
    if (pillar.trim().length < 2) { toast.error("Enter a topic pillar"); return; }
    setLoading(true);
    try {
      setOutline(await skills.seoOutline.run({ pillar }, ctx));
    } finally {
      setLoading(false);
    }
  }

  function saveTopic() {
    if (!outline) return;
    const topic: SeoTopic = {
      id: uid("seo"),
      productId: ctx.product?.id ?? null,
      pillar,
      keywords: outline.keywords,
      blogTitles: outline.blogTitles,
      notes: `Meta: ${outline.meta.title}`,
      createdAt: today(),
    };
    add("seoTopics", topic);
    toast.success("Saved topic cluster");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="glass-panel">
        <CardHeader><CardTitle className="text-base">Generate a topic cluster</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={pillar} onChange={(e) => setPillar(e.target.value)} placeholder="e.g. resume writing, email marketing…" onKeyDown={(e) => e.key === "Enter" && generate()} />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {ctx.product ? `Tailored to ${ctx.product.name}.` : "Tip: pick a product up top to tailor results."}
          </p>

          {outline && (
            <div className="space-y-3 text-sm">
              <Section title="Keywords">
                <div className="flex flex-wrap gap-1">{outline.keywords.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}</div>
              </Section>
              <Section title="Blog titles">
                <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">{outline.blogTitles.map((t) => <li key={t}>{t}</li>)}</ul>
              </Section>
              <Section title="Page sections">
                <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">{outline.pageSections.map((s) => <li key={s}>{s}</li>)}</ul>
              </Section>
              <Section title="Metadata">
                <div className="rounded-md bg-secondary/50 p-2 text-xs">
                  <div><span className="text-muted-foreground">Title:</span> {outline.meta.title}</div>
                  <div className="mt-1"><span className="text-muted-foreground">Description:</span> {outline.meta.description}</div>
                </div>
              </Section>
              <Button onClick={saveTopic} className="w-full"><Plus className="h-4 w-4" /><span className="ml-1.5">Save topic cluster</span></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader><CardTitle className="text-base">Saved topic clusters ({data.seoTopics.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.seoTopics.length === 0 && <p className="text-sm text-muted-foreground">No clusters saved yet.</p>}
          {data.seoTopics.map((t) => {
            const product = data.products.find((p) => p.id === t.productId);
            return (
              <div key={t.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{t.pillar}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove("seoTopics", t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="text-xs text-muted-foreground">{product?.name ?? "Brand"} · {t.keywords.length} keywords · {t.blogTitles.length} titles</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
      <Separator className="mt-3" />
    </div>
  );
}

/* ----------------------------- content calendar -------------------------- */

const CONTENT_TYPES: ContentType[] = ["blog", "video", "social", "email", "landing"];

function ContentCalendar() {
  const { data, add, remove, update } = useStore();
  const ctx = useSkillContext();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("blog");
  const [date, setDate] = useState(today());
  const [filling, setFilling] = useState(false);

  const items = [...data.content].sort((a, b) => a.date.localeCompare(b.date));

  function addItem() {
    if (!title.trim()) { toast.error("Add a title"); return; }
    add("content", { id: uid("ct"), title: title.trim(), type, productId: ctx.product?.id ?? null, date, status: "idea" });
    setTitle("");
    toast.success("Added to calendar");
  }

  // AI "Fill the calendar" — drafts a week of varied content for the focused product.
  async function fillWeek() {
    setFilling(true);
    try {
      const pillar = ctx.product?.name ?? ctx.brand.name;
      const out = await skills.seoOutline.run({ pillar: ctx.product ? ctx.product.keyBenefits[0] ?? pillar : pillar }, ctx);
      const drafts: ContentItem[] = [
        { type: "blog", title: out.blogTitles[0] },
        { type: "social", title: `Social: ${out.blogTitles[1] ?? pillar}` },
        { type: "video", title: `Video: ${out.keywords[2] ?? pillar} explained` },
        { type: "email", title: `Email: ${out.blogTitles[2] ?? pillar}` },
        { type: "landing", title: `Landing section: ${out.pageSections[0] ?? pillar}` },
      ].map((d, i) => ({
        id: uid("ct"),
        title: d.title,
        type: d.type as ContentType,
        productId: ctx.product?.id ?? null,
        date: addDays(today(), i + 1),
        status: "idea" as const,
      }));
      drafts.forEach((d) => add("content", d));
      toast.success(`Added ${drafts.length} ideas to the calendar`);
    } finally {
      setFilling(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you publishing?" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
              <SelectTrigger className="w-32 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>{CONTENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={addItem}><Plus className="h-4 w-4" /><span className="ml-1.5">Add</span></Button>
          <Button variant="outline" onClick={fillWeek} disabled={filling}>
            {filling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            <span className="ml-1.5">AI fill week</span>
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="Calendar is empty" description="Add content or let AI fill your week." actionLabel="AI fill week" onAction={fillWeek} />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const product = data.products.find((p) => p.id === c.productId);
            return (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">{c.type}</Badge>
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{product?.name ?? "Brand"} · {c.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={c.status} onValueChange={(v) => update("content", c.id, { status: v as ContentItem["status"] })}>
                    <SelectTrigger className="h-8 w-32 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>{["idea", "draft", "scheduled", "published"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove("content", c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
