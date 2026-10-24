import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { pressFeedback } from '../audio/sounds';
import { REMOVE_ADS } from '../game/economy';
import { useTheme } from '../theme/ThemeContext';

/**
 * Remove-all-ads offer · $1.99 forever (Play / RevenueCat later).
 */
export default function RemoveAdsSheet({ onClose, onBuy, owned = false }) {
  const { colors: C } = useTheme();
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (busy || owned) return;
    pressFeedback();
    setBusy(true);
    try {
      await onBuy?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: C.card, borderColor: C.gold }]}
        >
          <Text style={[styles.eyebrow, { color: C.gold }]}>OPTIONAL</Text>
          <Text style={[styles.title, { color: C.ink }]}>
            {owned ? 'Ads removed!' : 'Remove all ads'}
          </Text>
          <Text style={[styles.sub, { color: C.inkSoft }]}>
            {owned
              ? 'Thanks for supporting the flock. No banners, app-open, or win ads — forever.'
              : 'No banners, no app-open, no win interstitials — forever. Optional reward ads stay available if you want coins.'}
          </Text>

          {!owned ? (
            <>
              <View style={[styles.pricePill, { backgroundColor: C.gold }]}>
                <Text style={styles.priceText}>{REMOVE_ADS.priceLabel}</Text>
              </View>
              <Pressable
                disabled={busy}
                onPress={buy}
                style={[styles.btn, { backgroundColor: C.accent }, busy && styles.btnOff]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Remove ads · {REMOVE_ADS.priceLabel}</Text>
                )}
              </Pressable>
            </>
          ) : null}

          <Pressable
            disabled={busy}
            onPress={() => {
              pressFeedback();
              onClose();
            }}
            style={[styles.btnGhost, { borderColor: C.panelBorder }]}
          >
            <Text style={[styles.btnGhostText, { color: C.ink }]}>
              {owned ? 'Done' : 'Maybe later'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 2.5,
    padding: 22,
    alignItems: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 6, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sub: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  pricePill: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  priceText: { color: '#1a1520', fontSize: 18, fontWeight: '900' },
  btn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  btnOff: { opacity: 0.7 },
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
