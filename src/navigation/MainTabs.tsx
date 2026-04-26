import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import type {
  ExploreStackParamList,
  HomeStackParamList,
  IssueStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  WalletStackParamList,
} from "./types";
import { HomeScreen } from "../screens/home/HomeScreen";
import { CoverScreen } from "../screens/issue/CoverScreen";
import { MagazineFeedScreen } from "../screens/issue/MagazineFeedScreen";
import { WalletScreen } from "../screens/wallet/WalletScreen";
import { DealActivationScreen } from "../screens/wallet/DealActivationScreen";
import { CouponVaultScreen } from "../screens/vault/CouponVaultScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { makePlaceholder } from "../screens/_Placeholder";
import { colors, fonts } from "../theme/tokens";

// ── Per-tab stacks ─────────────────────────────────────────────────────
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home"          component={HomeScreen} />
      <HomeStackNav.Screen name="Notifications" component={makePlaceholder("Notifications")} />
      <HomeStackNav.Screen name="Identity"      component={makePlaceholder("Identity Vault")} />
    </HomeStackNav.Navigator>
  );
}

const IssueStackNav = createNativeStackNavigator<IssueStackParamList>();
function IssueStack() {
  return (
    <IssueStackNav.Navigator screenOptions={{ headerShown: false }} initialRouteName="Cover">
      <IssueStackNav.Screen name="Cover"   component={CoverScreen} />
      <IssueStackNav.Screen name="Feed"    component={MagazineFeedScreen} />
      <IssueStackNav.Screen name="Article" component={makePlaceholder("Article")} />
    </IssueStackNav.Navigator>
  );
}

const ExploreStackNav = createNativeStackNavigator<ExploreStackParamList>();
function ExploreStack() {
  return (
    <ExploreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStackNav.Screen name="Discovery"  component={makePlaceholder("Discovery", "Curated")} />
      <ExploreStackNav.Screen name="Brand"      component={makePlaceholder("Brand")} />
      <ExploreStackNav.Screen name="Influencer" component={makePlaceholder("Influencer")} />
      <ExploreStackNav.Screen name="Lifestyle"  component={makePlaceholder("Lifestyle")} />
      <ExploreStackNav.Screen name="Automotive" component={makePlaceholder("Automotive")} />
    </ExploreStackNav.Navigator>
  );
}

const WalletStackNav = createNativeStackNavigator<WalletStackParamList>();
function WalletStack() {
  return (
    <WalletStackNav.Navigator screenOptions={{ headerShown: false }}>
      <WalletStackNav.Screen name="Wallet"  component={WalletScreen} />
      <WalletStackNav.Screen name="Vault"   component={CouponVaultScreen} />
      <WalletStackNav.Screen name="Deal"    component={DealActivationScreen} />
      <WalletStackNav.Screen name="InStore" component={makePlaceholder("In-Store")} />
    </WalletStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile"       component={ProfileScreen} />
      <ProfileStackNav.Screen name="QR"            component={makePlaceholder("QR Scanner")} />
      <ProfileStackNav.Screen name="Barcode"       component={makePlaceholder("Barcode Scanner")} />
      <ProfileStackNav.Screen name="InStore"       component={makePlaceholder("In-Store Mode")} />
      <ProfileStackNav.Screen name="Compare"       component={makePlaceholder("Compare")} />
      <ProfileStackNav.Screen name="Reviews"       component={makePlaceholder("Reviews")} />
      <ProfileStackNav.Screen name="MindLounge"    component={makePlaceholder("Mind Lounge")} />
      <ProfileStackNav.Screen name="Identity"      component={makePlaceholder("Identity Vault")} />
      <ProfileStackNav.Screen name="Notifications" component={makePlaceholder("Notifications")} />
      <ProfileStackNav.Screen name="Referral"      component={makePlaceholder("Referral")} />
      <ProfileStackNav.Screen name="PIN"           component={makePlaceholder("PIN & Biometrics")} />
    </ProfileStackNav.Navigator>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────
const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  IssueTab:   "Issue",
  ExploreTab: "Explore",
  HomeTab:    "",
  WalletTab:  "Wallet",
  ProfileTab: "Profile",
};

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => {
        const isHome = route.name === "HomeTab";
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: 72,
            paddingTop: 8,
            paddingBottom: 12,
          },
          tabBarLabel: ({ focused }) =>
            isHome ? null : (
              <Text style={{
                fontFamily: focused ? fonts.bodyMedium : fonts.body,
                fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                color: focused ? colors.foreground : colors.textTertiary,
              }}>
                {TAB_LABELS[route.name as keyof MainTabParamList]}
              </Text>
            ),
          tabBarIcon: ({ focused }) =>
            isHome ? (
              <View style={{
                width: 44, height: 44, borderRadius: 999,
                alignItems: "center", justifyContent: "center",
                backgroundColor: focused ? colors.foreground : colors.muted,
                borderWidth: 1,
                borderColor: focused ? colors.foreground : colors.border,
                marginTop: -10,
              }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: focused ? "#FFFFFF" : colors.textTertiary,
                }} />
              </View>
            ) : (
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                marginBottom: 4,
                backgroundColor: focused ? colors.foreground : "transparent",
              }} />
            ),
        };
      }}
    >
      <Tabs.Screen name="IssueTab"   component={IssueStack} />
      <Tabs.Screen name="ExploreTab" component={ExploreStack} />
      <Tabs.Screen name="HomeTab"    component={HomeStack} />
      <Tabs.Screen name="WalletTab"  component={WalletStack} />
      <Tabs.Screen name="ProfileTab" component={ProfileStack} />
    </Tabs.Navigator>
  );
}
