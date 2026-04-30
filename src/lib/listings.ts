import { sanity } from "./sanity";
import { supabase } from "./supabase";

// =====================================================================
// Types
// =====================================================================
export type ListingCategory =
  | "fashion" | "tech" | "travel" | "automotive"
  | "finance" | "fnb"  | "beauty" | "realestate";

export type ListingActionType =
  | "redirect_link"
  | "copy_code"
  | "qr_code"
  | "pin_code"
  | "app_download"
  | "software_code"
  | "form";

export interface SanityImage {
  asset?: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number; height: number; width: number };
}

export interface FormField {
  key: string;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  type:
    | "text" | "textarea" | "email" | "phone" | "number"
    | "date" | "dob" | "select" | "multi_select" | "checkbox";
  required?: boolean;
  options?: string[] | null;
  min?: number | null;
  max?: number | null;
}

export interface ListingForm {
  _id: string;
  title: string;
  purpose?: string | null;
  minAge?: number | null;
  consentText?: string | null;
  successMessage?: string | null;
  fields: FormField[];
}

export interface ListingBrand {
  _id: string;
  name: string;
  logo?: SanityImage | null;
  slug?: { current?: string } | null;
}

export interface ListingAction {
  type: ListingActionType;
  label?: string | null;
  url?: string | null;
  iosUrl?: string | null;
  androidUrl?: string | null;
  supabaseCodeId?: string | null;
  qrPayload?: string | null;
  pin?: string | null;
  form?: ListingForm | null;
  successMessage?: string | null;
}

export interface Listing {
  _id: string;
  title: string;
  category: ListingCategory;
  brand: ListingBrand | null;
  coverImage: SanityImage | null;
  gallery?: SanityImage[] | null;
  shortDescription?: string | null;
  longDescription?: unknown[] | null;
  channel?: "online" | "instore" | "both" | null;
  action: ListingAction;
  tags?: string[] | null;
  featured?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  workflowStatus: "draft" | "in_review" | "published";
}

// =====================================================================
// GROQ helpers
// =====================================================================
const LISTING_PROJECTION = `{
  _id, title, category, channel, tags, featured,
  publishedAt, expiresAt, workflowStatus,
  shortDescription, longDescription,
  coverImage, gallery,
  brand->{
    _id, name, logo, slug
  },
  action{
    type, label, url, iosUrl, androidUrl,
    supabaseCodeId, qrPayload, pin, successMessage,
    form->{
      _id, title, purpose, minAge, consentText, successMessage,
      fields[]{key,label,placeholder,helpText,type,required,options,min,max}
    }
  }
}`;

function publishedFilter(now: string): string {
  return `_type == "listing"
    && workflowStatus == "published"
    && (!defined(expiresAt) || expiresAt > "${now}")`;
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const now = new Date().toISOString();
  const result = await sanity.fetch<Listing | null>(
    `*[${publishedFilter(now)} && _id == $id][0]${LISTING_PROJECTION}`,
    { id },
  );
  return result ?? null;
}

export async function fetchListingsByCategory(
  category: ListingCategory,
  limit = 50,
): Promise<Listing[]> {
  const now = new Date().toISOString();
  const result = await sanity.fetch<Listing[]>(
    `*[${publishedFilter(now)} && category == $cat]
       | order(featured desc, publishedAt desc)[0...$limit]${LISTING_PROJECTION}`,
    { cat: category, limit },
  );
  return result ?? [];
}

export async function fetchFeaturedListings(limit = 12): Promise<Listing[]> {
  const now = new Date().toISOString();
  const result = await sanity.fetch<Listing[]>(
    `*[${publishedFilter(now)} && featured == true]
       | order(publishedAt desc)[0...$limit]${LISTING_PROJECTION}`,
    { limit },
  );
  return result ?? [];
}

// =====================================================================
// Edge function helpers
// =====================================================================
export interface CodePreview {
  id: string;
  code: string;
  codeType: "coupon" | "promo" | "referral";
  brandId?: string | null;
  dealTitle?: string | null;
  description?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  pointsReward?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export async function fetchCodePreview(codeId: string): Promise<CodePreview> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    code?: CodePreview;
    error?: { message: string; code?: string };
  }>("get-code", { body: { codeId } });

  if (error) throw new Error(error.message);
  if (!data || data.error || !data.code) {
    throw new Error(data?.error?.message ?? "Failed to load code");
  }
  return data.code;
}

export interface SubmitLeadInput {
  formId: string;
  listingId?: string;
  payload: Record<string, unknown>;
  consent: boolean;
}

export interface SubmitLeadResponse {
  leadId: string;
  webhookStatus: "sent" | "failed" | "sheets_fallback" | "no_destination";
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResponse> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    leadId?: string;
    webhookStatus?: SubmitLeadResponse["webhookStatus"];
    error?: { message: string; code?: string };
  }>("submit-lead", { body: input });

  if (error) throw new Error(error.message);
  if (!data || data.error || !data.leadId) {
    throw new Error(data?.error?.message ?? "Failed to submit");
  }
  return {
    leadId: data.leadId,
    webhookStatus: data.webhookStatus ?? "no_destination",
  };
}
