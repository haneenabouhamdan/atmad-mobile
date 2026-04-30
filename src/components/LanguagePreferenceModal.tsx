import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { APP_LOCALES } from "../regional/RegionalPreferencesContext";
import { colors, fonts, spacing } from "../theme/tokens";

export function LanguagePreferenceModal({
  visible,
  locale,
  busy,
  onClose,
  onPick,
}: {
  visible: boolean;
  locale: string;
  busy?: boolean;
  onClose: () => void;
  onPick: (tag: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Text style={{
            fontFamily: fonts.heading,
            fontSize: 18,
            color: colors.foreground,
          }}>
            Language
          </Text>
          <Pressable onPress={onClose} disabled={busy} hitSlop={10}>
            <Text style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 11,
              letterSpacing: 2,
              color: colors.foreground,
              textTransform: "uppercase",
            }}>
              Done
            </Text>
          </Pressable>
        </View>
        <FlatList
          data={[...APP_LOCALES]}
          keyExtractor={(item) => item.tag}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item.tag)}
              disabled={busy}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.lg,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: pressed ? "rgba(60,60,60,0.06)" : "transparent",
              })}
            >
              <Text style={{
                fontFamily: locale === item.tag ? fonts.bodyMedium : fonts.body,
                fontSize: 15,
                color: colors.foreground,
              }}>
                {item.label}
              </Text>
              {locale === item.tag ? (
                <Feather name="check" size={16} color={colors.foreground} />
              ) : null}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
