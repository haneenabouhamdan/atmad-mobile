/**
 * Typed journey events for Stages A–F (acquisition → retention).
 * Wire `trackJourney` to your analytics backend (Segment, PostHog, etc.).
 */

export type JourneyStage = "A" | "B" | "C" | "D" | "E" | "F";

export type JourneyEventName =
  | "app_open"
  | "auth_welcome_view"
  | "auth_phone_start"
  | "auth_email_password_start"
  | "auth_oauth_start"
  | "auth_oauth_complete"
  | "registration_complete"
  | "email_verified"
  | "phone_verified"
  | "onboarding_complete"
  | "onboarding_step"
  | "onboarding_country_otp_sent"
  | "onboarding_country_phone_verified"
  | "onboarding_country_phone_skip"
  | "region_country_change"
  | "region_locale_change"
  | "home_feed_view"
  | "deal_activate"
  | "wallet_view"
  | "retention_tier_seen"
  | "referral_open";

/** Reserved properties for personalization / attribution (Stages C–F). */
export type JourneyAnalyticsContext = {
  countryIso?: string;
  locale?: string;
  userRole?: string;
};

export function formatJourneyEvent(
  event: JourneyEventName,
  props?: JourneyAnalyticsContext & Record<string, unknown>,
): { event: JourneyEventName; props?: Record<string, unknown>; ts: string } {
  return { event, props: props ? { ...props } : undefined, ts: new Date().toISOString() };
}

/**
 * Prefer calling this from screens after meaningful user actions only.
 */
export function trackJourney(
  event: JourneyEventName,
  props?: JourneyAnalyticsContext & Record<string, unknown>,
): void {
  const payload = formatJourneyEvent(event, props);
  if (__DEV__) {
    console.log("[journey]", payload.event, payload.props ?? {});
  }
  // Backend hook: Segment / PostHog / Supabase `analytics_events`
}
