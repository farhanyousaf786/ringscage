import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ringcage.progress.v1';

export const DEFAULT_PROGRESS = {
  unlocked: 1,
  stars: {},
  coins: 80, // starter nest gift so shop/hints feel usable
  seeds: 0, // legacy alias — migrated into coins
  seenStory: {},
  seenOpening: false,
  /** First-run: privacy + age + short story before home */
  onboardingDone: false,
  privacyAccepted: false,
  ageBand: null, // 'under13' | '13to17' | '18plus'
  theme: 'light', // 'light' | 'dark'
  /** Audio / haptics — classic game options */
  sfxOn: true,
  musicOn: true,
  vibrateOn: true,
  dailyClaimDate: null,
  /** Rewarded video daily counter */
  videoAdsDate: null,
  videoAdsCount: 0,
  /** Remove-ads purchase (Play / RevenueCat later) */
  noAds: false,
  /** Last day the home remove-ads popup was shown (once per day) */
  removeAdsPromptDate: null,
  /** Cold starts counted — app-open ads only after the first launch */
  appLaunchCount: 0,
};

export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    const coins =
      parsed.coins != null
        ? parsed.coins
        : (parsed.seeds || 0) > 0
          ? parsed.seeds
          : DEFAULT_PROGRESS.coins;
    const merged = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      coins,
      stars: parsed.stars || {},
      seenStory: parsed.seenStory || {},
    };
    // Returning players skip the new first-run gate
    if (
      !merged.onboardingDone &&
      (merged.seenOpening || merged.unlocked > 1 || merged.privacyAccepted)
    ) {
      merged.onboardingDone = true;
      merged.privacyAccepted = true;
    }
    return merged;
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveProgress(progress) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}
