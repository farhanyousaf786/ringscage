/**
 * Character catalog — swap looks here without touching game logic.
 *
 * HEROES = parent birds (Mama / Papa) who catch the babies at the bottom
 * KIDS   = fluffy baby hatchlings trapped in the ring-cages
 *
 * `kind` tells the sprite which silhouette to draw.
 */

export const HEROES = {
  // Mama — lavender hen, long lashes, flower, pink cape, heart badge
  nova: {
    id: 'nova',
    name: 'Mama',
    kind: 'parent',
    body: '#c9a8f2',
    bodyDark: '#a07ad6',
    belly: '#f1e6ff',
    iris: '#2f9a4a',
    tuft: 'feathers',
    tuftColor: '#ff7ab0',
    lashes: true,
    blush: '#ff8fb5',
    cape: '#ff6f91',
    capeDark: '#c93a58',
    badge: 'heart',
    accessory: 'flower',
  },
  // Papa — sky-blue dad, strong brows, red cape, bolt badge
  volt: {
    id: 'volt',
    name: 'Papa',
    kind: 'parent',
    body: '#6fb8ee',
    bodyDark: '#3f8cc8',
    belly: '#dff0ff',
    iris: '#8a5a2a',
    tuft: 'crest',
    tuftColor: '#2f6aa8',
    lashes: false,
    brows: '#2a4a70',
    blush: '#ff9eb5',
    cape: '#e85a4a',
    capeDark: '#a8382c',
    badge: 'bolt',
    accessory: null,
  },
  // Ruby — red hen, bow, golden cape, star badge
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    kind: 'parent',
    body: '#f07a6a',
    bodyDark: '#d4503f',
    belly: '#ffe3da',
    iris: '#6a3a9a',
    tuft: 'curl',
    tuftColor: '#d4503f',
    lashes: true,
    blush: '#ff9eb5',
    cape: '#ffc933',
    capeDark: '#c98a0c',
    badge: 'star',
    accessory: 'bow',
  },
};

/** Baby hatchlings — fluffy round chicks with huge eyes (ids are referenced by levels). */
export const KIDS = {
  seal: {
    id: 'seal',
    name: 'Skye',
    kind: 'chick',
    body: '#8fd0ff',
    bodyDark: '#5aa8e8',
    belly: '#e8f6ff',
    iris: '#8a5a2a',
    tuft: 'crest',
    tuftColor: '#bfe6ff',
    lashes: false,
    blush: '#ff9eb5',
  },
  kitty: {
    id: 'kitty',
    name: 'Peachy',
    kind: 'chick',
    body: '#ffb066',
    bodyDark: '#e88a3a',
    belly: '#ffe3c2',
    iris: '#3a9a50',
    tuft: 'tufts',
    tuftColor: '#ff9a4a',
    lashes: false,
    blush: '#ff9eb5',
  },
  bun: {
    id: 'bun',
    name: 'Fluff',
    kind: 'chick',
    body: '#fff1dc',
    bodyDark: '#e2c9a4',
    belly: '#fffaf0',
    iris: '#a8742e',
    tuft: 'crest',
    tuftColor: '#fff6e6',
    lashes: false,
    blush: '#ff9eb5',
  },
  fox: {
    id: 'fox',
    name: 'Sprout',
    kind: 'chick',
    body: '#a8d98c',
    bodyDark: '#78b85c',
    belly: '#e4f6d6',
    iris: '#3d8fd0',
    tuft: 'sprout',
    tuftColor: '#8cc86c',
    lashes: false,
    blush: '#ff9eb5',
  },
  cub: {
    id: 'cub',
    name: 'Sunny',
    kind: 'chick',
    body: '#ffe066',
    bodyDark: '#e8bd2a',
    belly: '#fff6c4',
    iris: '#c0701a',
    tuft: 'curl',
    tuftColor: '#f2c61e',
    lashes: false,
    blush: '#ff9eb5',
  },
  pup: {
    id: 'pup',
    name: 'Pearl',
    kind: 'chick',
    body: '#f6f2ee',
    bodyDark: '#d6cbc0',
    belly: '#ffffff',
    iris: '#5a7a9a',
    tuft: 'crest',
    tuftColor: '#ffffff',
    lashes: false,
    blush: '#ff9eb5',
  },
  pinky: {
    id: 'pinky',
    name: 'Rosie',
    kind: 'chick',
    body: '#f4a5b8',
    bodyDark: '#e07c96',
    belly: '#c8b0ea',
    iris: '#2f9a4a',
    tuft: 'feathers',
    tuftColor: '#9a3a8a',
    lashes: true,
    blush: '#ff9eb5',
  },
  mousy: {
    id: 'mousy',
    name: 'Biscuit',
    kind: 'chick',
    body: '#f0c8a0',
    bodyDark: '#d8a070',
    belly: '#fff0dc',
    iris: '#8a5a2a',
    tuft: 'curl',
    tuftColor: '#d8a070',
    lashes: false,
    blush: '#ff9eb5',
  },
  mint: {
    id: 'mint',
    name: 'Minty',
    kind: 'chick',
    body: '#86ead8',
    bodyDark: '#4cc4b0',
    belly: '#e0fffa',
    iris: '#d08a2a',
    tuft: 'sprout',
    tuftColor: '#4cc4b0',
    lashes: false,
    blush: '#ff9eb5',
  },
  cocoa: {
    id: 'cocoa',
    name: 'Cocoa',
    kind: 'chick',
    body: '#d4a070',
    bodyDark: '#b07c4c',
    belly: '#f8e0c4',
    iris: '#2f7a9a',
    tuft: 'tufts',
    tuftColor: '#b07c4c',
    lashes: false,
    blush: '#ff9eb5',
  },
  panda: {
    id: 'panda',
    name: 'Coral',
    kind: 'chick',
    body: '#ff8a7a',
    bodyDark: '#e05a4a',
    belly: '#ffe0d8',
    iris: '#7a4aa0',
    tuft: 'feathers',
    tuftColor: '#ffd24a',
    lashes: true,
    blush: '#ff9eb5',
  },
};

