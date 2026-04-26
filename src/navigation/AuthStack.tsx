import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { PhoneEntryScreen } from "../screens/auth/PhoneEntryScreen";
import { OtpVerifyScreen } from "../screens/auth/OtpVerifyScreen";
import { OnboardingScreen } from "../screens/auth/OnboardingScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"     component={SplashScreen}     />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerify"  component={OtpVerifyScreen}  />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
