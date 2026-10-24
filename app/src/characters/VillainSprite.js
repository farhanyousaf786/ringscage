import React from 'react';
import { Path } from 'react-native-svg';
import { getVillain } from './catalog';
import { Bird } from './KidSprite';

/**
 * Mean bird who caged the chicks — same fluffy body as Mama’s flock, darker + horns.
 * expr: neutral | happy (smug) | angry | sad (defeated)
 */
export default function VillainSprite({
  id = 'grim',
  size = 44,
  bob = 0,
  cheer = 0,
  expr = 'neutral',
  wave = 0,
}) {
  const c = getVillain(id);
  const mood =
    expr === 'happy' || expr === 'sad' || expr === 'angry'
      ? expr
      : cheer > 0.5
        ? 'happy'
        : 'neutral';

  return (
    <Bird
      c={c}
      size={size}
      bob={bob}
      wave={wave}
      expr={mood}
      cheer={mood === 'angry' ? 0.7 : mood === 'happy' ? 0.35 : 0}
      behind={
        <Path
          d={`M -7 -26 Q ${-16 - cheer * 2} -10 ${-14 - cheer} 4 Q 0 -2 ${14 + cheer} 4 Q ${16 + cheer * 2} -10 7 -26 Z`}
          fill={c.cape}
          stroke={c.capeDark}
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
      }
    />
  );
}
