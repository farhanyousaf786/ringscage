import React from 'react';
import { View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import HeroSprite from './HeroSprite';
import KidSprite from './KidSprite';
import VillainSprite from './VillainSprite';

/** Compact SVG portrait for menus / map (origin at feet). */
export default function Portrait({ kind, id, size = 48, expr = 'happy', cheer = 0.4, bob = 0 }) {
  const box = size + 20;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
        <G transform={`translate(${box / 2} ${box - 6})`}>
          {kind === 'hero' ? (
            <HeroSprite id={id} size={size} bob={bob} cheer={cheer} expr={expr} wave={0} />
          ) : null}
          {kind === 'villain' ? (
            <VillainSprite id={id} size={size} bob={bob} cheer={cheer} expr={expr} wave={0} />
          ) : null}
          {kind === 'kid' ? (
            <KidSprite id={id} size={size} bob={bob} expr={expr} wave={0} />
          ) : null}
        </G>
      </Svg>
    </View>
  );
}
