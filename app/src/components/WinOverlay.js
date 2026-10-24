import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Coin } from './Icons';
import { useTheme } from '../theme/ThemeContext';
import GamePanel, { IconButton, PlateStars, PlateText } from './GamePanel';

/** If the native blur view isn't in the installed build yet, fall back to a frosted tint. */
class SafeBlur extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <View style={[StyleSheet.absoluteFill, this.props.frostStyle]} />;
    }
    return (
      <BlurView
        intensity={38}
        tint={this.props.tint}
        style={StyleSheet.absoluteFill}
      />
    );
  }
}

/**
 * Shown ~3s after the last baby is saved. Covers the WHOLE screen: the kids keep
 * celebrating underneath (blurred), and the dialog pops up in the exact centre.
 */
export default function WinOverlay({
  stars,
  moves,
  rescued,
  totalKids,
  levelName,
  isLast,
  coinsEarned = 0,
  onNext,
  onReplay,
  onMenu,
}) {
  const { mode, colors: C } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const coinPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    Animated.spring(card, {
      toValue: 1,
      delay: 120,
      useNativeDriver: true,
      friction: 6,
      tension: 95,
    }).start();
    coinPop.setValue(0);
    Animated.spring(coinPop, {
      toValue: 1,
      delay: 280,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();
  }, [fade, card, coinPop]);

  const frostStyle = {
    backgroundColor: mode === 'dark' ? 'rgba(26, 21, 32, 0.78)' : 'rgba(248, 238, 221, 0.7)',
  };
  const tintStyle = {
    backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(60, 38, 18, 0.18)',
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <SafeBlur tint={mode === 'dark' ? 'dark' : 'light'} frostStyle={frostStyle} />
        <View style={[StyleSheet.absoluteFill, tintStyle]} />
      </Animated.View>

      <Animated.View
        style={{
          opacity: card,
          transform: [
            { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
          ],
        }}
      >
        <GamePanel
          variant="win"
          title={isLast ? 'ALL CLEAR!' : 'LEVEL CLEAR!'}
          actions={
            <>
              <IconButton icon="menu" label="Menu" onPress={onMenu} />
              <IconButton icon="retry" label="Retry" onPress={onReplay} />
              {isLast ? null : <IconButton primary icon="next" label="Next" onPress={onNext} />}
            </>
          }
        >
          <PlateStars stars={stars} />
          <PlateText>CONGRATULATIONS!</PlateText>
          <PlateText kind="label">FRIENDS SAVED:</PlateText>
          <PlateText kind="good">{`${rescued ?? totalKids}/${totalKids}`}</PlateText>
          <PlateText>{`${moves} ${moves === 1 ? 'MOVE' : 'MOVES'}`}</PlateText>
          {coinsEarned > 0 ? (
            <Animated.View
              style={[
                styles.earnRow,
                {
                  backgroundColor: C.gold + '33',
                  borderColor: C.gold,
                  opacity: coinPop,
                  transform: [
                    {
                      scale: coinPop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Coin size={22} />
              <Text style={[styles.earnText, { color: C.ink }]}>
                You earned +{coinsEarned} coins!
              </Text>
            </Animated.View>
          ) : null}
          <PlateText kind="ask">{isLast ? 'PLAY AGAIN?' : 'NEXT LEVEL?'}</PlateText>
        </GamePanel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  earnText: { fontSize: 15, fontWeight: '900' },
});
