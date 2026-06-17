# Waterfall Marketing

**An AI-assisted marketing OS for Waterfall Technologies and all its apps.**
Plan campaigns, SEO, email, video, and social — one hub, AI assistance on every screen.

Built with **Vite + React + TypeScript + Tailwind + shadcn/ui**. Runs **fully offline**
(no API keys) using built-in generators, and upgrades to a real LLM by setting one env var.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build → dist/
```

> Works in the Lovable environment as-is. No backend required to demo.

---

## Modules (one route each — flat, no nested menus)

| Route | Module | What it does |
|-------|--------|--------------|
| `/` | **Dashboard** | Overview of campaigns, content, sequences, scheduled posts + quick actions |
| `/brand` | **Brand & Apps** | Company brand + product catalog (ICP, benefits). AI brand-voice generator |
| `/campaigns` | **Campaigns** | Create campaigns; AI builds outline, per-channel plan, timeline; mocked metrics |
| `/seo` | **SEO & Content** | Topic clusters (keywords/titles/sections/FAQs/meta) + AI-fillable content calendar |
| `/email` | **Email** | Contacts/segments, AI sequence builder, template library, broadcast composer |
| `/video` | **Video** | Hook/angle/CTA + long & short scripts; repurpose into email/social/blog |
| `/social` | **Social** | Per-platform AI post composer + scheduling queue |
| `/assets` | **Assets** | Reusable headlines, CTAs, brand statements, value props, visual ideas (AI suggestions) |
| `/settings` | **Settings** | Model status, the AI skill registry, and data controls |

A **global AI Copilot** (bottom-right) is available on every screen. It routes natural-
language requests to the right skill using your selected product as context.

---

## Architecture

```
src/
  types/              # All data shapes (Brand, Product, Campaign, Contact, …) — start here
  data/seed.ts        # Realistic default dataset (also the shape your API should return)
  store/AppStore.tsx  # One React Context + localStorage. Uniform CRUD: add/update/remove
  ai/
    engine.ts         # callModel() — the single bridge to a real LLM (+ offline fallback)
    skills.ts         # The SKILL registry: strategy, SEO, email, video, social, brand, …
    assistant.ts      # Natural-language → skill routing for the global Copilot
  components/
    layout/           # AppLayout, Sidebar, AiAssistantPanel, top bar
    common/           # PageHeader, StatCard, EmptyState, AiHelperButton, ProductPicker
    ui/               # shadcn/ui primitives
  pages/              # One file per module
```

**State**: a single `useStore()` hook backed by `localStorage`. Predictable, debuggable,
easy for an AI agent to read and modify. No Redux.

---

## AI skills

Every AI capability is a **Skill** — a small, self-describing, swappable unit:

```ts
interface Skill<Input, Output> {
  id: string;
  name: string;
  description: string;
  category: "strategy" | "seo" | "email" | "video" | "social" | "brand" | "utility";
  inputSchema: ZodType<Input>;
  outputSchema: ZodType<Output>;
  run(input: Input, ctx: { brand; product }): Promise<Output>;
}
```

Built-in skills: **Brand Voice, Campaign Strategy, SEO Outline, Email Sequence,
Video Script, Social Posts, Repurpose, Improve/Fix Copy.**

### Add a new skill
1. Define `inputSchema` / `outputSchema` (Zod) and `run()` in `src/ai/skills.ts`.
2. Use `callModel({ system, prompt }, () => localFallback)` for free-text so it works
   offline *and* upgrades to a live model.
3. Register it in the `SKILLS` map. The Settings page and Copilot discover it automatically.

---

## Going live (extension points)

| Want to… | Do this |
|----------|---------|
| **Use a real LLM** | Set `VITE_AI_API_URL` (+ optional `VITE_AI_API_KEY`). Endpoint takes `POST { system?, prompt }` → `{ text }`. See `src/ai/engine.ts` and `.env.example` |
| **Persist to a backend / sync devices** | Replace `loadInitial()` + the save effect in `src/store/AppStore.tsx` with Supabase (or any API). Keep the `AppData` shape |
| **Actually send email** | Wire the Broadcast button in `src/pages/Email.tsx` to your ESP (Resend, Postmark) or a Supabase function |
| **Actually schedule posts** | Connect the Social queue to Buffer/Ayrshare or your own cron |
| **Connect external data / GitHub** | Skills are plain async functions — fetch from any API inside `run()`; the UI won't change |

---

## "Self-repairable by AI" by design

- Every file starts with a comment describing its purpose and how it fits the hub.
- Inline `AiHelperButton` ("Improve this") appears next to key text fields and runs the
  `improve-text` skill on demand.
- Components are small, explicitly named, and avoid clever abstractions, so an AI agent
  (or a human) can read and modify them safely.

---

_Waterfall Technologies — software that compounds._
