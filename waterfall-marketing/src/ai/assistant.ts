/**
 * ai/assistant.ts
 * ----------------------------------------------------------------------------
 * The brain behind the global AI Assistant panel. It takes a natural-language
 * message, routes it to the most relevant skill (simple, transparent keyword
 * routing — easy for a human or another AI to read and extend), runs that skill
 * with the current brand/product context, and returns a formatted text reply.
 *
 * It can also answer "status" questions directly from app data (no skill call),
 * e.g. "how many campaigns are active?".
 *
 * To make routing smarter later, replace `route()` with a real intent classifier
 * (or have your model pick the skill id from SKILL_LIST). The UI does not change.
 * ----------------------------------------------------------------------------
 */

import type { Channel, SocialPlatform } from "@/types";
import type { AppData } from "@/store/AppStore";
import { SKILLS, SKILL_LIST, type SkillContext } from "./skills";

export interface AssistantReply {
  text: string;
  skillId?: string;
}

const ALL_PLATFORMS: SocialPlatform[] = ["x", "linkedin", "instagram", "tiktok", "youtube", "facebook"];

/** Pick a skill id from the message via keywords. Returns null for status queries. */
function route(message: string): string | "status" | null {
  const m = message.toLowerCase();
  if (/\b(how many|status|summary|overview|what's|whats|count)\b/.test(m)) return "status";
  if (/\b(campaign|funnel|strategy|launch plan)\b/.test(m)) return "campaign-strategy";
  if (/\b(seo|keyword|rank|blog title|meta|outline)\b/.test(m)) return "seo-outline";
  if (/\b(email|sequence|nurture|newsletter|broadcast)\b/.test(m)) return "email-sequence";
  if (/\b(video|script|reel|short|tiktok script|youtube)\b/.test(m)) return "video-script";
  if (/\b(social|post|tweet|linkedin|instagram|caption)\b/.test(m)) return "social-posts";
  if (/\b(voice|tone|brand guideline)\b/.test(m)) return "brand-voice";
  if (/\b(repurpose|turn into|convert)\b/.test(m)) return "repurpose";
  if (/\b(improve|fix|rewrite|sharpen|better)\b/.test(m)) return "improve-text";
  return null;
}

function statusReply(data: AppData): string {
  const activeCampaigns = data.campaigns.filter((c) => c.status === "active").length;
  const scheduledPosts = data.socialPosts.filter((p) => p.status === "scheduled").length;
  const activeSequences = data.emailSequences.filter((s) => s.status === "active").length;
  const upcoming = data.content.filter((c) => c.status === "scheduled").length;
  return [
    `Here's your marketing snapshot:`,
    `• Products/apps: ${data.products.length}`,
    `• Campaigns: ${data.campaigns.length} (${activeCampaigns} active)`,
    `• Email sequences: ${data.emailSequences.length} (${activeSequences} active)`,
    `• Scheduled social posts: ${scheduledPosts}`,
    `• Upcoming content items: ${upcoming}`,
    `• Saved assets: ${data.assets.length}`,
    ``,
    `Try: "Generate a launch campaign", "Write LinkedIn + X posts about onboarding", or "Draft a nurture email sequence".`,
  ].join("\n");
}

/** Run the assistant. `data` powers status answers; `ctx` powers skill calls. */
export async function askAssistant(
  message: string,
  ctx: SkillContext,
  data: AppData,
): Promise<AssistantReply> {
  const target = route(message);

  if (!target) {
    return {
      text:
        `I can help with strategy, SEO, email, video, social, brand voice, and repurposing.\n\n` +
        `For example: "${SKILL_LIST.map((s) => s.name).slice(0, 4).join('", "')}".\n\n` +
        `Ask me to "generate a campaign", "write social posts about X", or "draft an email sequence".`,
    };
  }
  if (target === "status") return { text: statusReply(data) };

  const skill = SKILLS[target];
  try {
    switch (skill.id) {
      case "campaign-strategy": {
        const channels = (["email", "social", "video", "seo"] as Channel[]).filter((c) =>
          message.toLowerCase().includes(c),
        );
        const out = await skill.run(
          { objective: extractObjective(message), channels: channels.length ? channels : (["email", "social"] as Channel[]) },
          ctx,
        );
        return {
          skillId: skill.id,
          text:
            `Campaign outline${ctx.product ? ` for ${ctx.product.name}` : ""}:\n\n${out.outline}\n\n` +
            `Content plan:\n` +
            out.contentPlan.map((p: any) => `• ${p.channel}: ${p.ideas[0]}`).join("\n") +
            `\n\nTimeline:\n` +
            out.timeline.map((t: any) => `• ${t.week}: ${t.focus}`).join("\n") +
            `\n\nOpen the Campaigns tab to save this as a campaign.`,
        };
      }
      case "seo-outline": {
        const out = await skill.run({ pillar: stripVerbs(message) }, ctx);
        return {
          skillId: skill.id,
          text:
            `SEO plan:\n\nKeywords: ${out.keywords.slice(0, 6).join(", ")}\n\n` +
            `Blog titles:\n${out.blogTitles.map((t: string) => `• ${t}`).join("\n")}\n\n` +
            `Meta title: ${out.meta.title}\nMeta description: ${out.meta.description}`,
        };
      }
      case "email-sequence": {
        const out = await skill.run({ goal: extractObjective(message) }, ctx);
        return {
          skillId: skill.id,
          text:
            `${out.name}:\n\n` +
            out.steps
              .map((s: any) => `Day ${s.delayDays} — ${s.subject}`)
              .join("\n") +
            `\n\nOpen the Email tab to save and edit the full sequence.`,
        };
      }
      case "video-script": {
        const out = await skill.run({ topic: stripVerbs(message) }, ctx);
        return { skillId: skill.id, text: `Hook: ${out.hook}\n\nScript:\n${out.longScript}\n\nShort version:\n${out.shortScript}` };
      }
      case "social-posts": {
        const platforms = ALL_PLATFORMS.filter((p) => message.toLowerCase().includes(p === "x" ? "twitter" : p) || message.toLowerCase().includes(p));
        const out = await skill.run(
          { topic: stripVerbs(message), platforms: platforms.length ? platforms : (["x", "linkedin"] as SocialPlatform[]) },
          ctx,
        );
        return { skillId: skill.id, text: out.posts.map((p: any) => `[${p.platform.toUpperCase()}]\n${p.content}`).join("\n\n———\n\n") };
      }
      case "brand-voice": {
        const out = await skill.run({}, ctx);
        return { skillId: skill.id, text: `${out.guidelines}\n\nDo:\n${out.doList.map((d: string) => `• ${d}`).join("\n")}\n\nDon't:\n${out.dontList.map((d: string) => `• ${d}`).join("\n")}` };
      }
      case "repurpose": {
        const out = await skill.run({ sourceText: message, targets: ["email", "social", "blog"] }, ctx);
        return { skillId: skill.id, text: [out.email, out.social, out.blogOutline].filter(Boolean).join("\n\n———\n\n") };
      }
      case "improve-text": {
        const out = await skill.run({ text: message }, ctx);
        return { skillId: skill.id, text: out.improved };
      }
      default:
        return { text: "I couldn't find a skill for that yet." };
    }
  } catch (err) {
    console.error("[assistant] skill failed", err);
    return { text: "Something went wrong running that skill. Try rephrasing your request." };
  }
}

/* -------------------------- small extraction helpers ---------------------- */

function extractObjective(message: string): string {
  const m = message.toLowerCase();
  for (const o of ["launch", "nurture", "retention", "upsell", "awareness"]) {
    if (m.includes(o)) return o;
  }
  return "launch";
}

/** Strip common command verbs so "write seo for onboarding" → "onboarding". */
function stripVerbs(message: string): string {
  return (
    message
      .replace(/\b(write|generate|create|draft|make|build|give me|about|for|a|an|the|some|posts?|content|on)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim() || message
  );
}
