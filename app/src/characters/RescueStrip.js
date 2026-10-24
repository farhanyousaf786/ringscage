import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { getHero } from './catalog';
import HeroSprite from './HeroSprite';
import KidSprite from './KidSprite';

/** Compact rescue bay — keeps board space for rings + critters. */
function RescueStrip({
  heroId,
  kids,
  gameTime = 0,
  rescuedCount = 0,
  totalKids = 0,
  expr = 'neutral',
}) {
  const { colors: C } = useTheme();
  const hero = getHero(heroId);
  const rescued = kids.filter((k) => k.state === 'rescued');
  const cheer =
    expr === 'happy' ? 0.85 : expr === 'sad' ? 0 : rescued.length > 0 ? 0.5 + 0.4 * Math.sin(gameTime * 4) : 0;
  const bob = expr === 'sad' ? Math.sin(gameTime * 6) * 0.8 : Math.sin(gameTime * 2.4) * 1.4;

  const width = 340;
  const height = 44;
  const heroX = 28;
  const baseY = 40;
  const slotStart = 58;
  const slotGap = Math.min(28, (width - slotStart - 10) / Math.max(1, totalKids));

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: C.panel, borderColor: C.panelBorder },
      ]}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <G transform={`translate(${heroX} ${baseY})`}>
          <HeroSprite id={heroId} size={40} bob={bob} cheer={cheer} expr={expr} />
        </G>
        {Array.from({ length: totalKids }).map((_, i) => {
          const x = slotStart + i * slotGap;
          const kid = rescued[i];
          if (!kid) {
            return (
              <Circle
                key={`empty-${i}`}
                cx={x}
                cy={baseY - 8}
                r={6}
                fill={C.bgDeep}
                stroke={C.inkFaint}
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            );
          }
          return (
            <G key={kid.uid} transform={`translate(${x} ${baseY})`}>
              <KidSprite
                id={kid.id}
                size={20}
                bob={Math.sin(gameTime * 3 + i) * 1.2}
                wave={gameTime * 5 + i}
                expr={expr === 'neutral' ? 'happy' : expr}
              />
            </G>
          );
        })}
      </Svg>
      <Text style={[styles.count, { color: C.accent }]}>
        {hero.name}  ·  {rescuedCount}/{totalKids}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 2,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 4,
    marginTop: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    position: 'absolute',
    right: 10,
    top: 4,
    fontSize: 10,
    fontWeight: '900',
  },
});

export default memo(RescueStrip);
