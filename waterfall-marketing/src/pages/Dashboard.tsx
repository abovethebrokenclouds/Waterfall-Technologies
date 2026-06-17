/**
 * Dashboard — the Waterfall Marketing home. A high-level overview of everything in
 * flight (campaigns, content, sequences, scheduled posts) plus quick-action
 * tiles that jump straight into the AI-assisted flows.
 */
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  CalendarClock,
  Mail,
  Share2,
  Search,
  Clapperboard,
  Boxes,
  Plus,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/AppStore";

const QUICK_ACTIONS = [
  { label: "Create new campaign", to: "/campaigns", icon: Megaphone, hint: "AI builds the outline & plan" },
  { label: "Generate weekly content plan", to: "/seo", icon: CalendarClock, hint: "Fill the content calendar" },
  { label: "Review SEO opportunities", to: "/seo", icon: Search, hint: "Keywords, titles & metadata" },
  { label: "Draft an email sequence", to: "/email", icon: Mail, hint: "Multi-step nurture in seconds" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data } = useStore();

  const activeCampaigns = data.campaigns.filter((c) => c.status === "active");
  const scheduledPosts = data.socialPosts.filter((p) => p.status === "scheduled");
  const activeSequences = data.emailSequences.filter((s) => s.status === "active");
  const upcomingContent = [...data.content]
    .filter((c) => c.status !== "published")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Waterfall Marketing"
        description={`${data.brand.name} — ${data.brand.tagline} Here's everything in motion across your apps.`}
        actions={
          <Button onClick={() => navigate("/campaigns")}>
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">New campaign</span>
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Products / Apps" value={data.products.length} icon={<Boxes className="h-4 w-4" />} hint="under management" />
        <StatCard label="Active campaigns" value={activeCampaigns.length} icon={<Megaphone className="h-4 w-4" />} hint={`${data.campaigns.length} total`} />
        <StatCard label="Scheduled posts" value={scheduledPosts.length} icon={<Share2 className="h-4 w-4" />} hint="across platforms" />
        <StatCard label="Active sequences" value={activeSequences.length} icon={<Mail className="h-4 w-4" />} hint="email automations" />
      </div>

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quick actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.to)}
            className="group rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-glow"
          >
            <a.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-medium leading-tight">{a.label}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{a.hint}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </button>
        ))}
      </div>

      {/* In-flight grids */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Active campaigns</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">No active campaigns yet.</p>
            )}
            {activeCampaigns.map((c) => {
              const product = data.products.find((p) => p.id === c.productId);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product?.name ?? "Brand"} · {c.objective}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming content</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/seo")}>
              Calendar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingContent.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled. Ask the copilot to fill your calendar.</p>
            )}
            {upcomingContent.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <ContentIcon type={c.type} />
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{c.type} · {c.status}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{c.date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* small inline helpers */
function ContentIcon({ type }: { type: string }) {
  const map: Record<string, JSX.Element> = {
    blog: <Search className="h-4 w-4 text-muted-foreground" />,
    video: <Clapperboard className="h-4 w-4 text-muted-foreground" />,
    social: <Share2 className="h-4 w-4 text-muted-foreground" />,
    email: <Mail className="h-4 w-4 text-muted-foreground" />,
    landing: <Megaphone className="h-4 w-4 text-muted-foreground" />,
  };
  return map[type] ?? <CalendarClock className="h-4 w-4 text-muted-foreground" />;
}
