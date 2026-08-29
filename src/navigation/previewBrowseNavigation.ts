/**
 * Dedicated ref for PREVIEW_MODE guest browsing ({@link PreviewBrowseStackNavigator}).
 * Used to navigate to Welcome / EmailPassword without embedding auth inside tab navigators.
 */
import { createNavigationContainerRef } from "@react-navigation/native";

export type PreviewBrowseStackParamList = {
  Browse: undefined;
  Welcome: undefined;
  EmailPassword: { mode?: "signup" | "login" };
  ForgotPassword: { email?: string };
};

export const previewBrowseNavigationRef =
  createNavigationContainerRef<PreviewBrowseStackParamList>();
