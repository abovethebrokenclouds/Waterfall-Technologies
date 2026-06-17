/**
 * ai/skills.ts
 * ----------------------------------------------------------------------------
 * The AI SKILL LAYER. A "skill" is a small, self-describing, swappable unit of
 * marketing intelligence (campaign strategy, SEO outline, email sequence, video
 * script, social posts, brand voice, repurposing, copy improvement).
 *
 * Every skill implements the same `Skill` interface, so it can be invoked from:
 *   • the global AI Assistant panel (natural-language routing), and
 *   • any feature module that wants that capability directly.
 *
 * ──────────────────────────── HOW TO ADD A NEW SKILL ────────────────────────
 * 1. Define a Zod `inputSchema` and `outputSchema`.
 * 2. Write `run(input, ctx)`. Use `callModel({ system, prompt }, () => localFallback)`
 *    for any free-text generation so it works offline AND upgrades to a real LLM.
 * 3. Register it in `SKILLS` at the bottom. That's it — the UI discovers it.
 *
 * The brand + selected product are passed in `ctx` so every result is on-brand.
 * ----------------------------------------------------------------------------
 */

import { z } from "zod";
import type {
  Brand,
  Channel,
  EmailStep,
  Product,
  SocialPlatform,
} from "@/types";
import { callModel, seededPick, titleCase, uid } from "./engine";

/* -------------------------------------------------------------------------- */
/*  Skill contract                                                            */
/* -------------------------------------------------------------------------- */

/** Context every skill receives: the global brand + the product in focus. */
export interface SkillContext {
  brand: Brand;
  product?: Product | null;
}

export interface Skill<Input = unknown, Output = unknown> {
  /** Stable id, e.g. "campaign-strategy". */
  id: string;
  /** Human label shown in the UI. */
  name: string;
  /** One sentence describing what it does. */
  description: string;
  /** Category used to group skills in the assistant. */
  category: "strategy" | "seo" | "email" | "video" | "social" | "brand" | "utility";
  /**
   * Zod schemas describing the I/O. Typed loosely as `ZodTypeAny` on purpose:
   * the project compiles with `strict: false`, where Zod infers object props as
   * optional and would clash with the strict `Input`/`Output` generics. The real
   * type guarantees come from `run()` below, which is fully typed.
   */
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  run(input: Input, ctx: SkillContext): Promise<Output>;
}

/** Short product descriptor used to seed on-brand copy. */
function focus(ctx: SkillContext): string {
  return ctx.product ? `${ctx.product.name} (${ctx.product.audience})` : ctx.brand.name;
}
function voice(ctx: SkillContext): string {
  return ctx.brand.toneWords.join(", ") || "clear, confident, helpful";
}
function benefits(ctx: SkillContext): string[] {
  return ctx.product?.keyBenefits?.length
    ? ctx.product.keyBenefits
    : ["saves time", "looks professional", "easy to start"];
}

/* -------------------------------------------------------------------------- */
/*  1. Brand Voice skill                                                      */
/* -------------------------------------------------------------------------- */

const brandVoiceSkill: Skill<
  { sampleText?: string },
  { guidelines: string; doList: string[]; dontList: string[] }
