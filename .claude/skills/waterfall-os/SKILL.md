---
name: waterfall-os
description: >-
  The Waterfall Claude OS — the shared skill operating system installed in every
  Waterfall Technologies repo. Use to orient in any Waterfall repo: what the
  platform contract is (every AI call routes through the Super Agent), which
  skills are installed here vs. cataloged platform-wide, where the canonical
  skill registry lives, and how to add or unify a skill across repos. Start here
  when you land in a Waterfall repo and need to know what's routable.
---

# Waterfall Claude OS

Waterfall Technologies is one platform made of many apps (cairo-ai-pro,
waterfall-nexus, waterfall-tech-command, verseful, resumai, physiq, shopera,
halo, …). They are unified two ways:

1. **One reasoning engine.** Every AI call flows through the shared **Super
   Agent** — never a raw `fetch` to a model API, never a hardcoded model string,
   never a manual `max_tokens` in app code. Routing, model tier, token caps, and
   budget are enforced centrally.
2. **One skill OS.** Every repo ships the same **OS-core** skills so Claude Code
   behaves consistently wherever you are, and every skill on the platform is
   listed in one **canonical registry**.

This skill is the entry point to #2. Read it first when you land in a Waterfall
repo.

## The canonical skill registry (source of truth)

The platform-wide catalog of every skill — which repo owns it, which repos it
applies to, its dependencies and status — lives in **cairo-ai-pro**:

```
cairo-ai-pro/app-assets/global/registry.json   ← the OS catalog (source of truth)
cairo-ai-pro/app-assets/global/README.md        ← how the catalog works
```

The registry is a **catalog/manifest**, not the runtime location. Claude Code
loads skills that physically live in a repo's `.claude/skills/` (and authoring
skills under `.agents/skills/`). The registry records where each skill lives and
where it applies, so the platform stays unified without duplicating files.

## What's installed where

- **OS-core (every repo):** `waterfall-os` (this), `task-planner`, `repo-hygiene`.
- **Where there's app source:** `security-monitor` (static security sweep),
  and `performance-optimizer` on the React-heavy apps.
- **Supabase apps:** `supabase-feature` (RLS-correct migrations + an auth'd
  server accessor — TanStack server fn or Deno Edge Function).
- **cairo-ai-pro (the OS home):** the full set — also `add-route`,
  `preview-doctor`, plus the `.agents/skills/` authoring set (`tool-authoring`,
  `ci-cd-conventions`, `release-and-deploy`, `github-integration-authoring`,
  `github-webhook-security`, `cairo-global-asset-manager`). These are
  stack-specific (TanStack Start + Cloudflare) and stay cairo-scoped until
  generalized.

List what's actually routable in **this** repo (always do this before planning —
the set grows):

```bash
bash .claude/skills/waterfall-os/os-status.sh
```

## The One Rule (platform contract — never violate)

Every AI call in every Waterfall app must flow through the Super Agent.

```ts
// ✅ route through the Super Agent
import { superAgent } from "../../agent/superAgent";
const result = await superAgent.call({ app: "verseful", prompt });

// ❌ never: raw API fetch, hardcoded model, or manual max_tokens in app code
await fetch("https://api.anthropic.com/v1/messages", { /* ... */ });
const model = "claude-sonnet-4-6";
const maxTokens = 4096;
```

Concrete model strings and token caps live **only** inside `superAgent.ts`; app
code refers to tiers (OPUS / SONNET / HAIKU) and app names. If you find a raw
call, hardcoded model, or manual cap anywhere, treat it as a defect and refactor
it to route through the Super Agent.

## Multi-repo scope (important)

A session can only read/write the repo(s) currently in scope. A change that
touches another Waterfall app must include an explicit "add `<repo>` to session
scope" step — never assume cross-repo access or invent another app's internals.

## Adding or unifying a skill

1. **Author it** in the owning repo under `.claude/skills/<kebab-name>/` with a
   `SKILL.md` (YAML frontmatter: `name`, `description`) and any helper scripts.
   Keep helpers git-root-relative so they run anywhere.
2. **Decide scope.** Universal → install in every repo's `.claude/skills/`
   (OS-core). Stack-specific → keep it in its owning repo only.
3. **Register it** in `cairo-ai-pro/app-assets/global/registry.json`: add an
   entry with `name`, `type`, `path`, `description`, `source` (owning repo),
   `applies_to` (repo list), `dependencies`, `integration_notes`,
   `recommended_usage`, `status`. Keep arrays sorted by `name`; bump
   `updated_at`.
4. **Distribute.** Copy universal skills into each in-scope repo's
   `.claude/skills/`; for out-of-scope repos, note the follow-up.
5. **Verify** with `os-status.sh` in each repo it landed in.

## Quality bar

- Every repo's `.claude/skills/` includes the OS-core, and every skill on the
  platform appears in the registry exactly once.
- No raw AI calls, hardcoded models, or manual token caps in app code.
- Helper scripts are repo-agnostic (resolve the git root; no-op cleanly when a
  directory they scan is absent).
