/**
 * Soft currency = Coins (✦).
 *
 * Free forever to play. Earn via wins / daily / rewarded ads.
 * Optional coin bags + remove-ads (IAP → Play Console + RevenueCat later).
 */

export const COIN_PRICES = {
  hint: 25,
  hammer: 50,
  extraMoves: 40,
  undo: 30,
};

export const COIN_REWARDS = {
  /** Per clear: 1★=50, 2★=60, 3★=70 */
  win1Star: 50,
  win2Star: 60,
  win3Star: 70,
  dailyNest: 50,
  watchAd: 50,
};

/** Rewarded video caps (Break Buddies–style). */
export const VIDEO_COINS = COIN_REWARDS.watchAd;
export const VIDEO_COINS_PER_DAY = 5;

/** One-time remove ads · non-consumable in Play / RevenueCat later. */
export const REMOVE_ADS = {
  id: 'remove_ads',
  kind: 'noAds',
  title: 'Remove all ads',
  sub: 'No banners · no win ads · forever',
  priceLabel: '$1.99',
  badge: 'NO ADS',
};

/**
 * Coin bags — reasonable value curve around 1000 / $0.99.
 * Product ids match future Play Console / RevenueCat consumables.
 */
export const COIN_PACKS = [
  {
    id: 'coins_1000',
    kind: 'iap',
    title: 'Seed bag',
    sub: '1,000 coins',
    coins: 1000,
    priceLabel: '$0.99',
    badge: 'STARTER',
  },
  {
    id: 'coins_2800',
    kind: 'iap',
    title: 'Nest bag',
    sub: '2,800 coins',
    coins: 2800,
    priceLabel: '$2.99',
    badge: 'POPULAR',
  },
  {
    id: 'coins_6000',
    kind: 'iap',
    title: 'Flock chest',
    sub: '6,000 coins',
    coins: 6000,
    priceLabel: '$4.99',
    badge: 'BEST VALUE',
  },
  {
    id: 'coins_15000',
    kind: 'iap',
    title: 'Mama vault',
    sub: '15,000 coins',
    coins: 15000,
    priceLabel: '$9.99',
    badge: 'MEGA',
  },
];

export const SHOP_OFFERS = [
  {
    id: 'ad',
    kind: 'ad',
    title: 'Watch an ad',
    sub: `+${VIDEO_COINS} coins · short ad video`,
    coins: VIDEO_COINS,
    badge: 'WATCH AD',
  },
  {
    id: 'daily',
    kind: 'daily',
    title: 'Daily nest gift',
    sub: `+${COIN_REWARDS.dailyNest} coins · once a day`,
    coins: COIN_REWARDS.dailyNest,
    badge: 'DAILY',
  },
  ...COIN_PACKS,
];

/** Coins earned for clearing a stage (by stars this run). */
export function winCoinReward(stars) {
  if (stars >= 3) return COIN_REWARDS.win3Star;
  if (stars >= 2) return COIN_REWARDS.win2Star;
  return COIN_REWARDS.win1Star;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** How many rewarded videos remain today. */
export function videosLeft(progress) {
  const key = todayKey();
  if (progress.videoAdsDate !== key) return VIDEO_COINS_PER_DAY;
  return Math.max(0, VIDEO_COINS_PER_DAY - (progress.videoAdsCount || 0));
}
