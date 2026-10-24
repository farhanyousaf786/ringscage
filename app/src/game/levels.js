/**
 * Level definitions + layout builder.
 *
 * A level is just data:
 *   rings: positions on a hex-style grid, in "units" (neighbours are exactly 1 unit apart)
 *   links: [holder, held]  ->  the holder owns a stem + collar, and the collar
 *                              sits around the HELD ring's tube.
 *
 * Rules the engine derives from that data:
 *   - A ring that still holds another ring (has an active stem) is LOCKED.
 *   - A held ring can rotate. When its gap reaches a collar, that collar releases.
 *   - A ring with no active collars left (holding or held) is free and flies off.
 *
 * Because links point holder -> held and the graph is acyclic, every level is solvable
 * by freeing the leaves first (verified in tests/levels.test.mjs).
 */

export const BOARD_W = 360;
/** Tall playfield so the board fills phone height (no letterbox above/below). */
export const PLAY_H = 420;
/** Bottom hero rescue bay — room under Mama for cute name + saved count. */
export const HERO_H = 96;
export const BOARD_H = PLAY_H + HERO_H;
export const HERO_X = 46;
export const HERO_Y = PLAY_H + HERO_H - 34;
/** Villain (who caged the chicks) stands opposite Mama. */
export const VILLAIN_X = BOARD_W - 46;
export const VILLAIN_Y = HERO_Y;

export const GAP = 1.45; // opening width of every C-ring (radians)

// geometry ratios (relative to ring radius R)
const THICK = 0.34;
const STEM = 0.55;
const MAX_D = 175; // largest centre-to-centre distance (level 1)

const S = Math.sqrt(3) / 2;
const deg = (d) => (d * Math.PI) / 180;

/**
 * Solvable ring graphs (unit spacing). Skins / moves / cast are filled by the pack.
 * Characters are ids from src/characters/catalog.js.
 */
