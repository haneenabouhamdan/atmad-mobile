import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { authColumnStyle } from "./authLayout";
import { EmailAuthForm, type EmailAuthMode } from "./EmailAuthForm";
import { colors, fonts, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "EmailPassword">;
type Rt = RouteProp<AuthStackParamList, "EmailPassword">;

/** Deep link / fallback route — primary email flow lives on Welcome */
export function EmailPasswordScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const initialMode: EmailAuthMode =
    route.params?.mode ?? "signup";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          padding: spacing.xl,
          flexGrow: 1,
          paddingBottom: spacing.xxxl,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={authColumnStyle}>
          <Pressable
            onPress={() => nav.navigate("Welcome")}
            hitSlop={10}
            style={{ alignSelf: "center", marginBottom: spacing.lg }}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 10,
              letterSpacing: 2,
              color: colors.textSecondary,
              textTransform: "uppercase",
            }}>
              Back
            </Text>
          </Pressable>

          <EmailAuthForm initialMode={initialMode} variant="standalone" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
