import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
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
import { ArticleScreen } from "../screens/issue/ArticleScreen";
import { WalletScreen } from "../screens/wallet/WalletScreen";
import { DealActivationScreen } from "../screens/wallet/DealActivationScreen";
import { CouponVaultScreen } from "../screens/vault/CouponVaultScreen";
import { DiscoveryScreen } from "../screens/explore/DiscoveryScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { QRScannerScreen } from "../screens/profile/QRScannerScreen";
import { BarcodeScreen } from "../screens/profile/BarcodeScreen";
import { InStoreScreen } from "../screens/profile/InStoreScreen";
import { CompareScreen } from "../screens/profile/CompareScreen";
import { ReviewsScreen } from "../screens/profile/ReviewsScreen";
import { MindLoungeScreen } from "../screens/profile/MindLoungeScreen";
import { IdentityVaultScreen } from "../screens/profile/IdentityVaultScreen";
import { NotificationsScreen } from "../screens/profile/NotificationsScreen";
import { ReferralScreen } from "../screens/profile/ReferralScreen";
import { PINScreen } from "../screens/profile/PINScreen";
import { MyLeadsScreen } from "../screens/profile/MyLeadsScreen";
import { ToolsHubScreen } from "../screens/profile/ToolsHubScreen";
import { ListingDetailScreen } from "../screens/listing/ListingDetail";
import { CategoryListingsScreen } from "../screens/listing/CategoryListings";
import { BrandCampaignScreen } from "../screens/explore/BrandCampaignScreen";
import { InfluencerFeatureScreen } from "../screens/explore/InfluencerFeatureScreen";
import { LifestyleScreen } from "../screens/explore/LifestyleScreen";
import { AutomotiveCampaignScreen } from "../screens/explore/AutomotiveCampaignScreen";
import { colors, fonts } from "../theme/tokens";
import { SignupPhoneReminder } from "./SignupPhoneReminder";
import { PhoneEntryScreen } from "../screens/auth/PhoneEntryScreen";
import { OtpVerifyScreen } from "../screens/auth/OtpVerifyScreen";

// ── Per-tab stacks ─────────────────────────────────────────────────────
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home"          component={HomeScreen} />
      <HomeStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStackNav.Screen name="Identity"      component={IdentityVaultScreen} />
    </HomeStackNav.Navigator>
  );
}

const IssueStackNav = createNativeStackNavigator<IssueStackParamList>();
function IssueStack() {
  return (
    <IssueStackNav.Navigator screenOptions={{ headerShown: false }} initialRouteName="Cover">
      <IssueStackNav.Screen name="Cover"   component={CoverScreen} />
      <IssueStackNav.Screen name="Feed"    component={MagazineFeedScreen} />
      <IssueStackNav.Screen name="Article" component={ArticleScreen} />
      <IssueStackNav.Screen name="Listing" component={ListingDetailScreen} />
    </IssueStackNav.Navigator>
  );
}

const ExploreStackNav = createNativeStackNavigator<ExploreStackParamList>();
function ExploreStack() {
  return (
    <ExploreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStackNav.Screen name="Discovery"        component={DiscoveryScreen} />
      <ExploreStackNav.Screen name="Brand"            component={BrandCampaignScreen} />
      <ExploreStackNav.Screen name="Influencer"       component={InfluencerFeatureScreen} />
      <ExploreStackNav.Screen name="Lifestyle"        component={LifestyleScreen} />
      <ExploreStackNav.Screen name="Automotive"       component={AutomotiveCampaignScreen} />
      <ExploreStackNav.Screen name="CategoryListings" component={CategoryListingsScreen} />
      <ExploreStackNav.Screen name="Listing"          component={ListingDetailScreen} />
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
      <WalletStackNav.Screen name="InStore" component={InStoreScreen} />
    </WalletStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile"       component={ProfileScreen} />
      <ProfileStackNav.Screen name="EditProfile"   component={EditProfileScreen} />
      <ProfileStackNav.Screen name="QR"            component={QRScannerScreen} />
      <ProfileStackNav.Screen name="Barcode"       component={BarcodeScreen} />
      <ProfileStackNav.Screen name="InStore"       component={InStoreScreen} />
      <ProfileStackNav.Screen name="Compare"       component={CompareScreen} />
      <ProfileStackNav.Screen name="Reviews"       component={ReviewsScreen} />
      <ProfileStackNav.Screen name="MindLounge"    component={MindLoungeScreen} />
      <ProfileStackNav.Screen name="Identity"      component={IdentityVaultScreen} />
      <ProfileStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStackNav.Screen name="Referral"      component={ReferralScreen} />
      <ProfileStackNav.Screen name="PIN"           component={PINScreen} />
      <ProfileStackNav.Screen name="MyLeads"       component={MyLeadsScreen} />
      <ProfileStackNav.Screen name="ToolsHub"      component={ToolsHubScreen} />
      <ProfileStackNav.Screen name="PhoneEntry"    component={PhoneEntryScreen} />
      <ProfileStackNav.Screen name="OtpVerify"       component={OtpVerifyScreen} />
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

type FeatherName = React.ComponentProps<typeof Feather>["name"];
const TAB_ICONS: Record<keyof MainTabParamList, FeatherName> = {
  IssueTab:   "book-open",
  ExploreTab: "compass",
  HomeTab:    "home",
  WalletTab:  "credit-card",
  ProfileTab: "user",
};

// Root screen of each nested stack — used so a tab press always lands on
// its root, instead of the last sub-screen the user was on.
const TAB_ROOT: Record<keyof MainTabParamList, string> = {
  IssueTab:   "Cover",
  ExploreTab: "Discovery",
  HomeTab:    "Home",
  WalletTab:  "Wallet",
  ProfileTab: "Profile",
};

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <>
      <SignupPhoneReminder />
    <Tabs.Navigator
      initialRouteName="HomeTab"
      screenListeners={({ navigation, route }) => ({
        tabPress: () => {
          const root = TAB_ROOT[route.name as keyof MainTabParamList];
          if (root) {
            // The strongly-typed navigate signature can't narrow the union of
            // tab names to its matching params type, so we go through the
            // looser dispatch API instead. Same end result.
            (navigation as unknown as { navigate: (n: string, p?: object) => void })
              .navigate(route.name, { screen: root });
          }
        },
      })}
      screenOptions={({ route }) => {
        const isHome = route.name === "HomeTab";
        const iconName = TAB_ICONS[route.name as keyof MainTabParamList];
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
                width: 48, height: 48, borderRadius: 999,
                alignItems: "center", justifyContent: "center",
                backgroundColor: focused ? colors.foreground : colors.muted,
                borderWidth: 1,
                borderColor: focused ? colors.foreground : colors.border,
                marginTop: -12,
                shadowColor: "#000",
                shadowOpacity: focused ? 0.18 : 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: focused ? 4 : 1,
              }}>
                <Feather
                  name={iconName}
                  size={20}
                  color={focused ? "#FFFFFF" : colors.textTertiary}
                />
              </View>
            ) : (
              <Feather
                name={iconName}
                size={20}
                color={focused ? colors.foreground : colors.textTertiary}
                style={{ marginBottom: 2 }}
              />
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
    </>
  );
}
