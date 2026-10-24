/**
 * Cute dialogue for Mama/Papa/Ruby and the baby chicks.
 * Pick by difficulty so Easy feels soft and Expert feels a little braver.
 */

const EASY = [
  'Hi sweetie! I will save you all.',
  'Hold on, little ones — Mama is here!',
  'Don’t cry, I’m coming for every cage.',
  'One soft twist and you’re free!',
  'Aww, I see you! Stay cozy.',
  'Tiny peeps, I’m on my way!',
  'No cage can keep us apart.',
  'Smile for Mama — rescue time!',
  'Soft flaps, soft turns… here I come.',
  'I’ve got snacks after we free you!',
  'Be brave, fluffballs. I love you.',
  'Easy does it. You’re almost home.',
  'Peekaboo! Mama sees every chick.',
  'Warm wings waiting for you.',
  'Let’s open these rings together.',
  'Sweet peeps, hang tight for me.',
  'I promise: every baby comes home.',
  'Gentle twists only — I’ve got this.',
  'Your fluff is safe with me.',
  'Come to Mama, one cage at a time.',
  'Little hearts, big rescue!',
  'Shh… Mama’s opening the locks.',
  'You’re my favorite peeps forever.',
  'Wiggle free — I’m right here.',
  'Soft landings for every chick!',
  'Cages down, cuddles up!',
  'I won’t leave a single peep behind.',
  'Ready? Let’s free the orange first!',
  'Tiny beaks, big bravery.',
  'Mama’s cape is ready — let’s go!',
];

const MEDIUM = [
  'Okay team — a few more cages to crack!',
  'Stay calm, peeps. Papa’s thinking.',
  'Two collars? Easy for a careful twist.',
  'I’ve got eyes on every locked ring.',
  'Fork paths ahead — still saving you all.',
  'Don’t worry if it looks twisty.',
  'One smart turn frees a whole branch.',
  'Medium maze, maximum cuddles after!',
  'Count with me… free, free, free!',
  'You’re doing great just by waiting.',
  'Papa won’t rush — safe and sure.',
  'Those collars don’t scare me.',
  'Hold still, little stars.',
  'I can see the way out already.',
  'Brave chicks for a braver rescue!',
  'A little puzzle, a lot of love.',
  'Watch me unlock this chain.',
  'Stay peepy — help is spinning in.',
  'No chick left locked today.',
  'Careful moves, soft landings.',
  'You’re my lucky flock.',
  'Twisty forks? I’ve practiced.',
  'Breathe, fluff. I’m almost there.',
  'Every collar opens for us.',
  'Medium challenge, full-heart save!',
  'Keep peeping — I hear you.',
  'This cage can’t outsmart family.',
  'One more smart turn… got it!',
  'Proud of you for waiting.',
  'Papa’s coming through the fork!',
];

const HARD = [
  'Hard cages, soft heart — I’m ready.',
  'Double locks? Double care from me.',
  'Stay brave, peeps. This needs focus.',
  'I won’t waste a move — promise.',
  'Tricky rings, but you’re worth it.',
  'Deep breath… then we free you.',
  'Ruby’s on the hard path for you.',
  'Two collars mean two soft clicks.',
  'Hold on — precision rescue mode!',
  'Every move counts. So do you.',
  'I see the double lock. I’ve got it.',
  'Tough stage, tougher love.',
  'No rushing. Smart freeing only.',
  'You’re safe as long as I’m spinning.',
  'Hard doesn’t mean impossible.',
  'Count the moves with me, fluff.',
  'Careful… careful… free!',
  'These cages picked the wrong parent.',
  'Focus face on. Cuddles later.',
  'I won’t drop a single peep.',
  'Double lock, single promise: home.',
  'Stay tiny, stay hopeful.',
  'Hard rings, soft landings ahead.',
  'Watch the two collars — both open.',
  'You’re my brave little flock.',
  'One wrong spin? We try again soft.',
  'Precision peeps rescue, go!',
  'I’m not leaving till every cage flies.',
  'Hard level, soft “I love you.”',
  'Hang in there — Ruby’s unlocking.',
];

const EXPERT = [
  'The Knot looks scary… I’m still coming.',
  'Expert cages, expert hugs after!',
  'Outside in, peeps. Trust Mama.',
  'This tangle can’t keep you forever.',
  'Deep maze, deeper love.',
  'Stay peeping — I need your voices.',
  'Seven cages, seven soft rescues.',
  'I mapped every collar in my heart.',
  'Expert mode: calm wings, careful turns.',
  'You are worth every tricky spin.',
  'Outside rings first — then you fly home.',
  'The Knot ends with cuddles. Always.',
  'Brave flock for the hardest stage!',
  'I won’t blink till you’re free.',
  'Expert puzzle, baby steps.',
  'Listen — Mama’s already freeing one.',
  'No peep stays lost in The Knot.',
  'Hardest cages. Softest rescue.',
  'Count with me from the outside in.',
  'You’re my whole sky of stars.',
  'Stay tiny. Stay loud. I’m coming.',
  'This knot unties for family.',
  'Expert hearts don’t give up.',
  'Every freed cage is a little cheer!',
  'I see the path. Hold on, fluff.',
  'Seven peeps, zero left behind.',
  'The Knot shakes — we’re winning.',
  'Careful twists, big brave love.',
  'Mama vs The Knot. Mama wins.',
  'Almost a party — keep believing!',
];

