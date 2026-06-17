/**
 * store/AppStore.tsx
 * ----------------------------------------------------------------------------
 * The single, predictable state container for the whole Command Center.
 *
 * WHY THIS PATTERN: One React Context + localStorage persistence. No Redux, no
 * external store — easy for a human (or an AI agent) to read, modify, and debug.
 * Every feature module reads from `useStore()` and mutates through a tiny,
 * uniform CRUD API: add / update / remove for any collection.
 *
 * GOING LIVE: Swap the localStorage load/save for Supabase (or any API). Keep
 * the `AppData` shape identical and the rest of the app won't change.
 * ----------------------------------------------------------------------------
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Asset,
  Brand,
  Campaign,
  Contact,
  ContentItem,
  EmailSequence,
  EmailTemplate,
  ID,
  Product,
  SeoTopic,
  SocialPost,
  VideoProject,
} from "@/types";
import { seedData } from "@/data/seed";

/** The full application dataset. */
export interface AppData {
  brand: Brand;
  products: Product[];
  campaigns: Campaign[];
  contacts: Contact[];
  emailSequences: EmailSequence[];
  emailTemplates: EmailTemplate[];
  seoTopics: SeoTopic[];
  content: ContentItem[];
  videos: VideoProject[];
  socialPosts: SocialPost[];
  assets: Asset[];
}

/** Keys of AppData that hold an array of records with an `id`. */
export type ListKey = Exclude<keyof AppData, "brand">;
type Item = { id: ID };

interface StoreValue {
  data: AppData;
  /** The product currently in focus across the app (drives AI context). */
  selectedProductId: ID | null;
  selectedProduct: Product | null;
  setSelectedProductId: (id: ID | null) => void;

  setBrand: (brand: Brand) => void;
  /** Append an item to a collection. */
  add: <K extends ListKey>(key: K, item: AppData[K][number]) => void;
  /** Patch an item in a collection by id. */
  update: <K extends ListKey>(key: K, id: ID, patch: Partial<AppData[K][number]>) => void;
  /** Remove an item from a collection by id. */
  remove: (key: ListKey, id: ID) => void;
  /** Wipe local data and reload the seed dataset. */
  reset: () => void;
}

const STORAGE_KEY = "waterfall-command-center:v1";

const StoreContext = createContext<StoreValue | null>(null);

function loadInitial(): AppData {
  if (typeof window === "undefined") return seedData as AppData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...(seedData as AppData), ...JSON.parse(raw) };
  } catch (err) {
    console.warn("[store] failed to parse saved data, using seed:", err);
  }
  return seedData as AppData;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitial);
  const [selectedProductId, setSelectedProductId] = useState<ID | null>(null);

  // Persist on every change. Debounced via microtask-free simplicity is fine here.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("[store] failed to persist:", err);
    }
  }, [data]);

  const setBrand = useCallback((brand: Brand) => {
    setData((d) => ({ ...d, brand }));
  }, []);

  const add = useCallback(<K extends ListKey>(key: K, item: AppData[K][number]) => {
    setData((d) => ({ ...d, [key]: [item, ...(d[key] as Item[])] } as AppData));
  }, []);

  const update = useCallback(
    <K extends ListKey>(key: K, id: ID, patch: Partial<AppData[K][number]>) => {
      setData((d) => ({
        ...d,
        [key]: (d[key] as Item[]).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      } as AppData));
    },
    [],
  );

  const remove = useCallback((key: ListKey, id: ID) => {
    setData((d) => ({ ...d, [key]: (d[key] as Item[]).filter((it) => it.id !== id) } as AppData));
  }, []);

  const reset = useCallback(() => {
    setData(seedData as AppData);
    setSelectedProductId(null);
  }, []);

  const selectedProduct = useMemo(
    () => data.products.find((p) => p.id === selectedProductId) ?? null,
    [data.products, selectedProductId],
  );

  const value: StoreValue = {
    data,
    selectedProductId,
    selectedProduct,
    setSelectedProductId,
    setBrand,
    add,
    update,
    remove,
    reset,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Access the global store. Throws if used outside <StoreProvider>. */
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

/** Convenience: the SkillContext (brand + selected product) for AI calls. */
export function useSkillContext() {
  const { data, selectedProduct } = useStore();
  return { brand: data.brand, product: selectedProduct };
}
