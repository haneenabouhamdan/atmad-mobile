import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  EmailPassword: { mode?: "signup" | "login" };
};

export type MainTabParamList = {
  IssueTab:   NavigatorScreenParams<IssueStackParamList>;
  ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
  HomeTab:    NavigatorScreenParams<HomeStackParamList>;
  WalletTab:  NavigatorScreenParams<WalletStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  Identity: undefined;
};
export type IssueStackParamList = {
  Cover: undefined;
  Feed:  undefined;
  Article: { id: string };
  Listing: { id: string };
};
export type ExploreStackParamList = {
  Discovery:  undefined;
  Brand:      { slug: string };
  Influencer: { slug: string };
  Lifestyle:  undefined;
  Automotive: undefined;
  Listing:    { id: string };
  CategoryListings: { category:
    | "fashion" | "tech" | "travel" | "automotive"
    | "finance" | "fnb"  | "beauty" | "realestate" };
};
export type WalletStackParamList = {
  Wallet:  undefined;
  Vault:   undefined;
  Deal:    { id: string };
  InStore: undefined;
};
export type ProfileStackParamList = {
  Profile:       undefined;
  /** After email/OAuth signup, `openPhoneReminder` opens the add-phone banner once. */
  EditProfile:   { openPhoneReminder?: boolean } | undefined;
  PhoneEntry:    { mode?: "signup" | "login" };
  OtpVerify:     { phoneE164: string; channel: "sms" | "whatsapp"; email?: string };
  QR:            undefined;
  Barcode:       undefined;
  InStore:       undefined;
  Compare:       undefined;
  Reviews:       undefined;
  MindLounge:    undefined;
  Identity:      undefined;
  Notifications: undefined;
  Referral:      undefined;
  PIN:           undefined;
  MyLeads:       undefined;
  ToolsHub:      undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
