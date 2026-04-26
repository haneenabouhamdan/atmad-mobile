/**
 * Secure storage adapter for Supabase Auth.
 * Tokens are stored in iOS Keychain / Android Keystore via expo-secure-store.
 * NEVER fall back to AsyncStorage for tokens.
 */
import * as SecureStore from "expo-secure-store";

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

export const SecureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  },
};
