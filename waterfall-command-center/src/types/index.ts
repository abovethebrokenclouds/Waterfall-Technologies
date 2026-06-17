/**
 * types/index.ts
 * ----------------------------------------------------------------------------
 * The single source of truth for every data shape in the Waterfall Command
 * Center. Every module (Campaigns, SEO, Email, Video, Social, Assets) and the
 * AI skill layer reference these types so data stays consistent end-to-end.
 *
 * If you add a new feature module, add its entity here first, then wire it into
 * `AppData` (see store/AppStore.tsx) and, if relevant, the AI skills (see ai/).
 * ----------------------------------------------------------------------------
 */

export type ID = string;
export type ISODate = string; // e.g. "2026-06-17"

/** Channels a campaign / piece of content can live on. */
export type Channel = "email" | "social" | "video" | "seo" | "landing";

/* -------------------------------------------------------------------------- */
/*  Brand & Products                                                          */
/* -------------------------------------------------------------------------- */

/** Global company brand. There is exactly one Brand in the app. */
export interface Brand {
  name: string;
  tagline: string;
  positioning: string;
  /** Adjectives describing the brand voice, e.g. ["confident", "clear"]. */
  toneWords: string[];
  audience: string;
  website: string;
  primaryColor: string;
}

export type ProductStatus = "idea" | "active" | "growth" | "sunset";

/** A sub-app / product under the Waterfall umbrella. */
export interface Product {
  id: ID;
  name: string;
  description: string;
  /** Ideal Customer Profile for this product. */
  audience: string;
  keyBenefits: string[];
  url?: string;
  status: ProductStatus;
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/*  Campaigns                                                                 */
/* -------------------------------------------------------------------------- */

export type CampaignObjective =
  | "launch"
  | "nurture"
  | "retention"
  | "upsell"
  | "awareness";
export type CampaignStatus = "draft" | "active" | "paused" | "complete";

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface Campaign {
  id: ID;
  name: string;
  productId: ID | null;
  objective: CampaignObjective;
  channels: Channel[];
  status: CampaignStatus;
  startDate?: ISODate;
  notes: string;
  /** AI-generated campaign outline (markdown-ish plain text). */
  outline?: string;
  /** Performance numbers — mocked today, swap for real analytics later. */
  metrics: CampaignMetrics;
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/*  Email                                                                     */
/* -------------------------------------------------------------------------- */

export interface Contact {
  id: ID;
  name: string;
  email: string;
  tags: string[];
  segment: string;
  createdAt: ISODate;
}

export interface EmailStep {
  id: ID;
  subject: string;
  body: string;
  /** Days to wait after the previous step before sending. */
  delayDays: number;
}

export interface EmailSequence {
  id: ID;
  name: string;
  productId: ID | null;
  goal: string;
  steps: EmailStep[];
  status: "draft" | "active";
  createdAt: ISODate;
}

export type EmailTemplateCategory =
  | "launch"
  | "nurture"
  | "announcement"
  | "promo"
  | "welcome";

export interface EmailTemplate {
  id: ID;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string;
}

/* -------------------------------------------------------------------------- */
/*  SEO & Content                                                             */
/* -------------------------------------------------------------------------- */

export interface SeoTopic {
  id: ID;
  productId: ID | null;
  pillar: string;
  keywords: string[];
  blogTitles: string[];
  notes: string;
  createdAt: ISODate;
}

export type ContentType = "blog" | "video" | "social" | "email" | "landing";
export type ContentStatus = "idea" | "draft" | "scheduled" | "published";

export interface ContentItem {
  id: ID;
  title: string;
  type: ContentType;
  productId: ID | null;
  date: ISODate;
  status: ContentStatus;
}

/* -------------------------------------------------------------------------- */
/*  Video                                                                     */
/* -------------------------------------------------------------------------- */

export interface VideoProject {
  id: ID;
  title: string;
  productId: ID | null;
  hook: string;
  angle: string;
  cta: string;
  longScript: string;
  shortScript: string;
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/*  Social                                                                    */
/* -------------------------------------------------------------------------- */

export type SocialPlatform =
  | "x"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook";
export type SocialStatus = "draft" | "scheduled" | "posted";

export interface SocialPost {
  id: ID;
  platform: SocialPlatform;
  content: string;
  productId: ID | null;
  scheduledAt?: ISODate;
  status: SocialStatus;
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/*  Assets                                                                    */
/* -------------------------------------------------------------------------- */

export type AssetType =
  | "headline"
  | "cta"
  | "brand-statement"
  | "value-prop"
  | "visual-idea";

export interface Asset {
  id: ID;
  type: AssetType;
  text: string;
  productId: ID | null;
  tags: string[];
  createdAt: ISODate;
}
