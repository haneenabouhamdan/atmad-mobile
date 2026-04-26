/**
 * Biometric (Face ID / Touch ID) helpers.
 * Used as a "fast path" to unlock an existing Supabase session.
 */
import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricSupported(): Promise<{
  supported: boolean;
  enrolled: boolean;
  type: "face" | "fingerprint" | "iris" | "none";
}> {
  const supported = await LocalAuthentication.hasHardwareAsync();
  const enrolled  = await LocalAuthentication.isEnrolledAsync();
  const types     = await LocalAuthentication.supportedAuthenticationTypesAsync();
  let type: "face" | "fingerprint" | "iris" | "none" = "none";
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = "face";
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    type = "fingerprint";
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    type = "iris";
  }
  return { supported, enrolled, type };
}

export async function authenticateWithBiometrics(
  promptMessage = "Unlock ATMAD",
): Promise<{ success: boolean; error?: string }> {
  const { supported, enrolled } = await isBiometricSupported();
  if (!supported || !enrolled) {
    return { success: false, error: "Biometrics not available" };
  }
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: false,
  });
  return res.success
    ? { success: true }
    : { success: false, error: res.error ?? "Authentication failed" };
}
