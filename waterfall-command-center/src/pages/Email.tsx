/**
 * Email — the email marketing hub: Contacts (segments/tags), Sequences (AI
 * multi-step nurture/launch flows), Templates (reusable library), and a
 * Broadcast composer with AI copy help.
 */
import { useState } from "react";
import { Mail, Plus, Sparkles, Loader2, Trash2, Send, Users, Layers, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AiHelperButton } from "@/components/common/AiHelperButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore, useSkillContext } from "@/store/AppStore";
import { skills, today, uid } from "@/ai";
import type { Contact, EmailSequence } from "@/types";

export default function Email() {
  return (
    <div className="animate-slide-in">
      <PageHeader
        title="Email"
        description="Contacts, AI-built nurture sequences, a template library, and a broadcast composer — all on-brand."
        icon={<Mail className="h-6 w-6" />}
      />
      <Tabs defaultValue="sequences">
        <TabsList>
          <TabsTrigger value="sequences"><Layers className="mr-1.5 h-4 w-4" />Sequences</TabsTrigger>
          <TabsTrigger value="contacts"><Users className="mr-1.5 h-4 w-4" />Contacts</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="mr-1.5 h-4 w-4" />Templates</TabsTrigger>
          <TabsTrigger value="broadcast"><Send className="mr-1.5 h-4 w-4" />Broadcast</TabsTrigger>
        </TabsList>
        <TabsContent value="sequences" className="mt-4"><Sequences /></TabsContent>
        <TabsContent value="contacts" className="mt-4"><Contacts /></TabsContent>
        <TabsContent value="templates" className="mt-4"><Templates /></TabsContent>
        <TabsContent value="broadcast" className="mt-4"><Broadcast /></TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------- sequences ------------------------------ */

function Sequences() {
  const { data, add, remove } = useStore();
  const ctx = useSkillContext();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (goal.trim().length < 2) { toast.error("What's the goal? e.g. 'activate trial users'"); return; }
    setLoading(true);
    try {
      const out = await skills.emailSequence.run({ goal }, ctx);
      const seq: EmailSequence = {
        id: uid("seq"),
        name: out.name,
        productId: ctx.product?.id ?? null,
        goal,
        steps: out.steps,
        status: "draft",
        createdAt: today(),
      };
      add("emailSequences", seq);
      setGoal("");
      toast.success("Sequence generated");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader><CardTitle className="text-base">Generate a sequence</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal — e.g. welcome & activate new signups" onKeyDown={(e) => e.key === "Enter" && generate()} />
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-1.5">Generate</span>
          </Button>
        </CardContent>
      </Card>

      {data.emailSequences.length === 0 ? (
        <EmptyState icon={<Layers className="h-8 w-8" />} title="No sequences yet" description="Describe a goal above and AI drafts the full flow." />
      ) : (
        data.emailSequences.map((seq) => {
          const product = data.products.find((p) => p.id === seq.productId);
          return (
            <Card key={seq.id} className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{seq.name}</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">{product?.name ?? "Brand"} · {seq.steps.length} emails · {seq.status}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => remove("emailSequences", seq.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {seq.steps.map((step, i) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">Day {step.delayDays}</Badge>
                          {step.subject}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-secondary-foreground">{step.body}</pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

/* --------------------------------- contacts ------------------------------ */

function Contacts() {
  const { data, add, remove } = useStore();
  const [form, setForm] = useState({ name: "", email: "", tags: "", segment: "" });

  function addContact() {
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    const contact: Contact = {
      id: uid("c"),
      name: form.name.trim() || form.email.split("@")[0],
      email: form.email.trim(),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      segment: form.segment.trim() || "General",
      createdAt: today(),
    };
    add("contacts", contact);
    setForm({ name: "", email: "", tags: "", segment: "" });
    toast.success("Contact added");
  }

  const segments = Array.from(new Set(data.contacts.map((c) => c.segment)));

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-5">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Segment" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
          <Input placeholder="Tags (comma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <Button onClick={addContact}><Plus className="h-4 w-4" /><span className="ml-1.5">Add</span></Button>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">{data.contacts.length} contacts · {segments.length} segments: {segments.join(", ")}</div>

      {data.contacts.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No contacts yet" description="Add contacts to build segments and sequences." />
      ) : (
        <div className="space-y-2">
          {data.contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card p-3">
              <div>
                <div className="text-sm font-medium">{c.name} <span className="text-muted-foreground">· {c.email}</span></div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                  <Badge variant="outline">{c.segment}</Badge>
                  {c.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => remove("contacts", c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- templates ------------------------------ */

function Templates() {
  const { data } = useStore();
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {data.emailTemplates.map((t) => (
        <Card key={t.id} className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t.name}</CardTitle>
            <Badge variant="outline" className="capitalize">{t.category}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium">{t.subject}</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-secondary-foreground">{t.body}</pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------- broadcast ------------------------------ */

function Broadcast() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <Card className="glass-panel">
      <CardHeader><CardTitle className="text-base">Compose a broadcast</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <div className="flex gap-2">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
            <AiHelperButton text={subject} instruction="Rewrite as a high-open-rate subject line, under 50 chars." label="Improve" onResult={setSubject} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body</Label>
          <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email, or draft a rough version and let AI tighten it." />
          <AiHelperButton text={body} instruction="Tighten this email, keep it on-brand, end with a single clear CTA." label="Improve copy" onResult={setBody} />
        </div>
        <Button className="w-full" onClick={() => toast.success("Broadcast saved as draft (sending is mocked)")}>
          <Send className="h-4 w-4" /><span className="ml-1.5">Save broadcast</span>
        </Button>
        <p className="text-[11px] text-muted-foreground">Sending is mocked. Wire this button to your ESP (e.g. Resend, Postmark) or a Supabase function to go live.</p>
      </CardContent>
    </Card>
  );
}
