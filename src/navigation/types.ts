import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Splash: undefined;
  PhoneEntry: undefined;
  OtpVerify:  { phoneE164: string };
  Onboarding: undefined;
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
};
export type ExploreStackParamList = {
  Discovery:  undefined;
  Brand:      { slug: string };
  Influencer: { slug: string };
  Lifestyle:  undefined;
  Automotive: undefined;
};
export type WalletStackParamList = {
  Wallet:  undefined;
  Vault:   undefined;
  Deal:    { id: string };
  InStore: undefined;
};
export type ProfileStackParamList = {
  Profile:       undefined;
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
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
