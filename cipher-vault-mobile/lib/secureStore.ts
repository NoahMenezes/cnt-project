import * as SecureStore from "expo-secure-store";

const PRIVATE_KEY_KEY = "cv_rsa_private_key";
const DEVICE_ID_KEY = "cv_device_id";
const DEVICE_NAME_KEY = "cv_device_name";

export async function savePrivateKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(PRIVATE_KEY_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getPrivateKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
}

export async function deletePrivateKey(): Promise<void> {
  await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
}

export async function saveDeviceId(id: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
}

export async function getDeviceId(): Promise<string | null> {
  return await SecureStore.getItemAsync(DEVICE_ID_KEY);
}

export async function saveDeviceName(name: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_NAME_KEY, name);
}

export async function getDeviceName(): Promise<string | null> {
  return await SecureStore.getItemAsync(DEVICE_NAME_KEY);
}
