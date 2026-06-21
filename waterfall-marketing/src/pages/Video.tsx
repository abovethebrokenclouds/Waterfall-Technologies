/**
 * Video — generate a hook/angle/CTA + long-form script + short-form variation
 * (video-script skill), save to a project library, and repurpose any script
 * into an email, social posts, and a blog outline (repurpose skill).
 */
import { useState } from "react";
import { Clapperboard, Sparkles, Loader2, Plus, Trash2, Recycle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { VideoProject } from "@/types";

type Script = Awaited<ReturnType<typeof skills.videoScript.run>>;

export default function Video() {
  const { data, add, remove } = useStore();
  const ctx = useSkillContext();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Script | null>(null);

  async function generate() {
    if (topic.trim().length < 2) { toast.error("What's the video about?"); return; }
    setLoading(true);
    try {
      setDraft(await skills.videoScript.run({ topic }, ctx));
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!draft) return;
    const project: VideoProject = {
      id: uid("vid"),
      title: topic,
      productId: ctx.product?.id ?? null,
      ...draft,
      createdAt: today(),
    };
    add("videos", project);
    setDraft(null);
    setTopic("");
    toast.success("Saved to video library");
  }

  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Video"
        description="Ideate hooks and angles, generate long- and short-form scripts, then repurpose them everywhere."
        icon={<Clapperboard className="h-6 w-6" />}
      />

      <Card className="glass-panel mb-4">
        <CardHeader><CardTitle className="text-base">Script generator</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Video topic — e.g. how to tailor a resume in 30s" onKeyDown={(e) => e.key === "Enter" && generate()} />
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-1.5">Generate</span>
            </Button>
          </div>

          {draft && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Mini label="Hook" value={draft.hook} />
                <Mini label="Angle" value={draft.angle} />
                <Mini label="CTA" value={draft.cta} />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Long-form script</div>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs">{draft.longScript}</pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Short-form (Reels / TikTok / Shorts)</div>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs">{draft.shortScript}</pre>
              </div>
              <Button onClick={save}><Plus className="h-4 w-4" /><span className="ml-1.5">Save to library</span></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Video library ({data.videos.length})</h2>
      {data.videos.length === 0 ? (
        <EmptyState icon={<Clapperboard className="h-8 w-8" />} title="No videos yet" description="Generate a script above and save it here." />
      ) : (
        <div className="space-y-3">
          {data.videos.map((v) => <VideoCard key={v.id} project={v} onDelete={() => remove("videos", v.id)} />)}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs">{value}</div>
    </div>
  );
}

function VideoCard({ project, onDelete }: { project: VideoProject; onDelete: () => void }) {
  const { data } = useStore();
  const ctx = useSkillContext();
  const product = data.products.find((p) => p.id === project.productId);
  const [repurposed, setRepurposed] = useState<{ email?: string; social?: string; blogOutline?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function repurpose() {
    setLoading(true);
    try {
      const skillCtx = { brand: ctx.brand, product: product ?? null };
      setRepurposed(await skills.repurpose.run({ sourceText: project.longScript, targets: ["email", "social", "blog"] }, skillCtx));
      toast.success("Repurposed into email, social & blog");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{project.title}</CardTitle>
          <div className="mt-1 text-xs text-muted-foreground">{product?.name ?? "Brand"}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={repurpose} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Recycle className="h-4 w-4" />}
            <span className="ml-1.5">Repurpose</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Badge variant="outline" className="text-[10px]">Hook</Badge> <span className="text-muted-foreground">{project.hook}</span>
        {repurposed && (
          <>
            <Separator className="my-2" />
            {repurposed.email && <Repurp label="Email" text={repurposed.email} />}
            {repurposed.social && <Repurp label="Social" text={repurposed.social} />}
            {repurposed.blogOutline && <Repurp label="Blog outline" text={repurposed.blogOutline} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Repurp({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs">{text}</pre>
    </div>
  );
}
