import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../theme/tokens";
import {
  storyEngagementSeed,
  useDiscoverFeedEngagementStore,
} from "../store/discoverFeedEngagementStore";

export function formatEngagementCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function DiscoverStoryEngagementBar({
  articleId,
  compact,
  onOpenComments,
}: {
  articleId: string;
  compact?: boolean;
  onOpenComments: () => void;
}) {
  const toggleLike = useDiscoverFeedEngagementStore((s) => s.toggleLike);
  const liked = useDiscoverFeedEngagementStore((s) => s.likedStoryIds.includes(articleId));
  const extraComments = useDiscoverFeedEngagementStore(
    (s) => s.commentsByStory[articleId]?.length ?? 0,
  );
  const seed = storyEngagementSeed(articleId);
  const likeCount = seed.likes + (liked ? 1 : 0);
  const commentCount = seed.comments + extraComments;
  const icon = compact ? 18 : 22;
  const fontSize = compact ? 12 : 13;
  const padV = compact ? 10 : spacing.md;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: padV,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: compact ? spacing.md : spacing.lg,
      }}
    >
      <Pressable
        onPress={() => toggleLike(articleId)}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        hitSlop={8}
        accessibilityLabel={liked ? "Unlike" : "Like"}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={icon}
          color={liked ? "#E11D48" : colors.foreground}
        />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize, color: colors.foreground }}>
          {formatEngagementCount(likeCount)}
        </Text>
      </Pressable>
      <Pressable
        onPress={onOpenComments}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        hitSlop={8}
        accessibilityLabel="Comments"
      >
        <Feather name="message-circle" size={icon} color={colors.foreground} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize, color: colors.foreground }}>
          {formatEngagementCount(commentCount)}
        </Text>
      </Pressable>
    </View>
  );
}
