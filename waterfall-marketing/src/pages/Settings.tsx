/**
 * Settings — model configuration status, the AI skill registry (self-documenting
 * list of capabilities), and data controls. This is where you confirm whether
 * you're running the local engine or a live model, and where you reset demo data.
 */
import { Settings as SettingsIcon, Sparkles, Database, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/store/AppStore";
import { SKILL_LIST, isModelConfigured } from "@/ai";

export default function SettingsPage() {
  const { data, reset } = useStore();
  const live = isModelConfigured();

  return (
    <div className="animate-slide-in">
      <PageHeader title="Settings" description="AI model, skills, and data." icon={<SettingsIcon className="h-6 w-6" />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Model status */}
        <Card className="glass-panel">
          <CardHeader><CardTitle className="text-base">AI model</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {live ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
              <span className="font-medium">{live ? "Live model connected" : "Local engine (offline)"}</span>
            </div>
            <p className="text-muted-foreground">
              The Command Center works fully offline using built-in generators. To use a real model,
              set these environment variables and redeploy:
            </p>
            <pre className="rounded-md bg-secondary/50 p-3 text-xs">{`VITE_AI_API_URL = https://your-endpoint
VITE_AI_API_KEY = optional-bearer-token`}</pre>
            <p className="text-muted-foreground">
              The endpoint should accept <code>POST {`{ system?, prompt }`}</code> and return{" "}
              <code>{`{ text }`}</code>. Keep your provider key server-side (e.g. a Supabase Edge
              Function calling Claude or another LLM). See <code>src/ai/engine.ts</code>.
            </p>
          </CardContent>
        </Card>

        {/* Data controls */}
        <Card className="glass-panel">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Data</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              All data is stored locally in your browser (localStorage). It persists across reloads.
              Swap the loader in <code>src/store/AppStore.tsx</code> for Supabase to sync across devices.
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <Stat label="Products" value={data.products.length} />
              <Stat label="Campaigns" value={data.campaigns.length} />
              <Stat label="Sequences" value={data.emailSequences.length} />
              <Stat label="Assets" value={data.assets.length} />
            </div>
            <Separator />
            <Button variant="outline" className="w-full" onClick={() => { reset(); toast.success("Reset to seed data"); }}>
              <RotateCcw className="h-4 w-4" /><span className="ml-1.5">Reset to demo data</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Skill registry */}
      <Card className="glass-panel mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI skills ({SKILL_LIST.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Skills are modular, swappable units of marketing intelligence. Add new ones in{" "}
            <code>src/ai/skills.ts</code> — the assistant and pages discover them automatically.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SKILL_LIST.map((s) => (
              <div key={s.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                <code className="mt-1 block text-[10px] text-muted-foreground">id: {s.id}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
