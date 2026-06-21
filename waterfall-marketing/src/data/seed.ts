/**
 * data/seed.ts
 * ----------------------------------------------------------------------------
 * The default, realistic dataset the Waterfall Marketing loads on first run (before
 * the user has saved anything). It is intentionally concrete — real product
 * names, real-sounding campaigns — so the app is useful to demo immediately.
 *
 * This is ALSO the shape your real backend should return. To go live, replace
 * `seedData` with a fetch from Supabase / your API and keep the same types.
 * ----------------------------------------------------------------------------
 */

import type {
  Asset,
  Brand,
  Campaign,
  Contact,
  ContentItem,
  EmailSequence,
  EmailTemplate,
  Product,
  SeoTopic,
  SocialPost,
  VideoProject,
} from "@/types";

export const seedBrand: Brand = {
  name: "Waterfall Technologies",
  tagline: "Software that compounds.",
  positioning:
    "Waterfall Technologies builds a family of focused apps that help small teams ship, market, and grow without a bloated tool stack.",
  toneWords: ["clear", "confident", "practical", "friendly"],
  audience: "Founders and small marketing teams at software companies.",
  website: "https://waterfall.tech",
  primaryColor: "#3B82F6",
};

export const seedProducts: Product[] = [
  {
    id: "prod_resumai",
    name: "ResumAI",
    description: "AI resume builder that tailors your CV to each job in seconds.",
    audience: "Job seekers and career switchers",
    keyBenefits: ["tailor your resume to any job", "beat the ATS", "apply 3x faster"],
    url: "https://resumai.waterfall.tech",
    status: "growth",
    createdAt: "2026-01-12",
  },
  {
    id: "prod_command",
    name: "Waterfall Marketing",
    description: "The AI marketing OS you're using right now — campaigns, SEO, email, video, and social in one hub.",
    audience: "Founders and small marketing teams",
    keyBenefits: ["plan campaigns in minutes", "AI-assisted everywhere", "one hub for all channels"],
    url: "https://waterfall.tech/command",
    status: "active",
    createdAt: "2026-03-02",
  },
  {
    id: "prod_pulse",
    name: "Waterfall Pulse",
    description: "Lightweight product analytics with plain-English insights.",
    audience: "Indie SaaS founders",
    keyBenefits: ["understand users without dashboards", "weekly plain-English digest", "5-minute setup"],
    url: "https://pulse.waterfall.tech",
    status: "idea",
    createdAt: "2026-05-20",
  },
];

export const seedCampaigns: Campaign[] = [
  {
    id: "camp_resumai_launch",
    name: "ResumAI — Spring Launch",
    productId: "prod_resumai",
    objective: "launch",
    channels: ["email", "social", "video", "seo"],
    status: "active",
    startDate: "2026-06-01",
    notes: "Push the new ATS-match feature. Lead with the '3x faster' outcome.",
    outline:
      "GOAL: Launch the ATS-match feature.\nCORE MESSAGE: Tailor your resume to any job in seconds.\nOFFER: Free first tailored resume.\nCHANNELS: email, social, video, seo.",
    metrics: { impressions: 48200, clicks: 3120, conversions: 412, spend: 1850 },
    createdAt: "2026-05-25",
  },
  {
    id: "camp_command_waitlist",
    name: "Waterfall Marketing — Beta Waitlist",
    productId: "prod_command",
    objective: "awareness",
    channels: ["social", "seo", "landing"],
    status: "draft",
    startDate: "2026-06-20",
    notes: "Build the waitlist with a 'marketing OS' positioning. Founder-led content.",
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    createdAt: "2026-06-10",
  },
];

export const seedContacts: Contact[] = [
  { id: "c1", name: "Jordan Lee", email: "jordan@example.com", tags: ["lead", "resumai"], segment: "Job seekers", createdAt: "2026-06-02" },
  { id: "c2", name: "Sam Rivera", email: "sam@example.com", tags: ["customer", "command"], segment: "Founders", createdAt: "2026-05-18" },
  { id: "c3", name: "Priya Nair", email: "priya@example.com", tags: ["lead", "newsletter"], segment: "Founders", createdAt: "2026-06-11" },
  { id: "c4", name: "Alex Chen", email: "alex@example.com", tags: ["trial", "pulse"], segment: "Indie SaaS", createdAt: "2026-06-14" },
];

export const seedSequences: EmailSequence[] = [
  {
    id: "seq_resumai_welcome",
    name: "ResumAI — Welcome & Activation",
    productId: "prod_resumai",
    goal: "activation",
    status: "active",
    createdAt: "2026-05-28",
    steps: [
      { id: "s1", subject: "Welcome — let's tailor your first resume", body: "Hi {{firstName}},\n\nWelcome to ResumAI! Paste a job link and we'll tailor your resume in seconds.\n\n— The Waterfall team", delayDays: 0 },
      { id: "s2", subject: "The #1 reason resumes get rejected", body: "Hi {{firstName}},\n\nMost resumes never reach a human — the ATS filters them out. Here's how ResumAI fixes that…", delayDays: 2 },
      { id: "s3", subject: "Apply 3x faster (here's how)", body: "Hi {{firstName}},\n\nA quick walkthrough of tailoring + one-click export.", delayDays: 4 },
    ],
  },
];

