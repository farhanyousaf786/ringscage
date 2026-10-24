import React, { useEffect, useReducer, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AD_UNIT } from './keys';

const INTERSTITIAL_EVERY = 3;
const INTERSTITIAL_GAP_MS = 120_000;

let mobileAds = null;
let AdsConsent = null;
let AdsConsentPrivacyOptionsRequirementStatus = null;
let AdEventType = null;
let BannerAd = null;
let BannerAdSize = null;
let InterstitialAd = null;
let RewardedAd = null;
let RewardedAdEventType = null;
let AppOpenAd = null;
let MaxAdContentRating = null;
let adsNativeOk = false;

try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line global-require
    const mod = require('react-native-google-mobile-ads');
    mobileAds = mod.default;
    AdsConsent = mod.AdsConsent;
    AdsConsentPrivacyOptionsRequirementStatus = mod.AdsConsentPrivacyOptionsRequirementStatus;
    AdEventType = mod.AdEventType;
    BannerAd = mod.BannerAd;
    BannerAdSize = mod.BannerAdSize;
    InterstitialAd = mod.InterstitialAd;
    RewardedAd = mod.RewardedAd;
    RewardedAdEventType = mod.RewardedAdEventType;
    AppOpenAd = mod.AppOpenAd;
    MaxAdContentRating = mod.MaxAdContentRating;
    adsNativeOk = true;
  }
} catch {
  adsNativeOk = false;
}

const listeners = new Set();
const state = { ready: false, rewardedReady: false, privacyOptions: false };

function emit() {
  listeners.forEach((fn) => fn({ ...state }));
}

function setState(partial) {
  Object.assign(state, partial);
  emit();
}

export function useAds() {
  const [, bump] = useReducer((n) => n + 1, 0);
  const [snap, setSnap] = useState(() => ({ ...state }));
  useEffect(() => {
    const fn = (s) => {
      setSnap(s);
      bump();
    };
    listeners.add(fn);
    fn({ ...state });
    return () => listeners.delete(fn);
  }, []);
  return snap;
}

let interstitial = null;
let interstitialLoaded = false;
let rewarded = null;
let appOpen = null;
let appOpenLoaded = false;
let resultsSinceAd = 0;
let lastAdAt = Date.now();
let started = false;

const retry = (load) => setTimeout(load, 30_000);

export async function initAds() {
  if (started || !adsNativeOk) return;
  started = true;
  let canRequestAds = true;
  try {
    const info = await AdsConsent.gatherConsent();
    canRequestAds = info.canRequestAds;
    setState({
      privacyOptions:
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });
  } catch {
    try {
      canRequestAds = (await AdsConsent.getConsentInfo()).canRequestAds;
    } catch {
      canRequestAds = true;
    }
  }
  if (!canRequestAds) return;
  try {
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
    await mobileAds().initialize();
  } catch {
    return;
  }
  setState({ ready: true });
  loadInterstitial();
  loadRewarded();
  loadAppOpen();
}

export async function openPrivacyOptions() {
  if (!adsNativeOk) return;
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {
    /* none */
  }
}

function loadInterstitial() {
  if (!adsNativeOk) return;
  if (!interstitial) {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT.interstitial);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      ad.load();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
      retry(() => ad.load());
    });
    interstitial = ad;
  }
  interstitial.load();
}

function loadRewarded() {
  if (!adsNativeOk) return;
  if (!rewarded) {
    const ad = RewardedAd.createForAdRequest(AD_UNIT.rewarded);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => setState({ rewardedReady: true }));
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      setState({ rewardedReady: false });
      ad.load();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      setState({ rewardedReady: false });
      retry(() => ad.load());
    });
    rewarded = ad;
  }
  rewarded.load();
}

function loadAppOpen() {
  if (!adsNativeOk || !AppOpenAd) return;
  if (!appOpen) {
    const ad = AppOpenAd.createForAdRequest(AD_UNIT.appOpen);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      appOpenLoaded = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenLoaded = false;
      ad.load();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      appOpenLoaded = false;
      retry(() => ad.load());
    });
    appOpen = ad;
  }
  appOpen.load();
}

export function noteResult() {
  resultsSinceAd += 1;
}

export function maybeShowInterstitial(noAds = false) {
  const ad = interstitial;
  if (!state.ready || !ad || !interstitialLoaded || noAds) return Promise.resolve();
  if (resultsSinceAd < INTERSTITIAL_EVERY || Date.now() - lastAdAt < INTERSTITIAL_GAP_MS) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const off = ad.addAdEventListener(AdEventType.CLOSED, () => {
      off();
      resolve();
    });
    resultsSinceAd = 0;
    lastAdAt = Date.now();
    ad.show().catch(() => {
      off();
      resolve();
    });
  });
}

export function showRewarded() {
  const ad = rewarded;
  if (!state.ready || !ad || !state.rewardedReady) return Promise.resolve(false);
  return new Promise((resolve) => {
    let earned = false;
    const offEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      offEarned();
      offClosed();
      lastAdAt = Date.now();
      resolve(earned);
    });
    ad.show().catch(() => {
      offEarned();
      offClosed();
      resolve(false);
    });
  });
}

/** Cold-start / resume app-open (once loaded). */
export function showAppOpen(noAds = false) {
  const ad = appOpen;
  if (!state.ready || !ad || !appOpenLoaded || noAds) return Promise.resolve(false);
  return new Promise((resolve) => {
    const off = ad.addAdEventListener(AdEventType.CLOSED, () => {
      off();
      lastAdAt = Date.now();
      resolve(true);
    });
    ad.show().catch(() => {
      off();
      resolve(false);
    });
  });
}

/** Banner under menus. */
export function AdBanner({ noAds = false }) {
  const { ready } = useAds();
  if (!adsNativeOk || !ready || noAds || !BannerAd) return null;
  return (
    <View style={styles.banner}>
      <BannerAd unitId={AD_UNIT.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

/** Medium rect (shop / win screens). */
export function AdRect({ noAds = false }) {
  const { ready } = useAds();
  if (!adsNativeOk || !ready || noAds || !BannerAd) return null;
  return (
    <View style={styles.rect}>
      <Text style={styles.rectLabel}>ADVERTISEMENT</Text>
      <BannerAd unitId={AD_UNIT.banner} size={BannerAdSize.MEDIUM_RECTANGLE} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', width: '100%' },
  rect: { alignItems: 'center', gap: 4, marginTop: 12 },
  rectLabel: {
    color: 'rgba(0,0,0,0.35)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
});
