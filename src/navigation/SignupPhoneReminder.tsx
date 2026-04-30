import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import type { MainTabParamList } from "./types";
import { useAuth } from "../auth/AuthProvider";

const AUTO_PROMPT_EDIT_PROFILE_KEY = "atmad.auto_edit_profile_phone_reminder.v1";
const PROMPT_DISMISSED_KEY = "atmad.phone_reminder_banner_dismissed.v1";

/** After email/OAuth sign-up, opens Edit Profile once so the member can add + verify a mobile number */
export function SignupPhoneReminder() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { profile } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function maybeOpen() {
      if (started.current) return;
      if (!profile?.id || profile.phone_e164) return;

      try {
        const dismissed = await SecureStore.getItemAsync(PROMPT_DISMISSED_KEY);
        if (cancelled || dismissed === "1") return;
        const already = await SecureStore.getItemAsync(AUTO_PROMPT_EDIT_PROFILE_KEY);
        if (cancelled || already === "1") return;
      } catch {
        return;
      }

      started.current = true;

      try {
        await SecureStore.setItemAsync(AUTO_PROMPT_EDIT_PROFILE_KEY, "1");
      } catch {
        //
      }

      navigation.navigate("ProfileTab", {
        screen: "EditProfile",
        params: { openPhoneReminder: true },
      });
    }

    maybeOpen();
    return () => {
      cancelled = true;
    };
  }, [navigation, profile?.id, profile?.phone_e164]);

  return null;
}

export { PROMPT_DISMISSED_KEY };
