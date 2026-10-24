import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { pressFeedback } from '../audio/sounds';
import Svg, { Path, Polygon } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

/**
 * Soft cream dialog in the game's own style: rounded card, glossy ribbon title,
 * a tinted inner plate and chunky round icon buttons. Shared by win + lose.
 */

const RIBBON = {
  win: { top: '#7fdc6a', main: '#4caf50', dark: '#2f8a35' },
  lose: { top: '#ff8a70', main: '#ff5a3c', dark: '#c23a22' },
};

function plateTint(variant, C) {
  if (C.mode === 'dark') {
    return variant === 'lose'
      ? { bg: '#3a2830', border: '#5a3d48' }
      : { bg: '#2e2834', border: '#4a4050' };
  }
  return variant === 'lose'
    ? { bg: '#fde3d9', border: '#f2c0ae' }
    : { bg: '#fdeccd', border: '#f0d3a2' };
}

export function PlateStars({ stars = 0, total = 3 }) {
  const { colors: C } = useTheme();
  const dimFill = C.mode === 'dark' ? C.inkFaint : '#eadcc4';
  const dimStroke = C.mode === 'dark' ? C.panelBorder : '#cdb894';
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: total }, (_, i) => {
        const lit = i < stars;
        const mid = i === Math.floor(total / 2);
        const sz = mid ? 44 : 34;
        return (
          <View key={i} style={{ marginHorizontal: 3, marginTop: mid ? -8 : 0 }}>
            <Svg width={sz} height={sz} viewBox="0 0 24 24">
              <Polygon
                points="12,2.2 14.9,8.6 21.8,9.3 16.6,14 18.1,20.9 12,17.4 5.9,20.9 7.4,14 2.2,9.3 9.1,8.6"
                fill={lit ? C.gold : dimFill}
                stroke={lit ? C.goldDark : dimStroke}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              {lit ? (
                <Polygon
                  points="12,5 13.7,9.2 18,9.7 14.8,12.6"
                  fill="#fff2a8"
                  fillOpacity={0.85}
                />
              ) : null}
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

/** Text helpers so both dialogs share the same typography. */
export function PlateText({ children, kind = 'plain', style }) {
  const { colors: C } = useTheme();
  const kindColor = {
    plain: C.ink,
    label: C.inkSoft,
    good: C.good,
    gold: C.accent,
    ask: C.ink,
  }[kind] || C.ink;
  return (
    <Text style={[styles.plateText, styles[`plate_${kind}`], { color: kindColor }, style]}>
      {children}
    </Text>
  );
}

function MenuIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {[5, 10.5, 16].map((y) => (
        <Path key={y} d={`M4 ${y} H20`} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

function RetryIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M19.5 12 A7.5 7.5 0 1 1 16.9 6.3"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
      <Polygon points="12.5,2.6 19.4,3.4 16.8,9.6" fill={color} />
    </Svg>
  );
}

function NextIcon({ color }) {
  return (
    <Svg width={28} height={26} viewBox="0 0 26 24">
      <Path
        d="M4 4.5 L11 12 L4 19.5 M13 4.5 L20 12 L13 19.5"
        stroke={color}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const ICONS = { menu: MenuIcon, retry: RetryIcon, next: NextIcon };

/** Chunky round icon button with a tiny caption underneath. */
export function IconButton({ icon, label, onPress, primary }) {
  const { colors: C } = useTheme();
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, friction: 6, tension: 220 }).start();
  const Icon = ICONS[icon];
  return (
    <Pressable
      onPress={() => {
        pressFeedback();
        onPress?.();
      }}
      onPressIn={() => to(0.92)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.btnWrap}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: primary ? C.good : C.card,
            borderColor: primary ? C.goodDark : C.panelBorder,
          },
          primary && styles.btnPrimaryWide,
          { transform: [{ scale: s }] },
        ]}
      >
        <View style={styles.btnSheen} />
        <Icon color={primary ? '#ffffff' : C.ink} />
      </Animated.View>
      <Text style={[styles.btnLabel, { color: C.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

export default function GamePanel({ variant = 'win', title, children, actions }) {
  const { width } = useWindowDimensions();
  const { colors: C } = useTheme();
  const panelW = Math.min(width - 44, 330);
  const rib = RIBBON[variant] || RIBBON.win;
  const tint = plateTint(variant, C);

  return (
    <View
      style={[
        styles.outer,
        {
          width: panelW,
          borderColor: C.panelBorder,
          backgroundColor: C.panel,
          shadowColor: C.shadow,
        },
      ]}
    >
      <View
        style={[
          styles.ribbon,
          { backgroundColor: rib.main, borderColor: rib.dark, shadowColor: C.shadow },
        ]}
      >
        <View style={[styles.ribbonGloss, { backgroundColor: rib.top }]} />
        <Text style={styles.ribbonText} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.plate, { backgroundColor: tint.bg, borderColor: tint.border }]}>
          {children}
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
    borderWidth: 3,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  ribbon: {
    alignSelf: 'center',
    marginTop: -22,
    minWidth: '58%',
    maxWidth: '84%',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    overflow: 'hidden',
    alignItems: 'center',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ribbonGloss: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '48%',
    opacity: 0.5,
  },
  ribbonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(60,30,10,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  plate: {
    borderRadius: 20,
    borderWidth: 2.5,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, marginTop: 2 },
  plateText: { textAlign: 'center', fontWeight: '900' },
  plate_plain: { fontSize: 15, letterSpacing: 0.4, marginTop: 4 },
  plate_label: { fontSize: 13, letterSpacing: 0.6, marginTop: 8 },
  plate_good: { fontSize: 32, letterSpacing: 0.5 },
  plate_gold: { fontSize: 32, letterSpacing: 0.5 },
  plate_ask: { fontSize: 16, letterSpacing: 0.6, marginTop: 10 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 18,
    marginTop: 16,
  },
  btnWrap: { alignItems: 'center' },
  btn: {
    width: 60,
    height: 56,
    borderRadius: 20,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnPrimaryWide: {
    width: 84,
  },
  btnSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '45%',
    backgroundColor: '#ffffff',
    opacity: 0.28,
  },
  btnLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
