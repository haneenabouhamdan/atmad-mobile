import { Pressable, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

export function PasswordField({
  value,
  onChangeText,
  placeholder,
  autoComplete,
  textContentType,
  visible,
  onToggleVisible,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoComplete: "password" | "password-new";
  textContentType: "password" | "newPassword";
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoComplete={autoComplete}
        textContentType={textContentType}
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: 14,
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.foreground,
        }}
      />
      <Pressable
        onPress={onToggleVisible}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
        style={{ paddingRight: spacing.lg }}
      >
        <Feather
          name={visible ? "eye" : "eye-off"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}
