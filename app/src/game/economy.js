/**
 * Soft currency = Coins (✦).
 *
 * Recommended monetization for Ringcage (cute / kid-friendly):
 * 1. FREE play forever — no paywall on levels
 * 2. Earn coins by winning + optional rewarded ads (watch → coins)
 * 3. Spend coins on helpers (hint, +moves)
 * 4. OPTIONAL later: real-money coin packs (IAP) — never required to finish the game
 *
 * Ads = opt-in reward. IAP = optional shortcut. Don’t force either.
 */

export const COIN_PRICES = {
  hint: 25,
  extraMoves: 40,
  undo: 30,
};

export const COIN_REWARDS = {
  winBase: 10,
  perStar: 5,
  bossBonus: 25,
  dailyNest: 50,
  watchAd: 40,
};

/** Shop rows — ads are free; packs are IAP placeholders until StoreKit/Play Billing is wired. */
export const SHOP_OFFERS = [
  {
    id: 'ad',
    kind: 'ad',
    title: 'Watch & earn',
    sub: `+${COIN_REWARDS.watchAd} coins · short ad`,
    coins: COIN_REWARDS.watchAd,
    badge: 'FREE',
  },
  {
    id: 'daily',
    kind: 'daily',
    title: 'Daily nest gift',
    sub: `+${COIN_REWARDS.dailyNest} coins · once a day`,
    coins: COIN_REWARDS.dailyNest,
    badge: 'DAILY',
  },
  {
    id: 'pack_s',
    kind: 'iap',
    title: 'Seed pouch',
    sub: '200 coins',
    coins: 200,
    priceLabel: '$0.99',
    badge: 'SOON',
  },
  {
    id: 'pack_m',
    kind: 'iap',
    title: 'Nest chest',
    sub: '600 coins',
    coins: 600,
    priceLabel: '$2.99',
    badge: 'SOON',
  },
  {
    id: 'pack_l',
    kind: 'iap',
    title: 'Flock vault',
    sub: '1500 coins',
    coins: 1500,
    priceLabel: '$4.99',
    badge: 'SOON',
  },
];

export function winCoinReward(stars, isBoss) {
  return (
    COIN_REWARDS.winBase +
    stars * COIN_REWARDS.perStar +
    (isBoss ? COIN_REWARDS.bossBonus : 0)
  );
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
