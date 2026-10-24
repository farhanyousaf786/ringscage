import React from 'react';
import { Circle, G, Path, Polygon } from 'react-native-svg';
import { getHero } from './catalog';
import { Bird } from './KidSprite';

/**
 * Parent bird hero (Mama / Papa) — same fluffy style as the chicks, just a bit bigger
 * with a little rescue cape, a belly badge and a parent-y accessory.
 * Origin = feet / bottom centre. Looks come from catalog.js (HEROES).
 */

function Cape({ c, cheer }) {
  const flare = cheer * 4;
  return (
    <Path
      d={`M -8 -27 Q ${-19 - flare} -14 ${-17 - flare} 2 Q 0 -4 ${17 + flare} 2 Q ${19 + flare} -14 8 -27 Z`}
      fill={c.cape}
      stroke={c.capeDark}
      strokeWidth={1.1}
      strokeLinejoin="round"
    />
  );
}

function Badge({ c }) {
  if (c.badge === 'heart') {
    return (
      <Path
        d="M 0 -1.6 C -4.6 -4.6 -2.4 -8.4 0 -6 C 2.4 -8.4 4.6 -4.6 0 -1.6 Z"
        fill="#ff5a7a"
        stroke="#c93a58"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
    );
  }
  if (c.badge === 'bolt') {
    return (
      <Path
        d="M 1 -8 L -2.4 -4 L 0 -4 L -1.2 -0.6 L 2.6 -5 L 0.2 -5 Z"
        fill="#ffd24a"
        stroke="#c98a0c"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
    );
  }
  return (
    <Polygon
      points="0,-8.2 1.3,-5.4 4.2,-5.1 2,-3.2 2.7,-0.4 0,-1.9 -2.7,-0.4 -2,-3.2 -4.2,-5.1 -1.3,-5.4"
      fill="#ffd24a"
      stroke="#c98a0c"
      strokeWidth={0.7}
      strokeLinejoin="round"
    />
  );
}

function Accessory({ c }) {
  if (c.accessory === 'flower') {
    return (
      <G transform="translate(9.5 -31)">
        {[0, 72, 144, 216, 288].map((a) => (
          <Circle
            key={a}
            cx={Math.cos((a * Math.PI) / 180) * 3.2}
            cy={Math.sin((a * Math.PI) / 180) * 3.2}
            r={2.4}
            fill="#ff8ab8"
            stroke="#d9588c"
            strokeWidth={0.6}
          />
        ))}
        <Circle cx={0} cy={0} r={1.9} fill="#ffe27a" stroke="#d9a21a" strokeWidth={0.5} />
      </G>
    );
  }
  if (c.accessory === 'bow') {
    return (
      <G transform="translate(9 -31)">
        <Path d="M 0 0 L -6 -3.6 L -6 3.6 Z" fill="#ff5a7a" stroke="#c93a58" strokeWidth={0.7} strokeLinejoin="round" />
        <Path d="M 0 0 L 6 -3.6 L 6 3.6 Z" fill="#ff5a7a" stroke="#c93a58" strokeWidth={0.7} strokeLinejoin="round" />
        <Circle cx={0} cy={0} r={2} fill="#ff8aa4" stroke="#c93a58" strokeWidth={0.6} />
      </G>
    );
  }
  return null;
}

export default function HeroSprite({ id = 'nova', size = 46, bob = 0, cheer = 0, expr = 'neutral', wave = 0 }) {
  const c = getHero(id);
  const mood = expr === 'happy' || expr === 'sad' ? expr : cheer > 0.45 ? 'happy' : 'neutral';
  return (
    <Bird
      c={c}
      size={size}
      bob={bob}
      wave={wave}
      expr={mood}
      cheer={mood === 'happy' ? Math.max(cheer, 0.5) : cheer * 0.5}
      behind={<Cape c={c} cheer={cheer} />}
      front={
        <>
          <Badge c={c} />
          <Accessory c={c} />
        </>
      }
    />
  );
}
