import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { showRewarded, useAds } from '../ads/ads';
import { pressFeedback, playSound } from '../audio/sounds';
import { VIDEO_COINS, VIDEO_COINS_PER_DAY, videosLeft } from '../game/economy';
import { useTheme } from '../theme/ThemeContext';

/**
 * Break Buddies–style free-coins sheet (rewarded video).
 */
export default function EarnCoinsSheet({ progress, onClose, onEarned }) {
  const { colors: C } = useTheme();
  const { rewardedReady } = useAds();
  const [phase, setPhase] = useState('offer'); // offer | watching | earned | skipped
  const left = videosLeft(progress);

  const watch = async () => {
    if (left <= 0 || phase === 'watching') return;
    pressFeedback();
    setPhase('watching');
    const ok = await showRewarded();
    if (ok) {
      onEarned?.(VIDEO_COINS);
      playSound('happy');
      setPhase('earned');
    } else {
      setPhase('skipped');
    }
  };

  const earned = phase === 'earned';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={phase === 'watching' ? undefined : onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <Text style={[styles.title, { color: C.ink }]}>
            {earned ? `+${VIDEO_COINS} coins!` : 'Watch an ad'}
          </Text>
          <Text style={[styles.sub, { color: C.inkSoft }]}>
            {earned
              ? `Balance · ✦ ${progress.coins ?? 0}. Spend them on hints!`
              : phase === 'skipped'
                ? 'Watch the whole ad to get your coins.'
                : `Watch a short ad and get ✦ ${VIDEO_COINS}.`}
          </Text>

          <View style={styles.dots}>
            {Array.from({ length: VIDEO_COINS_PER_DAY }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < VIDEO_COINS_PER_DAY - left ? C.inkFaint : C.good,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.left, { color: C.inkSoft }]}>
            {left === 0
              ? 'All ads used today. Come back tomorrow!'
              : `${left} of ${VIDEO_COINS_PER_DAY} ads left today`}
          </Text>

          {left > 0 && phase !== 'earned' ? (
            <Pressable
              disabled={!rewardedReady || phase === 'watching'}
              onPress={watch}
              style={[
                styles.btn,
                { backgroundColor: C.accent },
                (!rewardedReady || phase === 'watching') && styles.btnOff,
              ]}
            >
              <Text style={styles.btnText}>
                {phase === 'watching'
                  ? 'Playing ad…'
                  : rewardedReady
                    ? 'Watch ad'
                    : 'Ad loading…'}
              </Text>
            </Pressable>
          ) : null}

          {earned && left > 0 ? (
            <Pressable
              disabled={!rewardedReady}
              onPress={watch}
              style={[styles.btn, { backgroundColor: C.accent }, !rewardedReady && styles.btnOff]}
            >
              <Text style={styles.btnText}>
                {rewardedReady ? `Watch another ad · +${VIDEO_COINS}` : 'Next ad loading…'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              pressFeedback();
              onClose();
            }}
            style={[styles.btnGhost, { borderColor: C.panelBorder }]}
          >
            <Text style={[styles.btnGhostText, { color: C.ink }]}>
              {earned || left === 0 ? 'Done' : 'Maybe later'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  left: { fontSize: 12, fontWeight: '800', marginBottom: 14 },
  btn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnOff: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  btnGhostText: { fontSize: 14, fontWeight: '800' },
});
