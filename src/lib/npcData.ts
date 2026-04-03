// ---------------------------------------------------------------------------
// NPC Generator — Data pools
// ---------------------------------------------------------------------------

export const FIRST_NAMES = [
  // Human
  "Aldric", "Brenna", "Caspian", "Dara", "Elara", "Finn", "Greta", "Hugo",
  "Isolde", "Jasper", "Kira", "Leander", "Mira", "Nolan", "Orla", "Pax",
  "Quinn", "Rowan", "Sera", "Theron", "Una", "Vance", "Wren", "Xander",
  // Elvish
  "Aelindra", "Caelum", "Erevan", "Faelyn", "Galathil", "Isilwen", "Lirael",
  "Naerys", "Thalion", "Vaelin",
  // Dwarvish
  "Balin", "Dagna", "Grundi", "Helga", "Thorin", "Brynhild", "Korrin", "Magda",
  // Halfling
  "Bramble", "Corrin", "Lidda", "Merric", "Pippa", "Rosalind", "Stumbleduck",
  // Exotic
  "Ash'kari", "Drazzt", "K'thriss", "Nethys", "Rix'tael", "Zephyra",
];

export const LAST_NAMES = [
  "Ashford", "Blackthorn", "Copperfield", "Darkholme", "Evergreen",
  "Frostbeard", "Goldenleaf", "Hawksworth", "Ironforge", "Jade",
  "Kingsley", "Lightfoot", "Moonshadow", "Nightingale", "Oakenheart",
  "Proudfoot", "Quicksilver", "Ravencrest", "Stormwind", "Thornberry",
  "Underhill", "Voidwalker", "Winterborn", "Yarrow", "Zephyrstone",
  "Brightblade", "Cindervale", "Duskmantle", "Emberforge", "Greycastle",
  "Hearthstone", "Mistwalker", "Shadowmere", "Starfall", "Trueheart",
];

export const RACES = [
  "Human", "Elf", "Half-Elf", "Dwarf", "Halfling", "Gnome",
  "Half-Orc", "Tiefling", "Dragonborn", "Goliath", "Aasimar",
  "Tabaxi", "Firbolg", "Kenku", "Tortle", "Genasi",
];

export const GENDERS = ["Male", "Female", "Non-binary"];

export const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

export const OCCUPATIONS = [
  // Mundane
  "Blacksmith", "Tavern keeper", "Merchant", "Farmer", "Baker", "Fisher",
  "Carpenter", "Weaver", "Tanner", "Potter", "Herbalist", "Midwife",
  "Stable hand", "Ferryman", "Lamplighter", "Gravedigger",
  // Skilled
  "Alchemist", "Scribe", "Cartographer", "Jeweler", "Locksmith",
  "Shipwright", "Glassblower", "Perfumer", "Clockmaker",
  // Adventuring/Military
  "Sellsword", "Bounty hunter", "Caravan guard", "Scout", "Sailor",
  "Retired adventurer", "Gladiator", "Knight errant",
  // Social
  "Bard", "Priest", "Scholar", "Noble", "Diplomat", "Spy",
  "Fence", "Smuggler", "Guild master", "Town crier",
  // Arcane
  "Hedge wizard", "Fortune teller", "Apothecary", "Enchanter",
  "Rune carver", "Summoner's apprentice",
];

export const PERSONALITY_TRAITS = [
  "Fiercely loyal to friends", "Hopelessly superstitious", "Compulsively honest",
  "Deeply suspicious of strangers", "Overconfident in their abilities",
  "Secretly kind beneath a gruff exterior", "Prone to dramatic storytelling",
  "Obsessed with a particular hobby", "Never forgives a slight",
  "Speaks in riddles and proverbs", "Collects strange trinkets",
  "Afraid of magic", "Overly generous to a fault", "Terrible with money",
  "Fanatically devoted to their faith", "Constantly scheming",
  "Melancholic and brooding", "Infectiously cheerful",
  "Paranoid about being followed", "Compulsive gambler",
  "Holds grudges for decades", "Tells elaborate lies for fun",
  "Extremely competitive", "Quiet and observant",
  "Talks to animals as if they understand", "Unreliable but charming",
  "Meticulously organized", "Wildly impulsive",
  "Haunted by past mistakes", "Always hungry",
  "Laughs at inappropriate times", "Refuses to use doors",
];

export const APPEARANCE_FEATURES = [
  "Prominent scar across the face", "Mismatched eyes (one blue, one brown)",
  "Missing finger on left hand", "Unusually tall", "Strikingly short",
  "Wild unkempt hair", "Elaborate tattoos covering arms",
  "Always wears a distinctive hat", "Walks with a noticeable limp",
  "Piercing green eyes", "Prematurely grey hair", "Burn marks on hands",
  "Missing an ear", "Covered in freckles", "Unnaturally pale skin",
  "Muscular and imposing", "Thin and gaunt", "Rosy-cheeked and plump",
  "Always immaculately dressed", "Perpetually disheveled",
  "Gold tooth", "Eye patch", "Braided beard with beads",
  "Birthmark shaped like a crescent", "Heterochromatic eyes",
  "Weathered and sun-beaten skin", "Youthful face despite old age",
  "Hands stained with ink or dye", "Nervous tic (eye twitch)",
];

