/**
 * Social — AI post composer (per-platform copy via social-posts skill) and a
 * simple scheduling queue (date + status). Generate posts for several platforms
 * at once, tweak, then drop them into the queue.
 */
import { useState } from "react";
import { Share2, Sparkles, Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AiHelperButton } from "@/components/common/AiHelperButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { SocialPlatform, SocialPost } from "@/types";

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "x", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
];
const PLATFORM_LABEL: Record<SocialPlatform, string> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label])) as Record<SocialPlatform, string>;

export default function Social() {
  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Social"
        description="Generate platform-tailored posts, repurpose long-form content, and manage a scheduling queue."
        icon={<Share2 className="h-6 w-6" />}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Composer />
        <Queue />
      </div>
    </div>
  );
}

/* -------------------------------- composer ------------------------------- */

function Composer() {
  const { add } = useStore();
  const ctx = useSkillContext();
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState<SocialPlatform[]>(["x", "linkedin"]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<{ platform: SocialPlatform; content: string }[]>([]);

  function toggle(p: SocialPlatform) {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  async function generate() {
    if (topic.trim().length < 2) { toast.error("What's the post about?"); return; }
    if (selected.length === 0) { toast.error("Pick at least one platform"); return; }
    setLoading(true);
    try {
      const out = await skills.socialPost.run({ topic, platforms: selected }, ctx);
      setDrafts(out.posts);
    } finally {
      setLoading(false);
    }
  }

  function queue(platform: SocialPlatform, content: string) {
    const post: SocialPost = {
      id: uid("sp"),
      platform,
      content,
      productId: ctx.product?.id ?? null,
      status: "draft",
      createdAt: today(),
    };
    add("socialPosts", post);
    toast.success(`Added ${PLATFORM_LABEL[platform]} post to queue`);
  }

  return (
    <Card className="glass-panel">
      <CardHeader><CardTitle className="text-base">AI post composer</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic or long-form source to repurpose…" />
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <Badge
              key={p.id}
              variant={selected.includes(p.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggle(p.id)}
            >
              {p.label}
            </Badge>
          ))}
        </div>
        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span className="ml-1.5">Generate {selected.length} post{selected.length === 1 ? "" : "s"}</span>
        </Button>

        {drafts.map((d) => (
          <DraftEditor key={d.platform} platform={d.platform} initial={d.content} onQueue={(content) => queue(d.platform, content)} />
        ))}
      </CardContent>
    </Card>
  );
}

function DraftEditor({ platform, initial, onQueue }: { platform: SocialPlatform; initial: string; onQueue: (content: string) => void }) {
  const [content, setContent] = useState(initial);
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <Badge variant="outline">{PLATFORM_LABEL[platform]}</Badge>
        <div className="flex gap-1.5">
          <AiHelperButton text={content} instruction={`Rewrite for ${PLATFORM_LABEL[platform]}, on-brand.`} size="icon" onResult={setContent} />
          <Button size="sm" onClick={() => onQueue(content)}><Plus className="h-3.5 w-3.5" /><span className="ml-1">Queue</span></Button>
        </div>
      </div>
      <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="text-xs" />
    </div>
  );
}

/* --------------------------------- queue --------------------------------- */

function Queue() {
  const { data, update, remove } = useStore();
  const posts = [...data.socialPosts].sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""));

  return (
    <Card className="glass-panel">
      <CardHeader><CardTitle className="text-base">Content queue ({posts.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {posts.length === 0 ? (
          <EmptyState icon={<Share2 className="h-8 w-8" />} title="Queue is empty" description="Generate posts and queue them here." />
        ) : (
          posts.map((p) => (
            <div key={p.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{PLATFORM_LABEL[p.platform]}</Badge>
                <div className="flex items-center gap-1.5">
                  <Select value={p.status} onValueChange={(v) => update("socialPosts", p.id, { status: v as SocialPost["status"] })}>
                    <SelectTrigger className="h-7 w-28 text-xs capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>{["draft", "scheduled", "posted"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove("socialPosts", p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{p.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  value={p.scheduledAt ?? ""}
                  onChange={(e) => update("socialPosts", p.id, { scheduledAt: e.target.value, status: e.target.value ? "scheduled" : p.status })}
                  className="h-7 w-40 text-xs"
                />
              </div>
            </div>
          ))
        )}
        <p className="pt-1 text-[11px] text-muted-foreground">Scheduling is mocked. Connect a scheduler (Buffer, Ayrshare, or your own cron) to publish for real.</p>
      </CardContent>
    </Card>
  );
}
