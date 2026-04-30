import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ActionRedirectLink } from "../../components/actions/ActionRedirectLink";
import { ActionCopyCode }     from "../../components/actions/ActionCopyCode";
import { ActionQRCode }       from "../../components/actions/ActionQRCode";
import { ActionPin }          from "../../components/actions/ActionPin";
import { ActionAppDownload }  from "../../components/actions/ActionAppDownload";
import { ActionSoftwareCode } from "../../components/actions/ActionSoftwareCode";
import { ActionForm }         from "../../components/actions/ActionForm";
import { fetchListingById, type Listing } from "../../lib/listings";
import { urlFor } from "../../lib/sanity";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const CATEGORY_LABELS: Record<string, string> = {
  fashion:    "Fashion",
  tech:       "Tech",
  travel:     "Travel",
  automotive: "Automotive",
  finance:    "Finance",
  fnb:        "F&B",
  beauty:     "Beauty",
  realestate: "Real Estate",
};

export function ListingDetailScreen({
  route,
}: {
  route: { params: { id: string } };
}) {
  const { id } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    setListing(null);
    fetchListingById(id)
      .then((l) => {
        if (!active) return;
        if (!l) setError("This listing is no longer available.");
        else setListing(l);
      })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={listing?.brand?.name ?? "Listing"} eyebrow="Back" />
      {!listing && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : listing ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {listing.coverImage ? (
            <Image
              source={{ uri: urlFor(listing.coverImage).width(1200).url() }}
              style={styles.cover}
              contentFit="cover"
            />
          ) : null}

          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              {CATEGORY_LABELS[listing.category] ?? listing.category}
              {listing.channel ? `  ·  ${labelChannel(listing.channel)}` : ""}
            </Text>
            <Text style={styles.title}>{listing.title}</Text>
            {listing.shortDescription ? (
              <Text style={styles.body}>{listing.shortDescription}</Text>
            ) : null}
          </View>

          <View style={styles.actionCard}>
            <ListingActionRenderer listing={listing} />
          </View>

          {listing.tags?.length ? (
            <View style={styles.tagRow}>
              {listing.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagLabel}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function labelChannel(c: "online" | "instore" | "both"): string {
  return c === "online" ? "Online" : c === "instore" ? "In-store" : "Online + In-store";
}

function ListingActionRenderer({ listing }: { listing: Listing }) {
  const a = listing.action;
  switch (a.type) {
    case "redirect_link":
      if (!a.url) return <UnconfiguredAction reason="Missing URL" />;
      return <ActionRedirectLink url={a.url} label={a.label} category={listing.category} />;

    case "copy_code":
      if (!a.supabaseCodeId) return <UnconfiguredAction reason="Missing code id" />;
      return (
        <ActionCopyCode
          codeId={a.supabaseCodeId}
          label={a.label}
          successMessage={a.successMessage}
        />
      );

    case "qr_code":
      if (!a.qrPayload) return <UnconfiguredAction reason="Missing QR payload" />;
      return <ActionQRCode payload={a.qrPayload} label={a.label} />;

    case "pin_code":
      if (!a.pin) return <UnconfiguredAction reason="Missing PIN" />;
      return <ActionPin pin={a.pin} label={a.label} successMessage={a.successMessage} />;

    case "app_download":
      return (
        <ActionAppDownload
          iosUrl={a.iosUrl}
          androidUrl={a.androidUrl}
          url={a.url}
          label={a.label}
        />
      );

    case "software_code":
      if (!a.supabaseCodeId) return <UnconfiguredAction reason="Missing code id" />;
      return (
        <ActionSoftwareCode
          codeId={a.supabaseCodeId}
          url={a.url}
          label={a.label}
          successMessage={a.successMessage}
        />
      );

    case "form":
      if (!a.form) return <UnconfiguredAction reason="Missing form" />;
      return <ActionForm form={a.form} listingId={listing._id} />;

    default:
      return <UnconfiguredAction reason="Unknown action" />;
  }
}

function UnconfiguredAction({ reason }: { reason: string }) {
  return (
    <View style={styles.unconfigured}>
      <Feather name="settings" size={14} color={colors.textTertiary} />
      <Text style={styles.unconfiguredText}>
        This deal is being prepared. ({reason})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.destructive },
  scroll: { paddingBottom: spacing.xxxl },
  cover: { width: "100%", height: 280, backgroundColor: colors.muted },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: 8 },
  eyebrow: {
    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2.4,
    textTransform: "uppercase", color: colors.textTertiary,
  },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.foreground, lineHeight: 32 },
  body:  { fontFamily: fonts.body,    fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  actionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  tagRow: {
    flexDirection: "row", flexWrap: "wrap", gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.muted, borderRadius: radius.pill,
  },
  tagLabel: {
    fontFamily: fonts.body, fontSize: 11, letterSpacing: 0.6, color: colors.textSecondary,
  },
  unconfigured: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  unconfiguredText: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary, flex: 1 },
});
