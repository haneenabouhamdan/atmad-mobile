/**
 * Auth actions: phone OTP, sign in / sign up, profile updates.
 * All sign-in flows use Supabase Auth + PKCE. The client never touches
 * the service role key.
 */
import { supabase } from "../lib/supabase";

const PHONE_E164 = /^\+[1-9]\d{6,14}$/;

export async function sendPhoneOtp(phoneE164: string) {
  if (!PHONE_E164.test(phoneE164)) {
    return { success: false, error: "Invalid phone number" };
  }
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneE164,
    options: { channel: "sms" },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyPhoneOtp(phoneE164: string, token: string) {
  const cleaned = token.replace(/\D/g, "");
  if (cleaned.length < 4 || cleaned.length > 8) {
    return { success: false, error: "Invalid code" };
  }
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneE164,
    token: cleaned,
    type: "sms",
  });
  if (error) return { success: false, error: error.message };
  return { success: true, session: data.session };
}

export async function updateProfile(payload: {
  fullName?: string;
  interests?: string[];
  userRole?: "consumer" | "influencer" | "affiliate" | "advertiser";
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const update: Record<string, unknown> = {};
  if (payload.fullName  !== undefined) update.full_name = payload.fullName;
  if (payload.interests !== undefined) update.interests = payload.interests;
  if (payload.userRole  !== undefined) update.user_role = payload.userRole;

  const { error } = await supabase.from("profiles")
    .update(update).eq("id", user.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Server-side coupon redemption via Edge Function.
 */
export async function redeemCode(input: {
  code: string;
  deviceFingerprint?: string;
}): Promise<
  | { success: true; type: string; points: number; discountPercent?: number; discountAmount?: number; redemptionId?: string }
  | { success: false; error: string; code?: string }
> {
  const { data, error } = await supabase.functions.invoke("redeem-code", {
    body: input,
  });
  if (error) return { success: false, error: error.message };
  if (data?.error)  return { success: false, error: data.error.message, code: data.error.code };
  return { success: true, ...data };
}
