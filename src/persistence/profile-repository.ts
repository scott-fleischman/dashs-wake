import { createProfile, type PlayerProfile } from "../core/profile";

export const PROFILE_STORAGE_KEY = "dashs-wake-profile-v1";

interface StoredRecord {
  version: 1;
  profile: PlayerProfile;
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return createProfile();
    const record = JSON.parse(raw) as StoredRecord;
    if (record.version !== 1) return createProfile();
    return record.profile;
  } catch {
    return createProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  const record: StoredRecord = { version: 1, profile };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(record));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}
