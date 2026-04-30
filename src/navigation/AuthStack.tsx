import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { EmailPasswordScreen } from "../screens/auth/EmailPasswordScreen";
import { env } from "../lib/env";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName={env.AUTH_INITIAL_ROUTE}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash"        component={SplashScreen}        />
      <Stack.Screen name="Welcome"       component={WelcomeScreen}       />
      <Stack.Screen name="EmailPassword" component={EmailPasswordScreen} />
    </Stack.Navigator>
  );
}