const GRAPHS = {
  /** 2 rings — teach one collar */
  hook: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0], angle: 0 },
    ],
    links: [['a', 'b']],
  },
  /** 3 rings — one holder, two free leaves */
  twin: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [0.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['a', 'c'],
    ],
  },
  /** 3-ring chain */
  chain: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [1.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
    ],
  },
  /** 3-ring chain bent the other way */
  zig: {
    rings: [
      { id: 'a', color: 'teal', pos: [0, 0] },
      { id: 'b', color: 'pink', pos: [1, 0] },
      { id: 'c', color: 'purple', pos: [1.5, -S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
    ],
  },
  /** stem + side branch */
  spur: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [2, 0] },
      { id: 'd', color: 'pink', pos: [0.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
      ['a', 'd'],
    ],
  },
  /** classic fork into a longer arm */
  fork: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [-0.5, S] },
      { id: 'd', color: 'pink', pos: [0, 2 * S] },
    ],
    links: [
      ['a', 'b'],
      ['a', 'c'],
      ['c', 'd'],
    ],
  },
  /** 4-ring chain */
  longChain: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [1.5, S] },
      { id: 'd', color: 'pink', pos: [2.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
    ],
  },
  /** hub holds two tips; tip chain continues */
  elbow: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [2, 0] },
      { id: 'd', color: 'purple', pos: [1.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
      ['b', 'd'],
    ],
  },
  /** one center, three leaves */
  tripod: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'n1', color: 'blue', pos: [1, 0] },
      { id: 'n2', color: 'orange', pos: [0.5, S] },
      { id: 'n3', color: 'pink', pos: [-0.5, S] },
    ],
    links: [
      ['o', 'n1'],
      ['o', 'n2'],
      ['o', 'n3'],
    ],
  },
  /** two holders share a middle cage */
  bridge: {
    rings: [
      { id: 'p', color: 'blue', pos: [0, 0] },
      { id: 'q', color: 'purple', pos: [1, 0] },
      { id: 'x', color: 'orange', pos: [0.5, S] },
      { id: 'y', color: 'green', pos: [1, 2 * S] },
    ],
    links: [
      ['p', 'x'],
      ['q', 'x'],
      ['x', 'y'],
    ],
  },
  double: {
    rings: [
      { id: 'p', color: 'blue', pos: [0, 0] },
      { id: 'q', color: 'purple', pos: [1, 0] },
      { id: 'x', color: 'orange', pos: [0.5, S] },
      { id: 'y', color: 'green', pos: [1, 2 * S] },
      { id: 'z', color: 'teal', pos: [1.5, -S] },
    ],
    links: [
      ['p', 'x'],
      ['q', 'x'],
      ['x', 'y'],
      ['q', 'z'],
    ],
  },
  /** 5-ring meadow nest */
  nest5: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'pink', pos: [-0.5, S] },
      { id: 'd', color: 'teal', pos: [1.5, S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'b'],
      ['a', 'd'],
    ],
  },
  /** wide fan into a tip */
  fan: {
    rings: [
      { id: 'a', color: 'blue', pos: [0, 0] },
      { id: 'b', color: 'orange', pos: [1, 0] },
      { id: 'c', color: 'green', pos: [-0.5, S] },
      { id: 'd', color: 'pink', pos: [-1, 0] },
      { id: 'e', color: 'purple', pos: [0.5, -S] },
    ],
    links: [
      ['a', 'b'],
      ['a', 'c'],
      ['a', 'e'],
      ['c', 'd'],
    ],
  },
  /** pre-boss tangle */
  tangle: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [0.5, -S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'b'],
      ['c', 'd'],
      ['o', 'e'],
    ],
  },
  knot: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'n1', color: 'blue', pos: [1, 0] },
      { id: 'n2', color: 'orange', pos: [0.5, S] },
      { id: 'n3', color: 'purple', pos: [-0.5, S] },
      { id: 'n4', color: 'green', pos: [-1, 0] },
      { id: 'n5', color: 'pink', pos: [-0.5, -S] },
      { id: 'n6', color: 'teal', pos: [0.5, -S] },
    ],
    links: [
      ['n1', 'o'],
      ['n2', 'o'],
      ['n3', 'n2'],
      ['n3', 'n4'],
      ['o', 'n4'],
      ['o', 'n5'],
      ['n6', 'n5'],
    ],
  },
  /** 8 — full hex shell + tip; hub held by three */
  corona8: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [1.5, S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['e', 'o'],
      ['c', 'b'],
      ['d', 'c'],
      ['f', 'a'],
      ['b', 'g'],
    ],
  },
  /** 9 — hub multi-held; one tip needs two collars */
  web9: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [2, 0] },
      { id: 'h', color: 'orange', pos: [0, 2 * S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['d', 'c'],
      ['f', 'a'],
      ['a', 'g'],
      ['b', 'h'],
      ['c', 'h'],
    ],
  },
  /** 10 — fortress: shared tips + dense hub */
  fortress10: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [2, 0] },
      { id: 'h', color: 'orange', pos: [0, 2 * S] },
      { id: 'i', color: 'pink', pos: [-1.5, -S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['d', 'c'],
      ['f', 'e'],
      ['a', 'g'],
      ['b', 'h'],
      ['c', 'h'],
      ['d', 'i'],
      ['e', 'i'],
    ],
  },
  /** 11 — hive with four outer tips */
  hive11: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [2, 0] },
      { id: 'h', color: 'orange', pos: [0, 2 * S] },
      { id: 'i', color: 'pink', pos: [-1.5, -S] },
      { id: 'j', color: 'green', pos: [1.5, -S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['f', 'o'],
      ['d', 'c'],
      ['a', 'g'],
      ['b', 'h'],
      ['c', 'h'],
      ['d', 'i'],
      ['e', 'i'],
      ['f', 'j'],
      ['a', 'j'],
    ],
  },
  /** 12 — maze: multi-held hub + shared tips (break order unlocks next) */
  maze12: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [2, 0] },
      { id: 'h', color: 'orange', pos: [0, 2 * S] },
      { id: 'i', color: 'pink', pos: [-2, 0] },
      { id: 'j', color: 'green', pos: [1.5, -S] },
      { id: 'k', color: 'purple', pos: [-1.5, S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['d', 'c'],
      ['f', 'a'],
      ['a', 'g'],
      ['b', 'h'],
      ['c', 'h'],
      ['d', 'i'],
      ['c', 'k'],
      ['d', 'k'],
      ['f', 'j'],
      ['a', 'j'],
    ],
  },
  /** 13 — crown: hex shell + 6 shared tips (ref-style dense cluster) */
  crown13: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
    ],
    links: [
      // hub held by four (60° spacing would leave no safe start gap)
      ['a', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['b', 'o'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['a', 'u'],
      // shell chain so d/f stay locked until neighbors free
      ['d', 'c'],
      ['f', 'a'],
    ],
  },
  /** 6 — long straight rods (2-unit stems) + branch */
  rods6: {
    rings: [
      { id: 'a', color: 'green', pos: [0, 0], size: 'small' },
      { id: 'b', color: 'gold', pos: [2, 0], size: 'big' },
      { id: 'c', color: 'orange', pos: [3, 0], size: 'small' },
      { id: 'd', color: 'purple', pos: [2.5, S] },
      { id: 'e', color: 'blue', pos: [0.5, S], size: 'small' },
      { id: 'f', color: 'pink', pos: [2.5, -S], size: 'small' },
    ],
    links: [
      ['a', 'b'], // long rod
      ['b', 'c'],
      ['b', 'd'],
      ['e', 'a'],
      ['e', 'd'], // long rod
      ['b', 'f'],
    ],
  },
  /** 7 — big hub, small tips, one long rod */
  mixed7: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0], size: 'big' },
      { id: 'a', color: 'blue', pos: [1, 0], size: 'small' },
      { id: 'b', color: 'orange', pos: [0.5, S], size: 'small' },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0], size: 'small' },
      { id: 'e', color: 'pink', pos: [0.5, -S], size: 'small' },
      { id: 'f', color: 'teal', pos: [3, 0], size: 'small' },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'o'],
      ['d', 'c'],
      ['e', 'o'],
      ['a', 'f'], // long rod tip
      ['b', 'a'],
    ],
  },
  /** 9 — nested feel: big hub, small tips, shared locks */
  nestMix9: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0], size: 'big' },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S], size: 'small' },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0], size: 'small' },
      { id: 'e', color: 'pink', pos: [-0.5, -S], size: 'small' },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'g', color: 'blue', pos: [0, 2 * S], size: 'small' },
      { id: 'h', color: 'orange', pos: [1.5, -S], size: 'small' },
    ],
    links: [
      ['a', 'o'],
      ['c', 'o'],
      ['f', 'o'],
      ['b', 'a'],
      ['b', 'c'],
      ['d', 'c'],
      ['e', 'f'],
      ['c', 'g'],
      ['b', 'g'],
      ['f', 'h'],
      ['a', 'h'],
    ],
  },
  /** 10 — dual long rods + dense hub */
  twinRods10: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0], size: 'big' },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S], size: 'small' },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0], size: 'small' },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S], size: 'small' },
      { id: 'p', color: 'blue', pos: [1, 2 * S], size: 'small' },
      { id: 'q', color: 'green', pos: [1, -2 * S], size: 'small' },
      { id: 'r', color: 'orange', pos: [3, 0], size: 'small' },
    ],
    links: [
      ['a', 'o'],
      ['c', 'o'],
      ['e', 'o'],
      ['b', 'a'],
      ['b', 'c'],
      ['d', 'c'],
      ['f', 'a'],
      ['f', 'e'],
      ['b', 'p'],
      ['o', 'p'], // long rod up
      ['f', 'q'],
      ['o', 'q'], // long rod down
      ['a', 'r'], // long rod out
    ],
  },
  /**
   * World-1 meadow pack (levels 3–15): ring count = stage+2.
   * Varied unlock order — tip-first, hub+tip, chain, mixed — not always center-first.
   */
  meadow5: {
    rings: [
      { id: 'a', color: 'gold', pos: [0, 0] },
      { id: 'b', color: 'blue', pos: [1, 0] },
      { id: 'c', color: 'orange', pos: [1.5, S] },
      { id: 'd', color: 'purple', pos: [2.5, S] },
      { id: 'e', color: 'green', pos: [0.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['a', 'e'],
    ],
  },
  meadow6: {
    rings: [
      { id: 'a', color: 'gold', pos: [0, 0] },
      { id: 'b', color: 'blue', pos: [1, 0] },
      { id: 'c', color: 'orange', pos: [2, 0] },
      { id: 'd', color: 'purple', pos: [0.5, S] },
      { id: 'e', color: 'green', pos: [1.5, S] },
      { id: 'f', color: 'pink', pos: [2.5, S] },
    ],
    links: [
      ['a', 'b'],
      ['b', 'c'],
      ['d', 'b'],
      ['d', 'e'],
      ['e', 'c'],
      ['e', 'f'],
    ],
  },
  meadow7: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [0.5, -S] },
      { id: 't', color: 'teal', pos: [1.5, S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'b'],
      ['d', 'c'],
      ['e', 'a'],
      ['a', 't'],
      ['b', 't'],
    ],
  },
  meadow8: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 't', color: 'blue', pos: [2, 0] },
    ],
    links: [
      ['o', 'a'],
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['o', 'f'],
      ['f', 'e'],
      ['d', 'e'],
      ['a', 't'],
    ],
  },
  meadow9: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [2, 0] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'b'],
      ['a', 'f'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'e'],
      ['e', 'f'],
      ['a', 'p'],
      ['b', 'q'],
    ],
  },
  meadow10: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [2, 0] },
      { id: 'q', color: 'orange', pos: [-1.5, S] },
      { id: 'r', color: 'purple', pos: [1.5, -S] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'c'],
      ['a', 'b'],
      ['c', 'd'],
      ['d', 'e'],
      ['e', 'f'],
      ['f', 'a'],
      ['a', 'p'],
      ['c', 'q'],
      ['f', 'r'],
      ['a', 'r'],
    ],
  },
  meadow11: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [2, 0] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-2, 0] },
      { id: 'm', color: 'green', pos: [1.5, S] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'b'],
      ['o', 'd'],
      ['a', 'f'],
      ['f', 'e'],
      ['b', 'c'],
      ['d', 'e'],
      ['c', 'd'],
      ['a', 'p'],
      ['b', 'q'],
      ['d', 'r'],
      ['a', 'm'],
      ['b', 'm'],
    ],
  },
  meadow12: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [2, 0] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-2, 0] },
      { id: 's', color: 'green', pos: [0, -2 * S] },
      { id: 'x', color: 'pink', pos: [1.5, S] },
    ],
    links: [
      ['a', 'o'],
      ['b', 'o'],
      ['c', 'b'],
      ['d', 'c'],
      ['e', 'd'],
      ['f', 'e'],
      ['f', 'a'],
      ['a', 'p'],
      ['b', 'q'],
      ['d', 'r'],
      ['e', 's'],
      ['a', 'x'],
      ['b', 'x'],
    ],
  },
  meadow13: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'c'],
      ['o', 'e'],
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['a', 'u'],
    ],
  },
  meadow14: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
      { id: 'v', color: 'blue', pos: [2, 0] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'b'],
      ['o', 'd'],
      ['a', 'f'],
      ['b', 'c'],
      ['d', 'e'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['a', 'u'],
      ['a', 'v'],
      ['u', 'v'],
    ],
  },
  meadow15: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
      { id: 'v', color: 'blue', pos: [2, 0] },
      { id: 'w', color: 'orange', pos: [-2, 0] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'c'],
      ['o', 'e'],
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['a', 'u'],
      ['a', 'v'],
      ['u', 'v'],
      ['d', 'w'],
      ['s', 'w'],
    ],
  },
  meadow16: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
      { id: 'v', color: 'blue', pos: [2, 0] },
      { id: 'w', color: 'orange', pos: [-2, 0] },
      { id: 'x', color: 'purple', pos: [1, 2 * S] },
    ],
    links: [
      // Keep ring a uncrowded (gap needs a safe slot).
      ['a', 'o'],
      ['c', 'o'],
      ['b', 'a'],
      ['d', 'c'],
      ['e', 'd'],
      ['f', 'e'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['u', 'v'],
      ['p', 'v'],
      ['d', 'w'],
      ['s', 'w'],
      ['q', 'x'],
      ['p', 'x'],
    ],
  },
  meadow17: {
    rings: [
      { id: 'o', color: 'gold', pos: [0, 0] },
      { id: 'a', color: 'blue', pos: [1, 0] },
      { id: 'b', color: 'orange', pos: [0.5, S] },
      { id: 'c', color: 'purple', pos: [-0.5, S] },
      { id: 'd', color: 'green', pos: [-1, 0] },
      { id: 'e', color: 'pink', pos: [-0.5, -S] },
      { id: 'f', color: 'teal', pos: [0.5, -S] },
      { id: 'p', color: 'blue', pos: [1.5, S] },
      { id: 'q', color: 'orange', pos: [0, 2 * S] },
      { id: 'r', color: 'purple', pos: [-1.5, S] },
      { id: 's', color: 'green', pos: [-1.5, -S] },
      { id: 't', color: 'pink', pos: [0, -2 * S] },
      { id: 'u', color: 'teal', pos: [1.5, -S] },
      { id: 'v', color: 'blue', pos: [2, 0] },
      { id: 'w', color: 'orange', pos: [-2, 0] },
      { id: 'x', color: 'purple', pos: [1, 2 * S] },
      { id: 'y', color: 'green', pos: [-1, 2 * S] },
    ],
    links: [
      ['o', 'a'],
      ['o', 'b'],
      ['o', 'd'],
      ['a', 'f'],
      ['b', 'c'],
      ['d', 'e'],
      ['a', 'p'],
      ['b', 'p'],
      ['b', 'q'],
      ['c', 'q'],
      ['c', 'r'],
      ['d', 'r'],
      ['d', 's'],
      ['e', 's'],
      ['e', 't'],
      ['f', 't'],
      ['f', 'u'],
      ['a', 'u'],
      ['a', 'v'],
      ['u', 'v'],
      ['d', 'w'],
      ['s', 'w'],
      ['q', 'x'],
      ['p', 'x'],
      ['q', 'y'],
      ['r', 'y'],
    ],
  },
};

