import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { showRewarded, useAds } from '../ads/ads';
import { playSound, pressFeedback } from '../audio/sounds';
import { VIDEO_COINS, videosLeft } from '../game/economy';
import { Coin, CoinBag, Play } from './Icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * Polished “need more coins” sheet — watch ad (+50) or buy bags.
 */
export default function NeedCoinsSheet({
  visible,
  itemLabel = 'This',
  cost = 25,
  progress,
  onClose,
  onEarned,
  onBuyCoins,
}) {
  const { colors: C } = useTheme();
  const { rewardedReady } = useAds();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('need'); // need | earned | failed
  const have = progress?.coins ?? 0;
  const left = videosLeft(progress || {});
  const short = Math.max(0, cost - have);

  useEffect(() => {
    if (visible) {
      setBusy(false);
      setPhase('need');
    }
  }, [visible, itemLabel, cost]);

  if (!visible) return null;

  const watch = async () => {
    if (busy || left <= 0) return;
    pressFeedback();
    setBusy(true);
    setPhase('need');
    try {
      if (!rewardedReady) {
        setPhase('failed');
        return;
      }
      const ok = await showRewarded();
      if (!ok) {
        setPhase('failed');
        return;
      }
      onEarned?.(VIDEO_COINS);
      playSound('happy');
      setPhase('earned');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <View style={[styles.iconGlow, { backgroundColor: C.gold + '33' }]}>
            <Coin size={36} />
          </View>

          {phase === 'earned' ? (
            <>
              <Text style={[styles.title, { color: C.ink }]}>+{VIDEO_COINS} coins!</Text>
              <Text style={[styles.sub, { color: C.inkSoft }]}>
                Nice — try {itemLabel} again with your new balance.
              </Text>
              <Pressable
                onPress={() => {
                  pressFeedback();
                  onClose?.();
                }}
                style={[styles.btn, { backgroundColor: C.good }]}
              >
                <Text style={styles.btnText}>Continue</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.eyebrow, { color: C.warn }]}>NEED MORE COINS</Text>
              <Text style={[styles.title, { color: C.ink }]}>{itemLabel} needs ✦ {cost}</Text>
              <Text style={[styles.sub, { color: C.inkSoft }]}>
                You have ✦ {have}
                {short > 0 ? ` · need ✦ ${short} more` : ''}. Watch a short ad or grab a coin bag.
              </Text>

              <View style={[styles.balance, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
                <Coin size={18} />
                <Text style={[styles.balanceText, { color: C.ink }]}>Balance · {have}</Text>
              </View>

              {phase === 'failed' ? (
                <Text style={[styles.fail, { color: C.warn }]}>
                  {rewardedReady
                    ? 'Watch the whole ad to earn coins.'
                    : 'Ad is still loading — try again in a moment.'}
                </Text>
              ) : null}

              {left > 0 ? (
                <Pressable
                  disabled={busy}
                  onPress={watch}
                  style={[styles.btn, { backgroundColor: C.accent }, busy && styles.btnOff]}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.btnInner}>
                      <View style={styles.btnIcon}>
                        <Play size={16} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.btnText}>Watch ad</Text>
                        <Text style={styles.btnSub}>+{VIDEO_COINS} coins · {left} left today</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Text style={[styles.sub, { color: C.inkSoft, marginBottom: 10 }]}>
                  No more ads today — buy a bag instead.
                </Text>
              )}

              <Pressable
                disabled={busy}
                onPress={() => {
                  pressFeedback();
                  onClose?.();
                  onBuyCoins?.();
                }}
                style={[styles.btn, { backgroundColor: C.gold }]}
              >
                <View style={styles.btnInner}>
                  <View style={[styles.btnIcon, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
                    <CoinBag size={18} color="#1a1520" />
                  </View>
                  <View>
                    <Text style={[styles.btnText, { color: '#1a1520' }]}>Buy coins</Text>
                    <Text style={[styles.btnSub, { color: 'rgba(26,21,32,0.7)' }]}>
                      Coin bags in the nest
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={() => {
                  pressFeedback();
                  onClose?.();
                }}
                style={[styles.ghost, { borderColor: C.panelBorder }]}
              >
                <Text style={[styles.ghostText, { color: C.inkSoft }]}>Maybe later</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
  },
  iconGlow: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sub: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    marginBottom: 14,
  },
  balanceText: { fontSize: 14, fontWeight: '900' },
  fail: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  btnOff: { opacity: 0.7 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginTop: 1 },
  ghost: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  ghostText: { fontSize: 14, fontWeight: '800' },
});
