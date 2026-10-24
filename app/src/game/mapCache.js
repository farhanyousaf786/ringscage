/**
 * Warm map/world + level packs at boot so opening the map feels instant.
 */
import { LEVELS } from './levels';
import { WORLDS, isBossLevel, worldForLevel } from './worlds';

const PATH_TOP = 18;
const ROW = 58;
const BOSS_R = 28;

let warmed = false;
let levelsByWorld = null;

function touchLevel(lv) {
  void lv.id;
  void lv.name;
  void lv.rings?.length;
  void lv.links?.length;
  void lv.startAngles?.length;
  void lv.maxMoves;
  void lv.kids?.length;
  void lv.villain;
  void lv.hero;
  void isBossLevel(lv.id);
  void worldForLevel(lv.id);
}

export function warmMapData() {
  if (warmed) return levelsByWorld;
  levelsByWorld = WORLDS.map((w) => {
    const levels = LEVELS.filter((l) => l.id >= w.levelFrom && l.id <= w.levelTo);
    return {
      world: w,
      levels,
      height: PATH_TOP + Math.max(0, levels.length - 1) * ROW + BOSS_R * 2 + 36,
    };
  });
  // Touch every level so first map / level paint isn’t cold.
  for (const pack of levelsByWorld) {
    void pack.world.name;
    void pack.world.tint;
    void pack.world.path;
    void pack.height;
    for (const lv of pack.levels) touchLevel(lv);
  }
  // Also walk LEVELS in order (covers any orphan defs).
  for (let i = 0; i < LEVELS.length; i += 1) touchLevel(LEVELS[i]);
  warmed = true;
  return levelsByWorld;
}

/** Run warm now; safe to call many times. */
export function ensureMapWarmed() {
  return warmMapData();
}

export function getWorldLevels(worldId) {
  if (!warmed) warmMapData();
  return levelsByWorld.find((p) => p.world.id === worldId)?.levels || [];
}

export function getWorldPack(worldId) {
  if (!warmed) warmMapData();
  return levelsByWorld.find((p) => p.world.id === worldId) || null;
}

export function isMapWarmed() {
  return warmed;
}

// Warm as soon as this module loads (before first paint when App imports it).
warmMapData();