export const seedTemplates: EmailTemplate[] = [
  { id: "t_launch", name: "Product Launch", category: "launch", subject: "It's here: {{product}}", body: "Hi {{firstName}},\n\nToday we're launching {{product}} — {{benefit}}.\n\nBe one of the first to try it: {{cta}}\n\n— {{brand}}" },
  { id: "t_welcome", name: "Welcome", category: "welcome", subject: "Welcome to {{product}} 👋", body: "Hi {{firstName}},\n\nGlad you're here. Here's the fastest way to get value in 5 minutes…\n\n— {{brand}}" },
  { id: "t_announce", name: "Feature Announcement", category: "announcement", subject: "New in {{product}}: {{feature}}", body: "Hi {{firstName}},\n\nWe just shipped {{feature}}. Here's why it matters for you…" },
  { id: "t_promo", name: "Limited Promo", category: "promo", subject: "48 hours only", body: "Hi {{firstName}},\n\nFor the next 48 hours, {{offer}}. Don't miss it: {{cta}}" },
];

export const seedSeoTopics: SeoTopic[] = [
  {
    id: "seo_resume",
    productId: "prod_resumai",
    pillar: "resume writing",
    keywords: ["resume writing guide", "ats resume tips", "how to tailor a resume", "resume keywords"],
    blogTitles: ["The Complete Guide to Resume Writing", "How to Beat the ATS in 2026", "7 Resume Mistakes That Cost You Interviews"],
    notes: "Target buyers actively job-hunting. Tie every post back to the tailoring feature.",
    createdAt: "2026-05-10",
  },
];

export const seedContent: ContentItem[] = [
  { id: "ct1", title: "How to Beat the ATS in 2026", type: "blog", productId: "prod_resumai", date: "2026-06-18", status: "scheduled" },
  { id: "ct2", title: "ResumAI demo — tailor in 30s", type: "video", productId: "prod_resumai", date: "2026-06-19", status: "draft" },
  { id: "ct3", title: "LinkedIn: why we built Waterfall Marketing", type: "social", productId: "prod_command", date: "2026-06-20", status: "scheduled" },
  { id: "ct4", title: "Welcome sequence refresh", type: "email", productId: "prod_resumai", date: "2026-06-21", status: "idea" },
];

export const seedVideos: VideoProject[] = [
  {
    id: "vid_resumai_demo",
    title: "ResumAI 30-second demo",
    productId: "prod_resumai",
    hook: "If you're still rewriting your resume for every job, watch this.",
    angle: "Show the tailoring happen in real time.",
    cta: "Try ResumAI free — link in bio.",
    longScript: "[0:00 HOOK] If you're still rewriting your resume for every job, watch this.\n[0:10] Paste the job link…\n[0:25] ResumAI tailors it instantly.\n[0:50 CTA] Try it free.",
    shortScript: "HOOK: Stop rewriting your resume.\nBODY: ResumAI tailors it in seconds.\nCTA: Try free.",
    createdAt: "2026-06-05",
  },
];

export const seedSocialPosts: SocialPost[] = [
  { id: "sp1", platform: "linkedin", productId: "prod_command", content: "A year ago marketing ate our whole week. Then we built Waterfall Marketing so the team could plan campaigns in minutes. #growth #marketing", scheduledAt: "2026-06-20", status: "scheduled", createdAt: "2026-06-12" },
  { id: "sp2", platform: "x", productId: "prod_resumai", content: "Most resumes never reach a human.\n\nResumAI tailors yours to beat the ATS.\n\n#jobsearch", status: "draft", createdAt: "2026-06-13" },
  { id: "sp3", platform: "instagram", productId: "prod_resumai", content: "Tailor your resume to any job ✨ Apply 3x faster 🚀 #jobsearch #career #resume", scheduledAt: "2026-06-22", status: "scheduled", createdAt: "2026-06-14" },
];

export const seedAssets: Asset[] = [
  { id: "a1", type: "headline", text: "Tailor your resume to any job in seconds.", productId: "prod_resumai", tags: ["hero", "resumai"], createdAt: "2026-05-30" },
  { id: "a2", type: "cta", text: "Try it free — no credit card", productId: null, tags: ["cta"], createdAt: "2026-05-30" },
  { id: "a3", type: "brand-statement", text: "Software that compounds.", productId: null, tags: ["brand"], createdAt: "2026-05-30" },
  { id: "a4", type: "value-prop", text: "Plan campaigns in minutes, not weeks.", productId: "prod_command", tags: ["command"], createdAt: "2026-06-01" },
  { id: "a5", type: "visual-idea", text: "Split-screen: messy resume vs. tailored ResumAI output, animated swap.", productId: "prod_resumai", tags: ["video", "visual"], createdAt: "2026-06-02" },
];

/** Everything the store starts with on first load. */
export const seedData = {
  brand: seedBrand,
  products: seedProducts,
  campaigns: seedCampaigns,
  contacts: seedContacts,
  emailSequences: seedSequences,
  emailTemplates: seedTemplates,
  seoTopics: seedSeoTopics,
  content: seedContent,
  videos: seedVideos,
  socialPosts: seedSocialPosts,
  assets: seedAssets,
};