const PALETTES = [
  ['blue', 'orange', 'green', 'pink', 'purple', 'teal', 'gold'],
  ['teal', 'pink', 'blue', 'orange', 'green', 'purple', 'gold'],
  ['purple', 'gold', 'teal', 'blue', 'orange', 'pink', 'green'],
  ['orange', 'green', 'purple', 'teal', 'pink', 'blue', 'gold'],
  ['green', 'blue', 'pink', 'gold', 'teal', 'orange', 'purple'],
];

const KID_POOL = ['seal', 'kitty', 'bun', 'fox', 'cub', 'pup', 'pinky', 'mousy', 'mint', 'cocoa', 'panda'];

/** Hard pool used from world slot 4+ (and whole worlds 2–10). */
const HARD_SEQ = [
  'double',
  'rods6',
  'nest5',
  'mixed7',
  'fan',
  'tangle',
  'knot',
  'corona8',
  'nestMix9',
  'web9',
  'fortress10',
  'twinRods10',
  'hive11',
  'maze12',
  'crown13',
];

const HARD_SEQ_B = [
  'rods6',
  'mixed7',
  'tangle',
  'knot',
  'corona8',
  'nestMix9',
  'web9',
  'fortress10',
  'twinRods10',
  'hive11',
  'maze12',
  'crown13',
  'hive11',
  'twinRods10',
  'crown13',
];

