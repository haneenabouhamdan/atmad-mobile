import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { authColumnStyle } from "./authLayout";
import { AuthBackButton } from "./AuthBackButton";
import { EmailAuthForm, type EmailAuthMode } from "./EmailAuthForm";
import { colors, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "EmailPassword">;
type Rt = RouteProp<AuthStackParamList, "EmailPassword">;

/** Deep link / fallback route — primary email flow lives on Welcome */
export function EmailPasswordScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const initialMode: EmailAuthMode =
    route.params?.mode ?? "signup";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackButton onPress={() => nav.navigate("Welcome")} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: spacing.xl,
            flexGrow: 1,
            paddingBottom: spacing.xxxl,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authColumnStyle}>
            <EmailAuthForm initialMode={initialMode} variant="standalone" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
