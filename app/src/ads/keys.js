import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Ringcage AdMob unit IDs.
 * Debug / Metro → Google TestIds. Release → live units.
 * App ID lives in app.json (needs a native rebuild when changed).
 */
const LIVE = {
  banner: 'ca-app-pub-1690469075436631/7760846531',
  rewarded: 'ca-app-pub-1690469075436631/4176076316',
  /** Extra rewarded (bonus / double coins later) */
  rewardedBonus: 'ca-app-pub-1690469075436631/6419844708',
  interstitial: 'ca-app-pub-1690469075436631/6447764863',
  rewardedInterstitial: 'ca-app-pub-1690469075436631/3985253056',
  native: 'ca-app-pub-1690469075436631/1549912978',
  appOpen: 'ca-app-pub-1690469075436631/3793681361',
};

const pick = (real, test) => (__DEV__ || !real ? test : real);

export const AD_UNIT = {
  banner: pick(LIVE.banner, TestIds.BANNER),
  rewarded: pick(LIVE.rewarded, TestIds.REWARDED),
  rewardedBonus: pick(LIVE.rewardedBonus, TestIds.REWARDED),
  interstitial: pick(LIVE.interstitial, TestIds.INTERSTITIAL),
  rewardedInterstitial: pick(LIVE.rewardedInterstitial, TestIds.REWARDED_INTERSTITIAL),
  native: pick(LIVE.native, TestIds.NATIVE),
  appOpen: pick(LIVE.appOpen, TestIds.APP_OPEN),
};

export const ADMOB_APP_ID = 'ca-app-pub-1690469075436631~1114798705';
