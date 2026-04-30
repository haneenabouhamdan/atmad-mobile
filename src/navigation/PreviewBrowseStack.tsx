import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { EmailPasswordScreen } from "../screens/auth/EmailPasswordScreen";
import { MainTabs } from "./MainTabs";
import { RegionalPreferencesProvider } from "../regional/RegionalPreferencesContext";
import type { PreviewBrowseStackParamList } from "./previewBrowseNavigation";

const Stack = createNativeStackNavigator<PreviewBrowseStackParamList>();

/** Guest preview: Explore without an account until the user chooses sign up from a gated action. */
export function PreviewBrowseStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Browse"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Browse">
        {() => (
          <RegionalPreferencesProvider>
            <MainTabs />
          </RegionalPreferencesProvider>
        )}
      </Stack.Screen>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="EmailPassword" component={EmailPasswordScreen} />
    </Stack.Navigator>
  );
}