const HARD_SEQ_C = [
  'mixed7',
  'knot',
  'corona8',
  'nestMix9',
  'web9',
  'fortress10',
  'twinRods10',
  'hive11',
  'maze12',
  'crown13',
  'maze12',
  'twinRods10',
  'hive11',
  'maze12',
  'crown13',
];

/**
 * World 1: teach 1–2, then meadow ramp 5→17 rings (stage n has n+2 cages).
 * Worlds 2–10: all hard, denser remixes (150 levels total).
 */
const W1_SEQ = [
  'hook', // 2
  'chain', // 3
  'meadow5',
  'meadow6',
  'meadow7',
  'meadow8',
  'meadow9',
  'meadow10',
  'meadow11',
  'meadow12',
  'meadow13',
  'meadow14',
  'meadow15',
  'meadow16',
  'meadow17', // boss
];

const WORLD_GRAPHS = [
  W1_SEQ,
  HARD_SEQ_B,
  HARD_SEQ_C,
  HARD_SEQ,
  HARD_SEQ_B,
  HARD_SEQ_C,
  HARD_SEQ_B,
  HARD_SEQ_C,
  HARD_SEQ,
  [...HARD_SEQ.slice(3), 'twinRods10', 'maze12', 'crown13'],
];

const WORLD_NAME_SETS = [
  [
    'First Hook', 'Daisy Chain', 'Five Nest', 'Six Spokes', 'Seven Lock',
    'Eight Shell', 'Nine Guard', 'Ten Fence', 'Eleven Hive', 'Twelve Wall',
    'Thirteen Ring', 'Fourteen Gate', 'Fifteen Keep', 'Sixteen Spire', 'Grim’s Meadow',
  ],
  [
    'Rod Ripple', 'Size Spray', 'Foam Tangle', 'Deep Knot', 'Corona Current',
    'Nest Weir', 'Web Weir', 'Fortress Foam', 'Twin Rods', 'Hive Rapids',
    'Maze Ford', 'Crown Spray', 'Hive Surge', 'Rod Peak', 'Hex’s Crown',
  ],
  [
    'Berry Mix', 'Seed Knot', 'Corona Bramble', 'Nest Tart', 'Web Tart',
    'Fortress Vine', 'Twin Vine', 'Hive Pie', 'Maze Thicket', 'Crown Cluster',
    'Deep Maze', 'Rod Bramble', 'Hive Peak', 'Maze Peak', 'Snag’s Crown',
  ],
  [
    'Cloud Lock', 'Sky Rods', 'Puff Nest', 'Size Drift', 'Wind Fan',
    'Gale Tangle', 'Storm Knot', 'Corona Cloud', 'Nest Mix High', 'Web Sky',
    'Fortress Gale', 'Twin Gust', 'Hive Cloud', 'Maze Sky', 'Nimbus Crown',
  ],
  [
    'Cave Lock', 'Crystal Rod', 'Echo Nest', 'Gem Mix', 'Fan Deep',
    'Tangle Dark', 'Knot Stone', 'Corona Cave', 'Nest Echo', 'Web Crystal',
    'Fortress Deep', 'Twin Ore', 'Hive Cave', 'Maze Ore', 'Gloom Crown',
  ],
  [
    'Ember Lock', 'Lava Rod', 'Ash Nest', 'Heat Mix', 'Fan Flame',
    'Tangle Coal', 'Knot Spark', 'Corona Ember', 'Nest Ash', 'Web Flame',
    'Fortress Coal', 'Twin Spark', 'Hive Ember', 'Maze Ash', 'Blaze Crown',
  ],
  [
    'Tide Lock', 'Reef Rod', 'Kelp Nest', 'Pearl Mix', 'Fan Wave',
    'Tangle Reef', 'Knot Tide', 'Corona Sea', 'Nest Pearl', 'Web Wave',
    'Fortress Reef', 'Twin Tide', 'Hive Sea', 'Maze Pearl', 'Abyss Crown',
  ],
  [
    'Frost Lock', 'Ice Rod', 'Snow Nest', 'Chill Mix', 'Fan Flake',
    'Tangle Ice', 'Knot Frost', 'Corona Snow', 'Nest Chill', 'Web Flake',
    'Fortress Ice', 'Twin Frost', 'Hive Snow', 'Maze Chill', 'Glacier Crown',
  ],
  [
    'Thorn Lock', 'Vine Rod', 'Moss Nest', 'Leaf Mix', 'Fan Briar',
    'Tangle Vine', 'Knot Thorn', 'Corona Moss', 'Nest Leaf', 'Web Briar',
    'Fortress Vine', 'Twin Thorn', 'Hive Moss', 'Maze Leaf', 'Briar Crown',
  ],
  [
    'Star Lock', 'Comet Rod', 'Orbit Nest', 'Nova Mix', 'Fan Star',
    'Tangle Orbit', 'Knot Comet', 'Corona Nova', 'Nest Star', 'Web Orbit',
    'Fortress Comet', 'Twin Nova', 'Hive Star', 'Maze Orbit', 'Cosmos Crown',
  ],
];