const ANY = [
  'Hi sweetie! I will save you all.',
  'Come here, fluffball — you’re next!',
  'Wings out, worries out!',
  'Peep peep — rescue is rolling!',
  'Soft hug waiting at the bottom!',
  'I hear every tiny chirp.',
  'Cage open… chick free… yay!',
  'You’re never alone in a ring.',
  'Let’s make these rings fly away!',
  'My favorite sound is your peep.',
  'Home is right under these cages.',
  'One by one, into soft wings.',
  'I practice twirls just for you.',
  'Fluffy hearts, locked doors — nope!',
  'Today we free the whole flock.',
  'Tiny toes, big freedom soon.',
  'I’m the softest rescue squad.',
  'Peek from the gap — I’m smiling.',
  'Every collar is a little goodbye.',
  'After this: snacks and snuggles.',
  'You’re cuter than every star.',
  'Ring goes whoosh — chick goes yay!',
  'Hold my wing in your heart.',
  'No locked cage beats family.',
  'I save peeps for breakfast, lunch, forever.',
  'Chirp once if you hear Mama!',
  'Soft landings only today.',
  'Your fluff is my mission.',
  'Let’s turn “stuck” into “free”.',
  'Ready? Cute rescue starting now!',
];

export const HERO_LINES = {
  Easy: [...EASY, ...ANY.slice(0, 20)],
  Medium: [...MEDIUM, ...ANY.slice(10, 30)],
  Hard: [...HARD, ...ANY.slice(5, 25)],
  Expert: [...EXPERT, ...ANY.slice(0, 20)],
};

/** Smug taunts when the player taps a locked cage. */
export const VILLAIN_TAUNTS = [
  'Ha! Locked!',
  'Nice try!',
  'Wrong ring!',
  'Mine forever!',
  'Not so fast!',
  'Hehe… stuck!',
  'Oops for you!',
  'Still caged!',
  'Too easy!',
  'Cry more!',
  'My cages!',
  'Nope!',
];

/** Growls when a chick escapes. */
export const VILLAIN_ANGRY = [
  'Nooo!',
  'Hey!',
  'Give back!',
  'Grr…',
  'Stop that!',
  'Not fair!',
  'My peep!',
  'Argh!',
];

/** Ambient mid-game grumbles — villain is always a little mad. */
export const VILLAIN_IDLE = [
  'Stay locked…',
  'Don’t free them.',
  'My cages. Mine.',
  'Grr…',
  'Keep spinning wrong!',
  'Heh. Stuck forever.',
  'No rescue today.',
  'Hands off!',
  'Still mine!',
  'Cute? No. Caged.',
  'Turn elsewhere!',
  'I built these locks.',
  'Peeps stay put.',
  'Mama can’t win…',
  'Watch and fail!',
  'Rings are my toys.',
];

/** Soft mid-game pep from Mama/Papa while playing. */
export const HERO_BANTER = [
  'I’ve got you!',
  'Almost there…',
  'Careful, fluff.',
  'One more twist!',
  'Stay brave!',
  'Ignore Grim!',
  'Soft and sure…',
  'You’re doing great!',
  'Find the free ring!',
  'I’m right here.',
  'Don’t rush, love.',
  'We can free them!',
  'Listen for the click!',
  'Brave little peeps!',
  'Focus… open… free!',
  'Mama believes in you!',
];

/** Short peeps from babies still in cages — use sparingly. */
export const KID_LINES = [
  'save us!',
  'mama…',
  'help!',
  'peep!',
  'free me',
  'stuck!',
  'please?',
  'hi…',
  'open!',
  'hug?',
  'scared',
  'yay soon?',
  'come!',
  'unlock',
  'soft…',
  'chirp!',
  'wait!',
  'love you',
  'pick me',
  'out!',
];

function pick(arr, seed = Math.random()) {
  if (!arr || !arr.length) return '';
  const i = Math.floor((seed % 1) * arr.length);
  return arr[i] || arr[0];
}

/** One random hero line for this stage (stable per call). */
export function pickHeroLine(difficulty, seed = Math.random()) {
  const pool = HERO_LINES[difficulty] || HERO_LINES.Easy;
  return pick(pool, seed);
}

export function pickKidLine(seed = Math.random()) {
  return pick(KID_LINES, seed);
}

export function pickVillainTaunt(seed = Math.random()) {
  return pick(VILLAIN_TAUNTS, seed);
}

export function pickVillainAngry(seed = Math.random()) {
  return pick(VILLAIN_ANGRY, seed);
}

export function pickVillainIdle(seed = Math.random()) {
  return pick(VILLAIN_IDLE, seed);
}

export function pickHeroBanter(seed = Math.random()) {
  return pick(HERO_BANTER, seed);
}

/** How many lines we actually ship (for sanity). */
export function lineCount() {
  return {
    Easy: HERO_LINES.Easy.length,
    Medium: HERO_LINES.Medium.length,
    Hard: HERO_LINES.Hard.length,
    Expert: HERO_LINES.Expert.length,
    kids: KID_LINES.length,
    totalHero: Object.values(HERO_LINES).reduce((n, a) => n + a.length, 0),
  };
}
