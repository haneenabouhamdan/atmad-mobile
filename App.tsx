import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts as usePlayfair, PlayfairDisplay_500Medium, PlayfairDisplay_500Medium_Italic } from "@expo-google-fonts/playfair-display";
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";

import { AuthProvider } from "./src/auth/AuthProvider";
import { EngagementSync } from "./src/components/EngagementSync";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ToastProvider } from "./src/components/Toast";
import { colors } from "./src/theme/tokens";

export default function App() {
  const [fontsLoaded] = usePlayfair({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <EngagementSync />
            <RootNavigator />
            <StatusBar style="dark" />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