const WORLD_CAST = [
  { hero: 'nova', villain: 'grim', assistUntil: 2 },
  { hero: 'nova', villain: 'hex', assistUntil: 0 },
  { hero: 'volt', villain: 'snag', assistUntil: 0 },
  { hero: 'nova', villain: 'grim', assistUntil: 0 },
  { hero: 'volt', villain: 'hex', assistUntil: 0 },
  { hero: 'nova', villain: 'snag', assistUntil: 0 },
  { hero: 'volt', villain: 'grim', assistUntil: 0 },
  { hero: 'nova', villain: 'hex', assistUntil: 0 },
  { hero: 'volt', villain: 'snag', assistUntil: 0 },
  { hero: 'nova', villain: 'grim', assistUntil: 0 },
];

const BASE_MOVES = {
  hook: 4,
  twin: 5,
  chain: 6,
  zig: 6,
  spur: 8,
  fork: 8,
  longChain: 9,
  elbow: 9,
  tripod: 9,
  bridge: 9,
  double: 8,
  nest5: 9,
  fan: 9,
  tangle: 10,
  knot: 12,
  corona8: 13,
  web9: 15,
  fortress10: 17,
  hive11: 19,
  maze12: 21,
  crown13: 24,
  rods6: 12,
  mixed7: 13,
  nestMix9: 16,
  twinRods10: 18,
  meadow5: 8,
  meadow6: 10,
  meadow7: 11,
  meadow8: 13,
  meadow9: 14,
  meadow10: 16,
  meadow11: 18,
  meadow12: 20,
  meadow13: 22,
  meadow14: 24,
  meadow15: 26,
  meadow16: 28,
  meadow17: 30,
};

