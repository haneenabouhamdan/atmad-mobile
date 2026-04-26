import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useAuth } from "../auth/AuthProvider";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { OnboardingScreen } from "../screens/auth/OnboardingScreen";
import { colors } from "../theme/tokens";
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
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <AuthStack />
      ) : !profile?.full_name ? (
        <OnboardingScreen />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