export const DEFAULT_HERO = 'nova';
export const DEFAULT_VILLAIN = 'grim';

/** Mean birds who locked the chicks in the cages — right side of the bay. */
export const VILLAINS = {
  grim: {
    id: 'grim',
    name: 'Grim',
    kind: 'villain',
    villain: true,
    body: '#5a4a68',
    bodyDark: '#3a2e48',
    belly: '#7a6888',
    iris: '#e85a4a',
    tuft: 'horns',
    tuftColor: '#2a2030',
    lashes: false,
    brows: '#1a1020',
    blush: '#6a4058',
    cape: '#2a2038',
    capeDark: '#140e1c',
  },
  hex: {
    id: 'hex',
    name: 'Hex',
    kind: 'villain',
    villain: true,
    body: '#3d6a58',
    bodyDark: '#2a4a3c',
    belly: '#5a8870',
    iris: '#ffd24a',
    tuft: 'spikes',
    tuftColor: '#1a3028',
    lashes: false,
    brows: '#142018',
    blush: '#4a6858',
    cape: '#1e3a30',
    capeDark: '#0e1c18',
  },
  snag: {
    id: 'snag',
    name: 'Snag',
    kind: 'villain',
    villain: true,
    body: '#8a3a3a',
    bodyDark: '#5a2020',
    belly: '#a85858',
    iris: '#ff9a3a',
    tuft: 'horns',
    tuftColor: '#2a1010',
    lashes: false,
    brows: '#1a0808',
    blush: '#6a3030',
    cape: '#3a1018',
    capeDark: '#1a080c',
  },
};

const KID_ORDER = Object.keys(KIDS);

export function kidIdForIndex(i) {
  return KID_ORDER[i % KID_ORDER.length];
}

export function getHero(id) {
  return HEROES[id] || HEROES[DEFAULT_HERO];
}

export function getKid(id) {
  return KIDS[id] || KIDS.seal;
}

export function getVillain(id) {
  return VILLAINS[id] || VILLAINS[DEFAULT_VILLAIN];
}
