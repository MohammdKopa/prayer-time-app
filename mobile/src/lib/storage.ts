import AsyncStorage from "@react-native-async-storage/async-storage";

// Small key/value settings only — language, chosen city, notification toggle.
// Every read and write is wrapped: storage can fail on a device with no space
// left or a corrupted store, and a prayer clock must still show the times when
// it does. A failed read returns null and the caller falls back to a default.

const PREFIX = "prayer:";

export async function loadSetting(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function saveSetting(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, value);
  } catch {
    // Losing a preference is survivable; crashing over it is not.
  }
}

export async function loadJSON<T>(key: string): Promise<T | null> {
  const raw = await loadSetting(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await saveSetting(key, JSON.stringify(value));
  } catch {
    // as above
  }
}