const DIFF_FOR = {
  hook: 'Easy',
  twin: 'Easy',
  chain: 'Easy',
  zig: 'Easy',
  spur: 'Medium',
  fork: 'Medium',
  longChain: 'Medium',
  elbow: 'Medium',
  tripod: 'Medium',
  bridge: 'Hard',
  double: 'Hard',
  nest5: 'Hard',
  fan: 'Hard',
  rods6: 'Hard',
  mixed7: 'Expert',
  tangle: 'Expert',
  knot: 'Expert',
  corona8: 'Expert',
  nestMix9: 'Expert',
  web9: 'Expert',
  fortress10: 'Expert',
  twinRods10: 'Expert',
  hive11: 'Expert',
  maze12: 'Expert',
  crown13: 'Expert',
  meadow5: 'Medium',
  meadow6: 'Medium',
  meadow7: 'Hard',
  meadow8: 'Hard',
  meadow9: 'Hard',
  meadow10: 'Hard',
  meadow11: 'Expert',
  meadow12: 'Expert',
  meadow13: 'Expert',
  meadow14: 'Expert',
  meadow15: 'Expert',
  meadow16: 'Expert',
  meadow17: 'Expert',
};

function paintGraph(graphKey, paletteIndex) {
  const g = GRAPHS[graphKey];
  const pal = PALETTES[paletteIndex % PALETTES.length];
  return {
    rings: g.rings.map((r, i) => ({
      ...r,
      color: pal[i % pal.length],
      // drop fixed angles after level 1 so layout picks safe gaps
      angle: graphKey === 'hook' && i === 1 && paletteIndex === 0 ? 0 : undefined,
    })),
    links: g.links.map((pair) => [...pair]),
  };
}