export const VOICE_MANNERISMS = [
  "Deep gravelly voice", "High-pitched and nasally", "Singsong cadence",
  "Speaks very slowly and deliberately", "Rapid-fire talker",
  "Whispers everything", "Booming and theatrical", "Gentle and soothing",
  "Stutters when nervous", "Laughs between sentences",
  "Uses elaborate hand gestures", "Speaks in the third person",
  "Constant throat clearing", "Dry monotone", "Strong foreign accent",
  "Ends every sentence as a question", "Hums between words",
  "Snorts when laughing", "Clicks tongue while thinking",
  "Speaks only in short clipped sentences", "Overly formal and verbose",
];

export const MOTIVATIONS = [
  "Seeking revenge against someone who wronged them",
  "Desperate to pay off a crushing debt",
  "Searching for a lost family member",
  "Hiding from a powerful enemy",
  "Trying to earn enough to retire peacefully",
  "Seeking forbidden knowledge",
  "Driven by religious fervor",
  "Wants to prove themselves to their family",
  "Addicted to the thrill of danger",
  "Protecting someone they love",
  "Building a legacy or monument",
  "Atoning for a terrible past deed",
  "Climbing the social ladder by any means",
  "Preserving an ancient tradition",
  "Collecting rare items or artifacts",
];

export const SECRETS = [
  "Is actually a spy for a rival faction",
  "Murdered someone in their past",
  "Has a hidden magical ability they suppress",
  "Is in love with someone forbidden",
  "Owes a debt to a devil or fey",
  "Witnessed a terrible crime and said nothing",
  "Is not who they claim to be (false identity)",
  "Has a terminal illness they hide from everyone",
  "Is secretly wealthy but pretends to be poor",
  "Made a bargain with a dark power",
  "Knows the location of a hidden treasure",
  "Is being blackmailed",
  "Has a child they abandoned",
  "Was once part of a cult",
  "Carries a cursed item they can't be rid of",
];

export const BACKGROUNDS = [
  "Grew up on the streets, surviving by wit and theft",
  "Was raised in a wealthy family but fell from grace",
  "Former soldier who deserted during a battle",
  "Apprenticed to a master craftsperson for many years",
  "Refugee from a destroyed homeland",
  "Grew up in a traveling circus or carnival",
  "Was kidnapped as a child and raised by captors",
  "Served in a temple before losing their faith",
  "Was a sailor who survived a shipwreck",
  "Inherited their business from a deceased relative",
  "Studied at a prestigious academy before dropping out",
  "Was raised by non-human adoptive parents",
  "Former prisoner who served time for a crime",
  "Wandered as a nomad before settling down",
  "Was cursed by a witch and is seeking a cure",
];

export const LOCATIONS = [
  "The Rusty Tankard tavern", "Town marketplace", "Temple district",
  "Docks warehouse", "Castle courtyard", "Forest clearing",
  "Underground smuggler den", "Wizard's tower", "Graveyard chapel",
  "Traveling caravan", "Mining camp", "Noble's estate",
  "Sewers beneath the city", "Abandoned watchtower", "Crossroads inn",
];

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

export interface NpcData {
  name: string;
  race: string;
  gender: string;
  alignment: string;
  occupation: string;
  location: string;
  personalityTraits: string[];
  appearance: string;
  voiceMannerism: string;
  background: string;
  motivation: string;
  secret: string;
  notes: string;
  isVisible: boolean;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateRandomNpc(): NpcData {
  const traitCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  return {
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    race: pick(RACES),
    gender: pick(GENDERS),
    alignment: pick(ALIGNMENTS),
    occupation: pick(OCCUPATIONS),
    location: "",
    personalityTraits: pickMultiple(PERSONALITY_TRAITS, traitCount),
    appearance: pick(APPEARANCE_FEATURES),
    voiceMannerism: pick(VOICE_MANNERISMS),
    background: pick(BACKGROUNDS),
    motivation: pick(MOTIVATIONS),
    secret: pick(SECRETS),
    notes: "",
    isVisible: false,
  };
}

export const EMPTY_NPC: NpcData = {
  name: "",
  race: "",
  gender: "",
  alignment: "",
  occupation: "",
  location: "",
  personalityTraits: [],
  appearance: "",
  voiceMannerism: "",
  background: "",
  motivation: "",
  secret: "",
  notes: "",
  isVisible: false,
};
