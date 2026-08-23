import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import type { FeedStoryComment } from "../store/discoverFeedEngagementStore";
import { colors, fonts, radius, spacing } from "../theme/tokens";
import {
  emptyFeedStoryComments,
  useDiscoverFeedEngagementStore,
} from "../store/discoverFeedEngagementStore";

const windowH = Dimensions.get("window").height;

const absoluteFill = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

const GUEST_NAMES = [
  "Amélie V.",
  "Marcus L.",
  "Sofia R.",
  "James K.",
  "Nina T.",
  "David H.",
  "Elena P.",
  "Chris M.",
];

const AVATAR_BACKDROPS = [
  "#E8E4DF",
  "#E3E8E4",
  "#E5E2E8",
  "#EAE8E0",
  "#E2E6EA",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function displayAuthor(c: FeedStoryComment): string {
  if (c.author?.trim()) return c.author.trim();
  const h = hashString(c.id);
  return GUEST_NAMES[h % GUEST_NAMES.length];
}

function initials(name: string): string {
  const p = name.split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + (p[1][0] || "")).toUpperCase();
}

function avatarBackdrop(name: string): string {
  const h = hashString(name);
  return AVATAR_BACKDROPS[h % AVATAR_BACKDROPS.length];
}

function formatRelativeTime(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Props = {
  visible: boolean;
  storyId: string;
  headline: string;
  onClose: () => void;
};

function CommentRow({
  item,
  liked,
  onToggleLike,
}: {
  item: FeedStoryComment;
  liked: boolean;
  onToggleLike: (id: string) => void;
}) {
  const name = displayAuthor(item);
  const bg = avatarBackdrop(name);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: spacing.md,
        paddingRight: spacing.xs,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 13,
            color: colors.foreground,
            letterSpacing: -0.3,
          }}
        >
          {initials(name)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <Text
            style={{
              fontFamily: fonts.bodySemi,
              fontSize: 14,
              color: colors.foreground,
              marginRight: spacing.xs,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: fonts.bodyLight,
              fontSize: 13,
              color: colors.textTertiary,
            }}
          >
            · {formatRelativeTime(item.at)}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          {item.text}
        </Text>
      </View>
      <Pressable
        onPress={() => onToggleLike(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingTop: 2, marginLeft: spacing.sm }}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={18}
          color={liked ? colors.destructive : colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

export function DiscoverStoryCommentsSheet({ visible, storyId, headline, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [keyboardPad, setKeyboardPad] = useState(0);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const insets = useSafeAreaInsets();
  const addComment = useDiscoverFeedEngagementStore((s) => s.addComment);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardPad(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardPad(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) setKeyboardPad(0);
  }, [visible]);

  const list = useDiscoverFeedEngagementStore((s) => {
    if (!storyId) return emptyFeedStoryComments;
    return s.commentsByStory[storyId] ?? emptyFeedStoryComments;
  });

  const sortedList = useMemo(() => [...list].sort((a, b) => a.at - b.at), [list]);

  const toggleLike = useCallback((id: string) => {
    setLikedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const submit = () => {
    const t = draft.trim();
    if (!t || !storyId) return;
    addComment(storyId, t);
    setDraft("");
  };

  const countLabel =
    sortedList.length === 0
      ? "Be the first to comment"
      : sortedList.length === 1
        ? "1 comment"
        : `${sortedList.length} comments`;

  const headerBlock = (
    <>
      {Platform.OS === "android" ? (
        <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
          paddingTop: Platform.OS === "ios" ? spacing.md : 0,
        }}
      >
        <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.foreground }}>
          Comments
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Feather name="x" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            color: colors.foreground,
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {headline}
        </Text>
        <Text style={{ fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary }}>
          {countLabel}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.xl }} />
    </>
  );

  const composerAvatar = (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: avatarBackdrop("You"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.foreground }}>
        {initials("You")}
      </Text>
    </View>
  );

  const inputRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.md + (keyboardPad > 0 ? 0 : insets.bottom),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {composerAvatar}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Add a comment…"
        placeholderTextColor={colors.textTertiary}
        style={{
          flex: 1,
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.foreground,
          paddingVertical: Platform.OS === "ios" ? 12 : 10,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.muted,
        }}
        onSubmitEditing={submit}
      />
      <Pressable
        onPress={submit}
        disabled={!draft.trim()}
        style={{
          paddingVertical: 12,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: draft.trim() ? colors.foreground : colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 12,
            letterSpacing: 0.8,
            color: draft.trim() ? colors.inverse : colors.textTertiary,
            textTransform: "uppercase",
          }}
        >
          Post
        </Text>
      </Pressable>
    </View>
  );

  const listEmpty = (
    <View
      style={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Feather name="message-circle" size={28} color={colors.textSecondary} />
      </View>
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          fontSize: 16,
          color: colors.foreground,
          marginBottom: spacing.xs,
          textAlign: "center",
        }}
      >
        No comments yet
      </Text>
      <Text
        style={{
          fontFamily: fonts.bodyLight,
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Share what you think — your note will appear here.
      </Text>
    </View>
  );

  const listBody = (
    <FlatList
      data={sortedList}
      keyExtractor={(c) => c.id}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={listEmpty}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.6, marginLeft: 44 + spacing.md }} />
      )}
      renderItem={({ item }) => (
        <CommentRow item={item} liked={!!likedComments[item.id]} onToggleLike={toggleLike} />
      )}
    />
  );

  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            paddingBottom: keyboardPad,
          }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            {headerBlock}
            {listBody}
            {inputRow}
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ ...absoluteFill, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={onClose} />
        <View
          style={{
            height: windowH * 0.88,
            backgroundColor: colors.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            overflow: "hidden",
            paddingBottom: keyboardPad,
          }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
            {headerBlock}
            {listBody}
            {inputRow}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