function kidsFor(n, seed) {
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(KID_POOL[(seed + i * 3) % KID_POOL.length]);
  return out;
}

function tipFor(graphKey, worldId) {
  const tips = {
    hook: 'Free the held cage first — then Mama can scoop the chick.',
    twin: 'One cage holds two peeps. Free both leaves.',
    chain: 'A cage that still holds another stays locked. Start at the tip.',
    zig: 'Same idea as a chain — just bent the other way.',
    spur: 'Free the side peep, then work down the stem.',
    fork: 'One cage can hold several. Open every collar to unlock it.',
    longChain: 'Four cages in a row. Always free the tip first.',
    elbow: 'The middle cage holds two tips. Clear both before the stem.',
    tripod: 'Three leaves on one nest. Free every leaf.',
    bridge: 'Two cages share the middle. Slip both collars.',
    double: 'Some cages need two collars slipped. Spend moves wisely.',
    nest5: 'A little nest of five. Outside-in still wins.',
    fan: 'Clear the outer peeps, then the hub.',
    tangle: 'Almost Grim’s gate — plan the order carefully.',
    knot: 'Work outside-in. Every free cage sends a peep home.',
    corona8: 'Eight cages. Free the tip, then slip every collar on the hub.',
    web9: 'Some peeps need two collars slipped before they can fly.',
    fortress10: 'Shared tips lock two cages at once. Clear the outsides first.',
    hive11: 'A busy hive — one free cage unlocks the next.',
    maze12: 'Shared tips lock two cages. Clear outsides, then the hub.',
    crown13: 'Thirteen linked cages. Every tip needs two collars — outside-in.',
    rods6: 'Long rods stretch between cages. Size tricks the order — think ahead.',
    mixed7: 'Big cage, tiny tips. Slip every collar on the hub.',
    nestMix9: 'Mixed sizes + shared tips. Outside-in still wins.',
    twinRods10: 'Two long rods and a fat hub. Free the tips or stay stuck.',
    meadow5: 'Find the free tip — not every cage turns. Follow the chain.',
    meadow6: 'Two arms, two tips. Clear one side, then the other.',
    meadow7: 'Hub and tip can both move. Pick a path and stay logical.',
    meadow8: 'The nest holds the shell. Free the outer tip first.',
    meadow9: 'Rim tips unlock the wall. Look for cages that aren’t holding.',
    meadow10: 'A mid cage and the tips are ready. Order still matters.',
    meadow11: 'Shared tips lock two cages. Slip every collar you can.',
    meadow12: 'Hub and tips both play. Don’t force a locked corner.',
    meadow13: 'Crown tips first — the hub is locked until the rim opens.',
    meadow14: 'Gate tip needs two collars. Scan for ready cages.',
    meadow15: 'Side gates and tips. Outside-in on some, mixed on others.',
    meadow16: 'Hub plus tips — more than one first move. Think ahead.',
    meadow17: 'Grim’s meadow — tip cluster first. Locked cages stay shut.',
  };
  const tip = tips[graphKey] || tips.chain;
  if (worldId >= 2) return tip;
  return tip;
}

