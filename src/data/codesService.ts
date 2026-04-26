import { supabase } from "../lib/supabase";
import { redeemCode } from "../auth/authActions";
import { env } from "../lib/env";
import { mockDeals } from "./mock";
import type { Deal } from "./types";

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
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      brand: data.brand_id ?? "ATMAD",
      description: data.description ?? data.deal_title ?? "",
      code: data.code,
      discount: data.discount_percent
        ? `${data.discount_percent}% off`
        : data.discount_amount
          ? `${data.discount_amount} off`
          : "Member offer",
      points: data.points_reward ?? 0,
      expiry: data.valid_until
        ? `Valid through ${new Date(data.valid_until).toLocaleDateString()}`
        : "Open",
      category: "Luxury",
      terms: data.deal_title ?? "Member offer",
    };
  } catch (e) {
    console.warn("Supabase code lookup failed:", e);
    return null;
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
