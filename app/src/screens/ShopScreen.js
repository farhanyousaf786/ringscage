import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, pressFeedback } from '../audio/sounds';
import { COIN_PRICES, SHOP_OFFERS, todayKey } from '../game/economy';
import { ChevronLeft } from '../components/Icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * Coin shop: earn via ad / daily, optional IAP packs (stubbed until billing is wired).
 */
export default function ShopScreen({ progress, onBack, onClaimDaily, onWatchAd, onBuyPack }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [busy, setBusy] = useState(null);
  const dailyTaken = progress.dailyClaimDate === todayKey();

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
          Earn coins free by playing and watching ads. Spend them on hints and extra moves. Paying is
          optional — never required to finish levels.
        </Text>

        <Text style={[styles.section, { color: C.inkSoft }]}>Spend on</Text>
        <View style={styles.spendRow}>
          <SpendChip label="Hint" cost={COIN_PRICES.hint} />
          <SpendChip label="+3 moves" cost={COIN_PRICES.extraMoves} />
          <SpendChip label="Undo" cost={COIN_PRICES.undo} />
        </View>

        <Text style={[styles.section, { color: C.inkSoft, marginTop: 22 }]}>Earn coins</Text>
        {SHOP_OFFERS.filter((o) => o.kind === 'ad' || o.kind === 'daily').map((offer) => {
          const disabled = offer.kind === 'daily' && dailyTaken;
          return (
            <Pressable
              key={offer.id}
              disabled={disabled || !!busy}
              onPress={() =>
                run(offer.id, async () => {
                  if (offer.kind === 'daily') {
                    const ok = await onClaimDaily();
                    if (!ok) Alert.alert('Already claimed', 'Come back tomorrow for more nest coins.');
                    else playSound('twinkle');
                  } else {
                    // Stub rewarded ad — replace with AdMob / AppLovin rewarded when ready.
                    await new Promise((r) => setTimeout(r, 900));
                    await onWatchAd();
                    playSound('happy');
                    Alert.alert('Thanks!', `+${offer.coins} coins added.`);
                  }
                })
              }
              style={[
                styles.card,
                { backgroundColor: C.card, borderColor: C.panelBorder },
                disabled && styles.cardOff,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.ink }]}>{offer.title}</Text>
                <Text style={[styles.cardSub, { color: C.inkSoft }]}>
                  {disabled ? 'Come back tomorrow' : offer.sub}
                </Text>
              </View>
              {busy === offer.id ? (
                <ActivityIndicator color={C.accent} />
              ) : (
                <View style={[styles.badge, { backgroundColor: C.good }]}>
                  <Text style={styles.badgeText}>{offer.badge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <Text style={[styles.section, { color: C.inkSoft, marginTop: 22 }]}>Coin packs</Text>
        <Text style={[styles.packNote, { color: C.inkSoft }]}>
          Real-money packs (coming soon). Ads stay free forever.
        </Text>
        {SHOP_OFFERS.filter((o) => o.kind === 'iap').map((offer) => (
          <Pressable
            key={offer.id}
            onPress={() =>
              run(offer.id, async () => {
                Alert.alert(
                  'Coming soon',
                  `${offer.title} (${offer.priceLabel}) will use the App Store / Play Store. For now, earn coins by winning and watching ads.`
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
            <View style={[styles.badge, { backgroundColor: C.inkFaint }]}>
              <Text style={styles.badgeText}>{offer.badge}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
