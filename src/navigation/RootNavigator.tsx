import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useAuth } from "../auth/AuthProvider";
import { isSyntheticEmail } from "../auth/authActions";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { OnboardingScreen } from "../screens/auth/OnboardingScreen";
import { EmailVerifyScreen } from "../screens/auth/EmailVerifyScreen";
import { LockScreen } from "../screens/auth/LockScreen";
import { RegionalPreferencesProvider } from "../regional/RegionalPreferencesContext";
import { colors } from "../theme/tokens";
import { env } from "../lib/env";
import { needsMandatoryOnboarding } from "../auth/onboardingGate";
import { PreviewBrowseStackNavigator } from "./PreviewBrowseStack";
import { previewBrowseNavigationRef } from "./previewBrowseNavigation";
import { ActivityIndicator, View } from "react-native";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card:       colors.background,
    primary:    colors.foreground,
    text:       colors.foreground,
    border:     colors.border,
    notification: colors.foreground,
  },
};

export function RootNavigator() {
  const { loading, session, user, profile, locked } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  // Preview mode: browse MainTabs logged out until a gated action pushes Welcome (sign-up / sign-in).
  // Toggle via EXPO_PUBLIC_PREVIEW_MODE=true in .env.
  if (env.PREVIEW_MODE && !session) {
    return (
      <NavigationContainer theme={navTheme} ref={previewBrowseNavigationRef}>
        <PreviewBrowseStackNavigator />
      </NavigationContainer>
    );
  }

  // After phone OTP we mint synthetic `...@phone.atmad.local` for Auth;
  // normally we block here until EmailVerify swaps in a confirmed email.
  // Skipped while env.SKIP_EMAIL_VERIFICATION (default): set EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION=false to restore.
  const needsEmailVerify =
    !!session &&
    !env.SKIP_EMAIL_VERIFICATION &&
    isSyntheticEmail(user?.email ?? null);

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <AuthStack />
      ) : locked ? (
        <LockScreen />
      ) : needsEmailVerify ? (
        <EmailVerifyScreen />
      ) : needsMandatoryOnboarding(profile) ? (
        <OnboardingScreen />
      ) : (
        <RegionalPreferencesProvider>
          <MainTabs />
        </RegionalPreferencesProvider>
      )}
    </NavigationContainer>
  );
}
