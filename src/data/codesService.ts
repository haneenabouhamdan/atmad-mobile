import { supabase } from "../lib/supabase";
import { redeemCode } from "../auth/authActions";
import { env } from "../lib/env";
import { mockDeals } from "./mock";
import type { Deal } from "./types";
import type { DealSummary } from "../intelligence/recommendations";

/**
 * Find a deal by id (for the DealActivation screen).
 * Order of resolution:
 *   1. Supabase active codes (real backend)
 *   2. Local mock fallback (UI preview mode)
 */
export async function findDealByCode(code: string): Promise<Deal | null> {
  if (!env.IS_CONFIGURED) {
    return mockDeals.find((d) => d.code === code) ?? null;
  }
  try {
    const { data } = await supabase
      .from("codes_public")
      .select(
        "id, code, brand_id, deal_title, description, discount_percent, discount_amount, points_reward, valid_until, deal_category, affiliate_url",
      )
      .eq("code", code.toUpperCase())
      .maybeSingle();
    if (!data) return null;
    const row = data as Record<string, unknown>;
    const dealCategory =
      typeof row.deal_category === "string" && row.deal_category
        ? row.deal_category
        : "Luxury";
    const affiliate =
      typeof row.affiliate_url === "string" && row.affiliate_url.trim()
        ? row.affiliate_url.trim()
        : undefined;
    return {
      id: String(row.id ?? ""),
      brand: (row.brand_id as string) ?? "ATMAD",
      description: (row.description as string) ?? (row.deal_title as string) ?? "",
      code: row.code as string,
      discount: row.discount_percent
        ? `${row.discount_percent}% off`
        : row.discount_amount
          ? `${row.discount_amount} off`
          : "Member offer",
      points: (row.points_reward as number) ?? 0,
      expiry: row.valid_until
        ? `Valid through ${new Date(String(row.valid_until)).toLocaleDateString()}`
        : "Open",
      category: dealCategory,
      terms: (row.deal_title as string) ?? "Member offer",
      affiliateUrl: affiliate,
    };
  } catch (e) {
    console.warn("Supabase code lookup failed:", e);
    return null;
  }
}

/** Active codes for home recommendations (requires `codes_public.deal_category` from migration). */

/** Teaser rows for vault browse (codes hidden until deal screen). */
export type VaultCatalogRow = {
  code: string;
  brand: string;
  title: string;
  discountLine: string;
  points: number;
};

export async function fetchVaultCatalog(limit = 32): Promise<VaultCatalogRow[]> {
  if (!env.IS_CONFIGURED) {
    return mockDeals.slice(0, limit).map((d) => ({
      code: d.code,
      brand: d.brand,
      title: d.description,
      discountLine: d.discount,
      points: d.points ?? 0,
    }));
  }
  try {
    const { data, error } = await supabase
      .from("codes_public")
      .select(
        "code, brand_id, deal_title, description, discount_percent, discount_amount, points_reward",
      )
      .order("points_reward", { ascending: false })
      .limit(limit);
    if (error || !data?.length) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      code: String(r.code ?? ""),
      brand: (r.brand_id as string) ?? "ATMAD",
      title: (r.deal_title as string) ?? (r.description as string) ?? "Member offer",
      discountLine: r.discount_percent
        ? `${r.discount_percent}% off`
        : r.discount_amount
          ? `${r.discount_amount} off`
          : "Member offer",
      points: (r.points_reward as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

export type LedgerRow = {
  id: string;
  deltaPoints: number;
  reason: string;
  createdAt: string;
};

export async function fetchRecentLedger(limit = 20): Promise<LedgerRow[]> {
  if (!env.IS_CONFIGURED) return [];
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, delta_points, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      deltaPoints: (r.delta_points as number) ?? 0,
      reason: String(r.reason ?? ""),
      createdAt: String(r.created_at ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function fetchDealSummariesForHome(): Promise<DealSummary[]> {
  if (!env.IS_CONFIGURED) return [];
  try {
    const { data, error } = await supabase
      .from("codes_public")
      .select("code, brand_id, points_reward, deal_category")
      .order("points_reward", { ascending: false });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      code: String(r.code ?? ""),
      brand: (r.brand_id as string) ?? "ATMAD",
      category:
        typeof r.deal_category === "string" && r.deal_category
          ? r.deal_category
          : "Luxury",
      points: (r.points_reward as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function listMyRedemptions() {
  if (!env.IS_CONFIGURED) return [];
  try {
    const { data } = await supabase
      .from("redemptions")
      .select(
        "id, redeemed_at, points_awarded, status, code_id, codes:code_id(code, deal_title, brand_id)",
      )
      .eq("status", "success")
      .order("redeemed_at", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch (e) {
    console.warn("Failed to list redemptions:", e);
    return [];
  }
}

export { redeemCode };