> = {
  id: "brand-voice",
  name: "Brand Voice & Tone",
  description: "Turns your brand tone words into concrete do/don't writing rules.",
  category: "brand",
  inputSchema: z.object({ sampleText: z.string().optional() }),
  outputSchema: z.object({
    guidelines: z.string(),
    doList: z.array(z.string()),
    dontList: z.array(z.string()),
  }),
  async run(_input, ctx) {
    const tone = voice(ctx);
    const guidelines = await callModel(
      {
        system: `You are a brand voice strategist for ${ctx.brand.name}.`,
        prompt: `Brand tone: ${tone}. Positioning: ${ctx.brand.positioning}. Write a short voice guideline paragraph.`,
      },
      () =>
        `${ctx.brand.name} sounds ${tone}. We lead with the customer outcome, ` +
        `keep sentences short, and prefer plain words over jargon. Every line should ` +
        `feel like it was written by a knowledgeable friend who respects the reader's time.`,
    );
    return {
      guidelines,
      doList: [
        `Lead with the benefit, then the feature.`,
        `Use "you" and active voice.`,
        `Keep sentences under ~20 words.`,
        `Match the tone words: ${tone}.`,
      ],
      dontList: [
        `Don't use hype words ("revolutionary", "world-class").`,
        `Don't bury the call to action.`,
        `Don't write a paragraph where a sentence will do.`,
      ],
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  2. Campaign Strategy skill                                                */
/* -------------------------------------------------------------------------- */

const campaignStrategySkill: Skill<
  { objective: string; channels: Channel[] },
  {
    outline: string;
    contentPlan: { channel: Channel; ideas: string[] }[];
    timeline: { week: string; focus: string }[];
  }
> = {
  id: "campaign-strategy",
  name: "Campaign Strategy Builder",
  description: "Generates a campaign outline, per-channel content plan, and timeline.",
  category: "strategy",
  inputSchema: z.object({
    objective: z.string(),
    channels: z.array(z.string()) as unknown as z.ZodType<Channel[]>,
  }),
  outputSchema: z.object({
    outline: z.string(),
    contentPlan: z.array(z.object({ channel: z.string(), ideas: z.array(z.string()) })) as any,
    timeline: z.array(z.object({ week: z.string(), focus: z.string() })),
  }),
  async run(input, ctx) {
    const subject = focus(ctx);
    const b = benefits(ctx);
    const objective = input.objective || "launch";

    const outline = await callModel(
      {
        system: `You are a senior growth marketer for ${ctx.brand.name}.`,
        prompt: `Write a ${objective} campaign outline for ${subject} across ${input.channels.join(", ")}.`,
      },
      () =>
        [
          `GOAL: ${titleCase(objective)} campaign for ${subject}.`,
          `CORE MESSAGE: ${b[0]} — without the usual hassle.`,
          `OFFER: A clear next step (free trial / demo / waitlist) tied to the goal.`,
          `PROOF: Lead with one concrete outcome and one short testimonial slot.`,
          `CHANNELS: ${input.channels.join(", ") || "email, social"}.`,
        ].join("\n"),
    );

    // Per-channel idea seeds — concrete, not lorem.
    const ideaBank: Record<Channel, string[]> = {
      email: [
        `Welcome email: the #1 outcome ${subject} delivers`,
        `Story email: a before/after using ${b[0]}`,
        `Offer email: time-boxed reason to act now`,
      ],
      social: [
        `Hook post: "Most people get ${objective} wrong because…"`,
        `Carousel: 3 ways ${subject} helps you ${b[1] ?? b[0]}`,
        `Proof post: a screenshot + one-line result`,
      ],
      video: [
        `30s explainer: the problem ${subject} removes`,
        `Demo clip: ${b[0]} in under a minute`,
        `Founder note: why we built ${ctx.product?.name ?? ctx.brand.name}`,
      ],
      seo: [
        `Pillar page: the complete guide to ${objective}`,
        `Comparison post: alternatives vs ${subject}`,
        `FAQ article answering top buyer questions`,
      ],
      landing: [
        `Hero: outcome headline + single CTA`,
        `Section: 3 benefits with proof`,
        `Section: FAQ + risk reversal`,
      ],
    };
    const channels = input.channels.length ? input.channels : (["email", "social"] as Channel[]);
    const contentPlan = channels.map((channel) => ({
      channel,
      ideas: ideaBank[channel] ?? [`Content idea for ${channel}`],
    }));

    const timeline = [
      { week: "Week 1", focus: "Tease + warm the list. Publish pillar content & set tracking." },
      { week: "Week 2", focus: `Open the ${objective}. Push social + first email wave.` },
      { week: "Week 3", focus: "Proof + objections. Send story email, repurpose video." },
      { week: "Week 4", focus: "Final push + urgency. Recap results and plan retention." },
    ];

    return { outline, contentPlan, timeline };
  },
};

/* -------------------------------------------------------------------------- */
/*  3. SEO Outline skill                                                      */
/* -------------------------------------------------------------------------- */

const seoOutlineSkill: Skill<
  { pillar: string },
  {
    keywords: string[];
    blogTitles: string[];
    pageSections: string[];
    faqs: { q: string; a: string }[];
    meta: { title: string; description: string };
  }
> = {
  id: "seo-outline",
  name: "SEO Keywords & Outline",
  description: "From a topic pillar: keywords, blog titles, page sections, FAQs, and metadata.",
  category: "seo",
  inputSchema: z.object({ pillar: z.string().min(2) }),
  outputSchema: z.object({
    keywords: z.array(z.string()),
    blogTitles: z.array(z.string()),
    pageSections: z.array(z.string()),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })),
    meta: z.object({ title: z.string(), description: z.string() }),
  }),
  async run(input, ctx) {
    const p = input.pillar.trim();
    const subject = ctx.product?.name ?? ctx.brand.name;
    const modifiers = ["guide", "best", "how to", "tools", "vs", "examples", "for beginners", "checklist"];
    return {
      keywords: modifiers.map((m) => `${p} ${m}`).concat([`${p} for ${ctx.product?.audience ?? "teams"}`]),
      blogTitles: [
        `The Complete Guide to ${titleCase(p)}`,
        `${titleCase(p)} in 2026: What Actually Works`,
        `7 ${titleCase(p)} Mistakes (and How ${subject} Fixes Them)`,
        `How to Get Started with ${titleCase(p)} Fast`,
      ],
      pageSections: [
        `Hero: outcome-driven headline about ${p}`,
        `What is ${p}? (plain-language definition)`,
        `Why it matters for ${ctx.product?.audience ?? "your audience"}`,
        `Step-by-step approach`,
        `How ${subject} helps`,
        `FAQ`,
        `Call to action`,
      ],
      faqs: [
        { q: `What is ${p}?`, a: `A short, plain-language answer that targets the featured snippet.` },
        { q: `How do I start with ${p}?`, a: `List the first three steps, then point to ${subject}.` },
        { q: `How much does ${p} cost?`, a: `Set expectations and tie back to your offer.` },
      ],
      meta: {
        title: `${titleCase(p)} — A Practical Guide | ${ctx.brand.name}`,
        description: `Everything you need to know about ${p}: clear steps, common mistakes, and how ${subject} makes it easier. ${benefits(ctx)[0]}.`.slice(
          0,
          155,
        ),
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  4. Email Sequence skill                                                   */
/* -------------------------------------------------------------------------- */

const emailSequenceSkill: Skill<
  { goal: string; length?: number },
  { name: string; steps: EmailStep[] }
> = {
  id: "email-sequence",
  name: "Email Sequence Generator",
  description: "Builds a multi-step nurture/launch sequence with subjects, bodies, and delays.",
  category: "email",
  inputSchema: z.object({ goal: z.string().min(2), length: z.number().min(2).max(7).optional() }),
  outputSchema: z.object({
    name: z.string(),
    steps: z.array(
      z.object({ id: z.string(), subject: z.string(), body: z.string(), delayDays: z.number() }),
    ),
  }),
  async run(input, ctx) {
    const subject = ctx.product?.name ?? ctx.brand.name;
    const b = benefits(ctx);
    const count = input.length ?? 4;
    const blueprint = [
      { d: 0, s: `Welcome — here's what to expect`, role: `Set the tone (${voice(ctx)}). Deliver one quick win.` },
      { d: 2, s: `The real reason ${subject} exists`, role: `Tell the origin story and the problem you remove.` },
      { d: 4, s: `How ${subject} helps you ${b[0]}`, role: `Show the core benefit with a concrete example.` },
      { d: 6, s: `A quick win you can try today`, role: `Give a tiny actionable tip to build trust.` },
      { d: 8, s: `Ready when you are`, role: `Make the offer + clear CTA tied to: ${input.goal}.` },
      { d: 11, s: `Did this help?`, role: `Ask a question, invite a reply, segment by interest.` },
      { d: 14, s: `Last call`, role: `Add gentle urgency and restate the outcome.` },
    ].slice(0, count);

    const steps: EmailStep[] = blueprint.map((s) => ({
      id: uid("step"),
      subject: s.s,
      body:
        `Hi {{firstName}},\n\n${s.role}\n\n` +
        `Remember: ${subject} helps you ${seededPick(b, s.s)}.\n\n` +
        `— The ${ctx.brand.name} team`,
      delayDays: s.d,
    }));

    return { name: `${titleCase(input.goal)} Sequence — ${subject}`, steps };
  },
};

/* -------------------------------------------------------------------------- */
/*  5. Video Script skill                                                     */
/* -------------------------------------------------------------------------- */

const videoScriptSkill: Skill<
  { topic: string },
  { hook: string; angle: string; cta: string; longScript: string; shortScript: string }
> = {
  id: "video-script",
  name: "Video Script & Shorts",
  description: "Generates a hook, angle, CTA, a long-form script, and a short-form variation.",
  category: "video",
  inputSchema: z.object({ topic: z.string().min(2) }),
  outputSchema: z.object({
    hook: z.string(),
    angle: z.string(),
    cta: z.string(),
    longScript: z.string(),
    shortScript: z.string(),
  }),
  async run(input, ctx) {
    const subject = ctx.product?.name ?? ctx.brand.name;
    const b = benefits(ctx);
    const hook = `If you're still struggling with ${input.topic}, watch this.`;
    const angle = `Show, don't tell: demonstrate ${subject} solving ${input.topic} in real time.`;
    const cta = `Try ${subject} free — link in the description.`;

    const longScript = await callModel(
      {
        system: `You are a short-form video scriptwriter. Tone: ${voice(ctx)}.`,
        prompt: `Write a 60-second video script for ${subject} about ${input.topic}.`,
      },
      () =>
        [
          `[0:00 HOOK] ${hook}`,
          `[0:05 PROBLEM] Here's what usually goes wrong with ${input.topic}…`,
          `[0:20 SOLUTION] This is where ${subject} comes in — it helps you ${b[0]}.`,
          `[0:35 DEMO] Watch: (show the product doing the thing).`,
          `[0:50 PROOF] That's the result, in under a minute.`,
          `[0:55 CTA] ${cta}`,
        ].join("\n"),
    );

    const shortScript = [
      `HOOK: ${hook}`,
      `BODY: ${subject} = ${b[0]}. No setup headaches.`,
      `CTA: ${cta}`,
    ].join("\n");

    return { hook, angle, cta, longScript, shortScript };
  },
};

/* -------------------------------------------------------------------------- */
/*  6. Social Post skill                                                      */
/* -------------------------------------------------------------------------- */

const PLATFORM_STYLE: Record<SocialPlatform, string> = {
  x: "punchy, 1–2 lines, 1 hashtag max",
  linkedin: "professional, a short story + insight, 3 hashtags",
  instagram: "visual caption + emojis + 5 hashtags",
  tiktok: "casual hook-first caption",
  youtube: "title + 2-line description",
  facebook: "friendly, conversational",
};

const socialPostSkill: Skill<
  { topic: string; platforms: SocialPlatform[] },
  { posts: { platform: SocialPlatform; content: string }[] }
> = {
  id: "social-posts",
  name: "Social Post Generator",
  description: "Writes platform-tailored posts for X, LinkedIn, Instagram, TikTok, and more.",
  category: "social",
  inputSchema: z.object({
    topic: z.string().min(2),
    platforms: z.array(z.string()) as unknown as z.ZodType<SocialPlatform[]>,
  }),
  outputSchema: z.object({
    posts: z.array(z.object({ platform: z.string(), content: z.string() })) as any,
  }),
  async run(input, ctx) {
    const subject = ctx.product?.name ?? ctx.brand.name;
    const b = benefits(ctx);
    const platforms = input.platforms.length ? input.platforms : (["x", "linkedin"] as SocialPlatform[]);
    const posts = await Promise.all(
      platforms.map(async (platform) => {
        const content = await callModel(
          {
            system: `Write a ${platform} post. Style: ${PLATFORM_STYLE[platform]}. Tone: ${voice(ctx)}.`,
            prompt: `Topic: ${input.topic}. Product: ${subject}. Benefit: ${b[0]}.`,
          },
          () => localSocialPost(platform, input.topic, subject, b),
        );
        return { platform, content };
      }),
    );
    return { posts };
  },
};

function localSocialPost(p: SocialPlatform, topic: string, subject: string, b: string[]): string {
  switch (p) {
    case "x":
      return `Most people overthink ${topic}.\n\n${subject} makes it simple — you just ${b[0]}.\n\n#marketing`;
    case "linkedin":
      return `A year ago, ${topic} used to eat our whole week.\n\nThen we changed one thing: we let ${subject} handle the heavy lifting, so the team could ${b[0]}.\n\nThe lesson? Remove the friction before you add more effort.\n\n#growth #marketing #productivity`;
    case "instagram":
      return `${topic}, but make it easy ✨\n\n${subject} helps you ${b[0]} 🚀\nSave this for later 📌\n\n#marketing #startup #buildinpublic #tools #${subject.toLowerCase().replace(/\s/g, "")}`;
    case "tiktok":
      return `POV: you finally fixed ${topic}. ${subject} = ${b[0]}. Watch how 👇`;
    case "youtube":
      return `${subject}: The Fastest Way to Handle ${topic}\n\nIn this video we show how ${subject} helps you ${b[0]} — step by step.`;
    case "facebook":
      return `Quick one for anyone wrestling with ${topic} — ${subject} genuinely helps you ${b[0]}. Happy to answer questions in the comments!`;
  }
}

/* -------------------------------------------------------------------------- */
/*  7. Repurpose skill                                                        */
/* -------------------------------------------------------------------------- */

const repurposeSkill: Skill<
  { sourceText: string; targets: ("email" | "social" | "blog")[] },
  { email?: string; social?: string; blogOutline?: string }
> = {
  id: "repurpose",
  name: "Repurpose Content",
  description: "Turns one long-form asset (script, post, doc) into email, social, and a blog outline.",
  category: "utility",
  inputSchema: z.object({
    sourceText: z.string().min(10),
    targets: z.array(z.enum(["email", "social", "blog"])),
  }),
  outputSchema: z.object({
    email: z.string().optional(),
    social: z.string().optional(),
    blogOutline: z.string().optional(),
  }),
  async run(input, ctx) {
    const first = input.sourceText.split(/[.\n]/).find((s) => s.trim().length > 0)?.trim() ?? input.sourceText.slice(0, 80);
    const out: { email?: string; social?: string; blogOutline?: string } = {};
    if (input.targets.includes("email")) {
      out.email = `Subject: ${titleCase(first).slice(0, 60)}\n\nHi {{firstName}},\n\n${first}.\n\nHere's the short version, and why it matters for you…\n\n— ${ctx.brand.name}`;
    }
    if (input.targets.includes("social")) {
      out.social = `${first}.\n\nThread / carousel idea: break the key points into 3 slides.\n\n#marketing`;
    }
    if (input.targets.includes("blog")) {
      out.blogOutline = [`# ${titleCase(first)}`, `## The problem`, `## The approach`, `## Step-by-step`, `## How ${ctx.brand.name} helps`, `## Takeaways + CTA`].join("\n");
    }
    return out;
  },
};

/* -------------------------------------------------------------------------- */
/*  8. Improve / Fix copy skill — powers the inline "Improve this" buttons     */
/* -------------------------------------------------------------------------- */

const improveTextSkill: Skill<
  { text: string; instruction?: string },
  { improved: string }
> = {
  id: "improve-text",
  name: "Improve / Fix Copy",
  description: "Rewrites any text to be sharper and on-brand. Powers inline 'Improve this' helpers.",
  category: "utility",
  inputSchema: z.object({ text: z.string().min(1), instruction: z.string().optional() }),
  outputSchema: z.object({ improved: z.string() }),
  async run(input, ctx) {
    const instruction = input.instruction || "Make it tighter, clearer, and on-brand.";
    const improved = await callModel(
      {
        system: `You are an editor for ${ctx.brand.name}. Tone: ${voice(ctx)}. ${instruction}`,
        prompt: input.text,
      },
      () => {
        // Local heuristic "edit": trim filler, lead with the point, tighten.
        let t = input.text.trim().replace(/\b(very|really|just|actually|basically)\s/gi, "");
        t = t.replace(/\s+/g, " ");
        const lead = t.split(/[.!?]/)[0]?.trim();
        return `${lead ? lead + "." : t}\n\n(Tightened for ${voice(ctx)} tone — lead with the outcome, cut filler, one idea per sentence.)`;
      },
    );
    return { improved };
  },
};

/* -------------------------------------------------------------------------- */
/*  Registry                                                                  */
/* -------------------------------------------------------------------------- */

/** All skills, keyed by id. The UI discovers capabilities from this map. */
export const SKILLS: Record<string, Skill<any, any>> = {
  [brandVoiceSkill.id]: brandVoiceSkill,
  [campaignStrategySkill.id]: campaignStrategySkill,
  [seoOutlineSkill.id]: seoOutlineSkill,
  [emailSequenceSkill.id]: emailSequenceSkill,
  [videoScriptSkill.id]: videoScriptSkill,
  [socialPostSkill.id]: socialPostSkill,
  [repurposeSkill.id]: repurposeSkill,
  [improveTextSkill.id]: improveTextSkill,
};

export const SKILL_LIST: Skill<any, any>[] = Object.values(SKILLS);

/** Strongly-typed accessors so pages get real types back. */
export const skills = {
  brandVoice: brandVoiceSkill,
  campaignStrategy: campaignStrategySkill,
  seoOutline: seoOutlineSkill,
  emailSequence: emailSequenceSkill,
  videoScript: videoScriptSkill,
  socialPost: socialPostSkill,
  repurpose: repurposeSkill,
  improveText: improveTextSkill,
};
