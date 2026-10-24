import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner, AdRect, showRewarded, useAds } from '../ads/ads';
import { playSound, pressFeedback } from '../audio/sounds';
import {
  COIN_PACKS,
  COIN_PRICES,
  COIN_REWARDS,
  REMOVE_ADS,
  VIDEO_COINS,
  todayKey,
  videosLeft,
} from '../game/economy';
import { ChevronLeft } from '../components/Icons';
import RemoveAdsSheet from '../components/RemoveAdsSheet';
import { useTheme } from '../theme/ThemeContext';

/**
 * Coin nest — earn (ad / daily) + remove ads + coin bags (RevenueCat / Play later).
 */
export default function ShopScreen({
  progress,
  onBack,
  onClaimDaily,
  onWatchAd,
  onBuyPack,
  onBuyRemoveAds,
}) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const { rewardedReady } = useAds();
  const [busy, setBusy] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const dailyTaken = progress.dailyClaimDate === todayKey();
  const left = videosLeft(progress);

  const run = async (id, fn) => {
    if (busy) return;
    setBusy(id);
    pressFeedback();
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            pressFeedback();
            onBack();
          }}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <ChevronLeft size={22} color={C.ink} />
        </Pressable>
        <Text style={[styles.title, { color: C.ink }]}>Coin nest</Text>
        <View style={[styles.coinPill, { backgroundColor: C.card, borderColor: C.panelBorder }]}>
          <Text style={[styles.coinPillText, { color: C.ink }]}>✦ {progress.coins ?? 0}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lead, { color: C.inkSoft }]}>
          Earn coins by winning levels, claiming your daily nest, or watching a short ad. Coin bags
          are optional — never required to finish levels.
        </Text>

        <Text style={[styles.section, { color: C.inkSoft }]}>Spend on</Text>
        <View style={styles.spendRow}>
          <SpendChip label="Hint" cost={COIN_PRICES.hint} />
          <SpendChip label="Hammer" cost={COIN_PRICES.hammer} />
          <SpendChip label="+3 moves" cost={COIN_PRICES.extraMoves} />
        </View>

        <Text style={[styles.section, { color: C.inkSoft, marginTop: 22 }]}>Earn coins</Text>

        <Pressable
          disabled={left <= 0 || !!busy}
          onPress={() =>
            run('ad', async () => {
              if (left <= 0) return;
              if (!rewardedReady) {
                Alert.alert('Almost ready', 'Ad is still loading — try again in a moment.');
                return;
              }
              const ok = await showRewarded();
              if (!ok) {
                Alert.alert('No reward', 'Watch the whole ad to earn coins.');
                return;
              }
              await onWatchAd();
              playSound('happy');
              Alert.alert('Thanks!', `+${VIDEO_COINS} coins for watching the ad.`);
            })
          }
          style={[
            styles.card,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            left <= 0 && styles.cardOff,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: C.ink }]}>Watch an ad</Text>
            <Text style={[styles.cardSub, { color: C.inkSoft }]}>
              {left <= 0
                ? 'Come back tomorrow'
                : `+${VIDEO_COINS} coins · ${left} ads left today`}
            </Text>
          </View>
          {busy === 'ad' ? (
            <ActivityIndicator color={C.accent} />
          ) : (
            <View style={[styles.badge, { backgroundColor: C.accent }]}>
              <Text style={styles.badgeText}>WATCH AD</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          disabled={dailyTaken || !!busy}
          onPress={() =>
            run('daily', async () => {
              const ok = await onClaimDaily();
              if (!ok) Alert.alert('Already claimed', 'Come back tomorrow for more nest coins.');
              else {
                playSound('twinkle');
                Alert.alert('Nest gift!', `+${COIN_REWARDS.dailyNest} coins.`);
              }
            })
          }
          style={[
            styles.card,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            dailyTaken && styles.cardOff,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: C.ink }]}>Daily nest gift</Text>
            <Text style={[styles.cardSub, { color: C.inkSoft }]}>
              {dailyTaken
                ? 'Come back tomorrow'
                : `+${COIN_REWARDS.dailyNest} coins · once a day`}
            </Text>
          </View>
          {busy === 'daily' ? (
            <ActivityIndicator color={C.accent} />
          ) : (
            <View style={[styles.badge, { backgroundColor: C.good }]}>
              <Text style={styles.badgeText}>DAILY</Text>
            </View>
          )}
        </Pressable>

        <Text style={[styles.section, { color: C.inkSoft, marginTop: 22 }]}>No ads</Text>
        <Pressable
          onPress={() => {
            pressFeedback();
            setRemoveOpen(true);
          }}
          style={[styles.card, { backgroundColor: C.card, borderColor: C.gold }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: C.ink }]}>
              {progress.noAds ? 'Ads removed' : REMOVE_ADS.title}
            </Text>
            <Text style={[styles.cardSub, { color: C.inkSoft }]}>
              {progress.noAds
                ? 'Thanks for supporting the flock'
                : `${REMOVE_ADS.sub} · ${REMOVE_ADS.priceLabel}`}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: C.gold }]}>
            <Text style={[styles.badgeText, { color: '#1a1520' }]}>
              {progress.noAds ? 'OWNED' : REMOVE_ADS.badge}
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.section, { color: C.inkSoft, marginTop: 22 }]}>Coin bags</Text>
        <Text style={[styles.packNote, { color: C.inkSoft }]}>
          Optional purchases. Prices finalize when Play Billing / RevenueCat is attached.
        </Text>
        {COIN_PACKS.map((offer) => (
          <Pressable
            key={offer.id}
            onPress={() =>
              run(offer.id, async () => {
                Alert.alert(
                  'Coming soon',
                  `${offer.title} (${offer.priceLabel} · ✦ ${offer.coins.toLocaleString()}) will use Google Play. For now, earn coins free with videos.`
                );
                onBuyPack?.(offer.id);
              })
            }
            style={[styles.card, { backgroundColor: C.card, borderColor: C.panelBorder }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: C.ink }]}>{offer.title}</Text>
              <Text style={[styles.cardSub, { color: C.inkSoft }]}>
                {offer.sub} · {offer.priceLabel}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.accent }]}>
              <Text style={styles.badgeText}>{offer.badge}</Text>
            </View>
          </Pressable>
        ))}

        <AdRect noAds={!!progress.noAds} />
      </ScrollView>

      <AdBanner noAds={!!progress.noAds} />

      {removeOpen ? (
        <RemoveAdsSheet
          owned={!!progress.noAds}
          onClose={() => setRemoveOpen(false)}
          onBuy={async () => {
            const ok = await onBuyRemoveAds?.();
            if (ok) setRemoveOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

function SpendChip({ label, cost }) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
      <Text style={[styles.chipLabel, { color: C.ink }]}>{label}</Text>
      <Text style={[styles.chipCost, { color: C.accent }]}>✦ {cost}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 4,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '900' },
  coinPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  coinPillText: { fontWeight: '900', fontSize: 14 },
  lead: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 18,
  },
  section: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  spendRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 13, fontWeight: '900' },
  chipCost: { marginTop: 4, fontSize: 12, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  cardOff: { opacity: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardSub: { marginTop: 3, fontSize: 13, fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  packNote: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: -4,
  },
});
