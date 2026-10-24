import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import GamePanel, { IconButton, PlateStars, PlateText } from '../components/GamePanel';
import { useTheme } from '../theme/ThemeContext';

/** Out-of-moves dialog — same wooden style as the win dialog, red ribbon. Full-screen, centred. */
export default function FailOverlay({ rescued, total, onReplay, onMenu }) {
  const { mode } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    Animated.spring(card, { toValue: 1, useNativeDriver: true, friction: 6, tension: 95 }).start();
  }, [fade, card]);

  const dimColor = mode === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(40,24,10,0.55)';

  return (
    <View style={styles.root}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: dimColor, opacity: fade }]}
      />
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
          variant="lose"
          title="OUT OF MOVES"
          actions={
            <>
              <IconButton icon="menu" label="Menu" onPress={onMenu} />
              <IconButton primary icon="retry" label="Retry" onPress={onReplay} />
            </>
          }
        >
          <PlateStars stars={0} />
          <PlateText>BAD LUCK!</PlateText>
          <PlateText kind="label">FRIENDS SAVED:</PlateText>
          <PlateText kind="gold">{`${rescued}/${total}`}</PlateText>
          <PlateText kind="ask">LET'S TRY AGAIN?</PlateText>
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
});