function buildPack() {
  const levels = [];
  const worldCount = WORLD_GRAPHS.length;
  for (let w = 0; w < worldCount; w += 1) {
    const cast = WORLD_CAST[w] || WORLD_CAST[WORLD_CAST.length - 1];
    const graphs = WORLD_GRAPHS[w];
    if (graphs.length !== 15) throw new Error(`World ${w + 1} needs 15 graphs, got ${graphs.length}`);
    const names = WORLD_NAME_SETS[w] || WORLD_NAME_SETS[0];
    for (let i = 0; i < 15; i += 1) {
      const id = w * 15 + i + 1;
      const graphKey = graphs[i];
      if (!GRAPHS[graphKey]) throw new Error(`Unknown graph ${graphKey}`);
      const painted = paintGraph(graphKey, id);
      const moveBump = Math.min(4, Math.floor(w / 2));
      const boss = i === 14;
      const maxMoves = BASE_MOVES[graphKey] + moveBump + (boss ? 2 : 0);
      const def = {
        id,
        worldId: w + 1,
        name: names[i],
        difficulty: boss ? 'Expert' : DIFF_FOR[graphKey],
        tip: tipFor(graphKey, w + 1),
        maxMoves,
        hero: cast.hero,
        villain: cast.villain,
        kids: kidsFor(painted.rings.length, id * 7),
        rings: painted.rings,
        links: painted.links,
        boss: boss || undefined,
        graph: graphKey,
      };
      if (id === 1) {
        def.tutorial = true;
        def.assist = true;
        def.tip = 'Each ring is a cage. Free orange so Mama can save the baby chick inside.';
      } else if (i < cast.assistUntil) {
        def.assist = true;
      }
      levels.push(def);
    }
  }
  return levels;
}

/** 150 levels across 10 worlds (15 each). */
export const LEVELS = buildPack();

const wrap = (a) => {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
};

/** Pick the gap direction that stays furthest away from every special direction on a ring. */
function bestAngle(specials) {
  if (!specials.length) return 0;
  let best = 0;
  let bestScore = -1;
  for (let d = -180; d < 180; d += 5) {
    const a = deg(d);
    const score = Math.min(...specials.map((s) => Math.abs(wrap(a - s))));
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

const SIZE_SCALE = { small: 0.78, big: 1.22, normal: 1 };

function ringSizeScale(r) {
  if (typeof r.size === 'number') return r.size;
  return SIZE_SCALE[r.size] || 1;
}

export function buildLevel(def) {
  const index = {};
  def.rings.forEach((r, i) => {
    index[r.id] = i;
  });

  const xs = def.rings.map((r) => r.pos[0]);
  const ys = def.rings.map((r) => r.pos[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const wU = maxX - minX;
  const hU = maxY - minY;

  // Pad for biggest rings (big ≈ 1.22×)
  const padU = (1.22 + THICK / 2) / (2 + STEM);
  const availW = BOARD_W - 16;
  const availH = PLAY_H - 18;
  const d = Math.min(MAX_D, availW / (wU + 2 * padU), availH / (hU + 2 * padU));
  const R = d / (2 + STEM);
  const T = R * THICK;
  const stem = R * STEM;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const rings = def.rings.map((r, i) => {
    const s = ringSizeScale(r);
    return {
      id: r.id,
      index: i,
      color: r.color,
      size: r.size || 'normal',
      rScale: s,
      R: R * s,
      T: T * s,
      x: BOARD_W / 2 + (r.pos[0] - cx) * d,
      y: PLAY_H / 2 + (r.pos[1] - cy) * d,
      angle: r.angle != null ? deg(r.angle) : null,
    };
  });

  const collars = def.links.map(([holderId, heldId]) => {
    const holder = rings[index[holderId]];
    const held = rings[index[heldId]];
    return {
      holder: holder.index,
      held: held.index,
      // direction from the held ring's centre toward its holder = where the collar sits on its tube
      phi: Math.atan2(holder.y - held.y, holder.x - held.x),
    };
  });

  // directions that must stay solid tube (stems leave from here, collars sit here)
  rings.forEach((ring) => {
    if (ring.angle != null) return;
    const specials = [];
    collars.forEach((c) => {
      if (c.held === ring.index) specials.push(c.phi);
      if (c.holder === ring.index) specials.push(wrap(c.phi + Math.PI));
    });
    ring.angle = bestAngle(specials);
  });

  return { d, R, T, stem, gap: GAP, rings, collars };
}
