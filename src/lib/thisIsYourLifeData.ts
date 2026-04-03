// ---------------------------------------------------------------------------
// "This Is Your Life" — All tables from Xanathar's Guide to Everything
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dice helpers
// ---------------------------------------------------------------------------

/** Roll 1dN (1-indexed result) */
export function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Roll XdY and sum */
export function roll(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += d(sides);
  return total;
}

/** Pick a random element from an array */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ---------------------------------------------------------------------------
// d100 range-table lookup helper
// ---------------------------------------------------------------------------

export interface RangeEntry<T = string> {
  min: number;
  max: number;
  value: T;
}

export function rollOnTable<T>(table: readonly RangeEntry<T>[]): T {
  const r = d(100);
  for (const entry of table) {
    if (r >= entry.min && r <= entry.max) return entry.value;
  }
  return table[table.length - 1]!.value;
}

// ---------------------------------------------------------------------------
// Birthplace (d100)
// ---------------------------------------------------------------------------

export const BIRTHPLACE_TABLE: RangeEntry[] = [
  { min: 1, max: 50, value: "Home" },
  { min: 51, max: 55, value: "Home of a family friend" },
  { min: 56, max: 63, value: "Home of a healer or midwife" },
  { min: 64, max: 65, value: "Carriage, cart, or wagon" },
  { min: 66, max: 68, value: "Barn, shed, or other outbuilding" },
  { min: 69, max: 70, value: "Cave" },
  { min: 71, max: 72, value: "Field" },
  { min: 73, max: 74, value: "Forest" },
  { min: 75, max: 77, value: "Temple" },
  { min: 78, max: 78, value: "Battlefield" },
  { min: 79, max: 80, value: "Alley or street" },
  { min: 81, max: 82, value: "Brothel, tavern, or inn" },
  { min: 83, max: 84, value: "Castle, keep, tower, or palace" },
  { min: 85, max: 85, value: "Sewer or rubbish heap" },
  { min: 86, max: 88, value: "Among people of a different race" },
  { min: 89, max: 91, value: "On board a boat or ship" },
  { min: 92, max: 93, value: "In a prison or in the headquarters of a secret organization" },
  { min: 94, max: 95, value: "In a sage's laboratory" },
  { min: 96, max: 96, value: "In the Feywild" },
  { min: 97, max: 97, value: "In the Shadowfell" },
  { min: 98, max: 98, value: "On the Astral Plane or the Ethereal Plane" },
  { min: 99, max: 99, value: "On an Inner Plane of your choice" },
  { min: 100, max: 100, value: "On an Outer Plane of your choice" },
];

// ---------------------------------------------------------------------------
// Parent Knowledge (d100)
// ---------------------------------------------------------------------------

export const PARENT_KNOWLEDGE_TABLE: RangeEntry[] = [
  { min: 1, max: 95, value: "You know who your parents are or were." },
  { min: 96, max: 100, value: "You do not know who your parents were." },
];

// ---------------------------------------------------------------------------
// Half-Elf Parents (d8)
// ---------------------------------------------------------------------------

export const HALF_ELF_PARENTS = [
  "One parent was an elf and the other was a human.",
  "One parent was an elf and the other was a human.",
  "One parent was an elf and the other was a human.",
  "One parent was an elf and the other was a human.",
  "One parent was an elf and the other was a human.",
  "One parent was an elf and the other was a half-elf.",
  "One parent was a human and the other was a half-elf.",
  "Both parents were half-elves.",
];

export const HALF_ORC_PARENTS = [
  "One parent was an orc and the other was a human.",
  "One parent was an orc and the other was a human.",
  "One parent was an orc and the other was a human.",
  "One parent was an orc and the other was a human.",
  "One parent was an orc and the other was a human.",
  "One parent was an orc and the other was a half-orc.",
  "One parent was a human and the other was a half-orc.",
  "Both parents were half-orcs.",
];

export const TIEFLING_PARENTS = [
  "Both parents were humans, their infernal heritage dormant until you came along.",
  "Both parents were humans, their infernal heritage dormant until you came along.",
  "Both parents were humans, their infernal heritage dormant until you came along.",
  "Both parents were humans, their infernal heritage dormant until you came along.",
  "One parent was a tiefling and the other was a human.",
  "One parent was a tiefling and the other was a human.",
  "One parent was a tiefling and the other was a devil.",
  "One parent was a human and the other was a devil.",
];

// ---------------------------------------------------------------------------
// Alignment (3d6)
// ---------------------------------------------------------------------------

export function rollAlignment(): string {
  const r = roll(3, 6);
  if (r <= 3) return "Chaotic Evil";
  if (r <= 5) return "Lawful Evil";
  if (r <= 8) return "Neutral Evil";
  if (r <= 12) return "True Neutral";
  if (r <= 15) return "Neutral Good";
  if (r <= 17) return "Lawful Good";
  return "Chaotic Good";
}

// ---------------------------------------------------------------------------
// Occupation (d100)
// ---------------------------------------------------------------------------

export const OCCUPATION_TABLE: RangeEntry[] = [
  { min: 1, max: 5, value: "Academic" },
  { min: 6, max: 10, value: "Adventurer" },
  { min: 11, max: 11, value: "Aristocrat" },
  { min: 12, max: 26, value: "Artisan or guild member" },
  { min: 27, max: 31, value: "Criminal" },
  { min: 32, max: 36, value: "Entertainer" },
  { min: 37, max: 38, value: "Exile, hermit, or refugee" },
  { min: 39, max: 43, value: "Explorer or wanderer" },
  { min: 44, max: 55, value: "Farmer or herder" },
  { min: 56, max: 60, value: "Hunter or trapper" },
  { min: 61, max: 75, value: "Laborer" },
  { min: 76, max: 80, value: "Merchant" },
  { min: 81, max: 85, value: "Politician or bureaucrat" },
  { min: 86, max: 90, value: "Priest" },
  { min: 91, max: 95, value: "Sailor" },
  { min: 96, max: 100, value: "Soldier" },
];

// ---------------------------------------------------------------------------
// Relationship (3d4)
// ---------------------------------------------------------------------------

export function rollRelationship(): string {
  const r = roll(3, 4);
  if (r <= 4) return "Hostile";
  if (r <= 10) return "Friendly";
  return "Indifferent";
}

// ---------------------------------------------------------------------------
// Status (3d6)
// ---------------------------------------------------------------------------

export interface StatusResult {
  label: string;
  detail?: string;
}

export function rollStatus(): StatusResult {
  const r = roll(3, 6);
  if (r <= 3) {
    const causes = [
      "Unknown cause of death",
      "Murdered",
      "Killed in battle",
      "Accident related to class or occupation",
      "Accident unrelated to class or occupation",
      "Natural causes, such as disease or old age",
      "Apparent suicide",
      "Torn apart by an animal or a natural disaster",
      "Consumed by a monster",
      "Executed for a crime or tortured to death",
      "Bizarre event, such as being hit by a meteorite, struck down by an angry god, or killed by a hatching slaad egg",
      "Old age",
    ];
    return { label: "Dead", detail: `Cause: ${pickRandom(causes)}` };
  }
  if (r <= 5) return { label: "Missing or unknown" };
  if (r <= 8) return { label: "Alive, but doing poorly due to injury, financial trouble, or relationship difficulties" };
  if (r <= 12) return { label: "Alive and well" };
  if (r <= 15) return { label: "Alive and quite successful" };
  if (r <= 17) return { label: "Alive and infamous" };
  return { label: "Alive and famous" };
}

// ---------------------------------------------------------------------------
// Number of Siblings (d10, modified by race)
// ---------------------------------------------------------------------------

export function getRaceSiblingModifier(race: string): number {
  const lower = race.toLowerCase();
  if (lower.includes("elf") || lower.includes("dwarf")) return -2;
  if (lower.includes("halfling")) return 2;
  return 0;
}

export function rollNumberOfSiblings(race: string): number {
  const r = d(10) + getRaceSiblingModifier(race);
  if (r <= 2) return 0;
  if (r <= 4) return roll(1, 3);
  if (r <= 6) return roll(1, 4) + 1;
  if (r <= 8) return roll(2, 4);
  return roll(1, 6) + 2;
}

// ---------------------------------------------------------------------------
// Birth Order (2d6)
// ---------------------------------------------------------------------------

export function rollBirthOrder(): string {
  const r = roll(2, 6);
  if (r === 2) return "Twin, triplet, or quadruplet";
  if (r <= 7) return "Older";
  return "Younger";
}

// ---------------------------------------------------------------------------
// Who Raised You (d100)
// ---------------------------------------------------------------------------

export const RAISED_BY_TABLE: RangeEntry[] = [
  { min: 1, max: 1, value: "Nobody" },
  { min: 2, max: 2, value: "Institution, such as an asylum" },
  { min: 3, max: 4, value: "Temple" },
  { min: 5, max: 6, value: "Orphanage" },
  { min: 7, max: 8, value: "Guardian" },
  { min: 9, max: 10, value: "Paternal or maternal aunt, uncle, or both; or extended family such as a tribe or clan" },
  { min: 11, max: 12, value: "Paternal or maternal grandparent(s)" },
  { min: 13, max: 14, value: "Adoptive family (same or different race)" },
  { min: 15, max: 16, value: "Adoptive family (different race)" },
  { min: 17, max: 18, value: "Guardian" },
  { min: 19, max: 20, value: "Paternal or maternal figure (father or mother)" },
  { min: 21, max: 100, value: "Both parents" },
];

// ---------------------------------------------------------------------------
// Absent Parent (d4)
// ---------------------------------------------------------------------------

export const ABSENT_PARENT_REASONS = [
  "Your parent died (roll on the Cause of Death supplemental table).",
  "Your parent was imprisoned, enslaved, or otherwise taken away.",
  "Your parent abandoned you.",
  "Your parent disappeared to an unknown fate.",
];

// ---------------------------------------------------------------------------
// Family Lifestyle (3d6)
// ---------------------------------------------------------------------------

export function rollFamilyLifestyle(): { lifestyle: string; modifier: number } {
  const r = roll(3, 6);
  if (r <= 3) return { lifestyle: "Wretched", modifier: -40 };
  if (r <= 5) return { lifestyle: "Squalid", modifier: -20 };
  if (r <= 8) return { lifestyle: "Poor", modifier: -10 };
  if (r <= 12) return { lifestyle: "Modest", modifier: 0 };
  if (r <= 15) return { lifestyle: "Comfortable", modifier: 10 };
  if (r <= 17) return { lifestyle: "Wealthy", modifier: 20 };
  return { lifestyle: "Aristocratic", modifier: 40 };
}

// ---------------------------------------------------------------------------
// Childhood Home (d100 + lifestyle modifier)
// ---------------------------------------------------------------------------

export function rollChildhoodHome(lifestyleModifier: number): string {
  const r = d(100) + lifestyleModifier;
  if (r <= 0) return "On the streets";
  if (r <= 20) return "Rundown shack";
  if (r <= 30) return "No permanent residence; you moved around a lot";
  if (r <= 40) return "Encampment or village in the wilderness";
  if (r <= 50) return "Apartment in a rundown neighborhood";
  if (r <= 70) return "Small house";
  if (r <= 90) return "Large house";
  if (r <= 110) return "Mansion";
  return "Palace or castle";
}

// ---------------------------------------------------------------------------
// Childhood Memories (d6 + CHA modifier)
// ---------------------------------------------------------------------------

export function rollChildhoodMemories(charismaModifier: number): string {
  const r = d(6) + charismaModifier;
  if (r <= 3) return "I am still haunted by my childhood, when I was treated badly by my companions.";
  if (r <= 5) return "I spent most of my childhood alone, with no close friends.";
  if (r <= 8) return "Others saw me as being different or strange, and so I had few companions.";
  if (r <= 12) return "I had a few close friends and lived an ordinary childhood.";
  if (r <= 15) return "I had several friends, and my childhood was generally a happy one.";
  if (r <= 17) return "I always found it easy to make friends, and I loved being around people.";
  return "Everyone knew who I was, and I had friends everywhere I went.";
}

// ---------------------------------------------------------------------------
// Age brackets for life events (race-aware)
// ---------------------------------------------------------------------------

export function getAgeCategory(age: number, race: string): number {
  // Long-lived races use different thresholds
  const lower = race.toLowerCase();
  const isLongLived = lower.includes("elf") || lower.includes("dwarf") || lower.includes("gnome");

  if (isLongLived) {
    if (age <= 100) return 1;    // 1d4 events (equivalent to "young")
    if (age <= 200) return 2;    // 1d6
    if (age <= 400) return 3;    // 1d8
    if (age <= 600) return 4;    // 1d10
    return 5;                     // 1d12
  }

  // Standard races
  if (age <= 20) return 0;
  if (age <= 30) return 1;
  if (age <= 40) return 2;
  if (age <= 60) return 3;
  if (age <= 100) return 4;
  return 5;
}

export function rollLifeEventCount(age: number, race: string): number {
  const cat = getAgeCategory(age, race);
  switch (cat) {
    case 0: return 1;
    case 1: return roll(1, 4);
    case 2: return roll(1, 6);
    case 3: return roll(1, 8);
    case 4: return roll(1, 10);
    case 5: return roll(1, 12);
    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// Tragedies (d12)
// ---------------------------------------------------------------------------

export const TRAGEDIES = [
  "A family member or a close friend died. Roll on the Cause of Death supplemental table to find out how.",
  "A family member or a close friend died. Roll on the Cause of Death supplemental table to find out how.",
  "A friendship ended bitterly, and the other person is now hostile to you. The cause might have been a misunderstanding or something you or the former friend did.",
  "You lost all your possessions in a disaster, and you had to rebuild your life.",
  "You were imprisoned for a crime you didn't commit and spent {1d6} years at hard labor, in jail, or shackled to an oar in a slave galley.",
  "War ravaged your home community, reducing everything to rubble and ruin. In the aftermath, you either helped to rebuild or moved somewhere else.",
  "A lover disappeared without a trace. You have been looking for that person ever since.",
  "A terrible blight in your home community caused crops to fail, and many starved. You lost a loved one or a good friend to starvation.",
  "You did something that brought terrible shame to you in the eyes of your family. You might have been banished.",
  "For a reason you were never told, you were exiled from your community. You then either found a new place to live or you keep wandering.",
  "A romantic partner of yours died. Roll on the Cause of Death supplemental table to find out how. If the result is murder, roll a d12. On a 1, you were responsible.",
  "You were involved in a terrible scandal that still follows you to this day.",
];

// ---------------------------------------------------------------------------
// Boons (d10)
// ---------------------------------------------------------------------------

export const BOONS = [
  "A friendly wizard gave you a spell scroll containing one cantrip (of the DM's choice).",
  "You saved a farmer's crop from being devoured by a pest, and the farmer rewarded you with a potion of healing.",
  "You received an inheritance of {1d20x25} gp after a relative's passing.",
  "A distant relative left you a simple dwelling in a remote area.",
  "You found a riding horse, pony, or camel.",
  "A map given to you by an old friend or family member revealed the location of a hidden treasure.",
  "A relative bequeathed you a simple weapon of your choice.",
  "You found a gem worth {2d6x10} gp.",
  "You managed to save enough gold to buy a piece of adventuring gear from the Adventuring Gear table in the PHB.",
  "A grateful noble gave you a letter of recommendation you can use to gain an audience with a local person of importance.",
];

// ---------------------------------------------------------------------------
// War (d12)
// ---------------------------------------------------------------------------

export const WAR_OUTCOMES = [
  "You were knocked out and left for dead. You woke up hours later with no recollection of the battle.",
  "You were badly injured in the fight, and you still carry the awful scars of those wounds.",
  "You were badly injured in the fight, and you still carry the awful scars of those wounds.",
  "You ran away from the battle to save your life, but you still feel shame for your cowardice.",
  "You suffered only minor injuries, and the wounds all healed without leaving scars.",
  "You survived the battle, but you suffer from terrible nightmares in which you relive the experience.",
  "You survived the battle, but you suffer from terrible nightmares in which you relive the experience.",
  "You escaped the battle unscathed, though many of your friends were injured or lost.",
  "You escaped the battle unscathed, though many of your friends were injured or lost.",
  "You acquitted yourself well in battle and are remembered as a hero. You might have received a medal for your bravery.",
  "You acquitted yourself well in battle and are remembered as a hero. You might have received a medal for your bravery.",
  "You saved the lives of several soldiers. You are remembered fondly by them, and they support you even today (or their descendants do).",
];

// ---------------------------------------------------------------------------
// Crime (d8)
// ---------------------------------------------------------------------------

export const CRIMES = [
  "Murder",
  "Theft",
  "Burglary",
  "Assault",
  "Smuggling",
  "Kidnapping",
  "Extortion",
  "Counterfeiting",
];

// ---------------------------------------------------------------------------
// Punishment (d12)
// ---------------------------------------------------------------------------

export const PUNISHMENTS = [
  "You did not get caught and are still wanted.",
  "You did not get caught and are still wanted.",
  "You did not get caught and are still wanted.",
  "You were caught but escaped and have been on the run ever since.",
  "You were caught but escaped and have been on the run ever since.",
  "You were caught but escaped and have been on the run ever since.",
  "You were nearly caught but managed to talk your way out of it or were let go.",
  "You were nearly caught but managed to talk your way out of it or were let go.",
  "You were caught and convicted. You spent time in jail, paid a fine, or were sentenced to hard labor. You served a sentence of {1d4} years or paid a fine of {1d20x25} gp.",
  "You were caught and convicted. You spent time in jail, paid a fine, or were sentenced to hard labor. You served a sentence of {1d4} years or paid a fine of {1d20x25} gp.",
  "You were caught and convicted. You spent time in jail, paid a fine, or were sentenced to hard labor. You served a sentence of {1d4} years or paid a fine of {1d20x25} gp.",
  "You were caught and convicted. You spent time in jail, paid a fine, or were sentenced to hard labor. You served a sentence of {1d4} years or paid a fine of {1d20x25} gp.",
];

// ---------------------------------------------------------------------------
// Arcane Matters (d10)
// ---------------------------------------------------------------------------

export const ARCANE_MATTERS = [
  "You were charmed or frightened by a spell.",
  "You were injured by the effect of a spell.",
  "You witnessed a powerful spell being cast by a cleric, a druid, a sorcerer, a warlock, or a wizard.",
  "You drank a potion (or were affected by a spell) that caused you to sleep for {1d6} days.",
  "A being from another plane of existence appeared before you and scared you.",
  "You saw a ghost.",
  "You saw a portal that you believe leads to another plane of existence.",
  "A creature that was not of this world appeared and then vanished before your eyes.",
  "You saw a creature be transformed by a spell or magical effect.",
  "You found a magic item. (DM determines what it is.)",
];

// ---------------------------------------------------------------------------
// Odd Events (d12)
// ---------------------------------------------------------------------------

export const ODD_EVENTS = [
  "You were turned into a toad and remained in that form for {1d4} weeks.",
  "You were petrified and remained a stone statue for a time until someone freed you.",
  "You were enslaved by a hag, a satyr, or some other being and lived in that creature's thrall for {1d6} years.",
  "A dragon held you as a prisoner for {1d4} months until adventurers killed it.",
  "You were taken captive by a group of pirates, slavers, or thieves.",
  "You went insane for {1d6} months. You might have been committed to an institution during this time.",
  "A lover of yours was secretly a silver dragon.",
  "You were captured by cultists and nearly sacrificed on an altar to the god they served. You escaped, but you fear they will find you.",
  "You met a demigod, an archdevil, an archfey, a demon lord, or a titan, and you lived to tell the tale.",
  "You were swallowed by a giant fish and spent a month in its belly before you escaped.",
  "A powerful being granted you one wish, but you squandered it on something frivolous.",
  "You met a doppelganger, and for a time afterward were unsure of who you really were.",
];

// ---------------------------------------------------------------------------
// Adventures (d100)
// ---------------------------------------------------------------------------

export const ADVENTURE_TABLE: RangeEntry[] = [
  { min: 1, max: 10, value: "You nearly died. You have the scars on your body to prove it." },
  { min: 11, max: 20, value: "You suffered a grievous injury. Although the wound healed, it still pains you from time to time." },
  { min: 21, max: 30, value: "You were wounded, but in time you fully recovered." },
  { min: 31, max: 40, value: "You contracted a disease while exploring a filthy warren. You recovered from the disease, but you have a persistent cough, pockmarks on your skin, or prematurely gray hair." },
  { min: 41, max: 50, value: "You were poisoned by a trap or a monster. You recovered, but the next time you must make a saving throw against poison, you make the saving throw with disadvantage." },
  { min: 51, max: 60, value: "You lost something of sentimental value to you during your adventure. Remove one trinket from your possessions." },
  { min: 61, max: 70, value: "You were terribly frightened by something you encountered and ran away, abandoning your companions to their fate." },
  { min: 71, max: 80, value: "You learned a great deal during your adventure. The next time you make an ability check or a saving throw, you have advantage on the roll." },
  { min: 81, max: 90, value: "You found some treasure on your adventure. You have 2d6 gp left from your share of it." },
  { min: 91, max: 99, value: "You found a considerable amount of treasure on your adventure. You have 1d20+50 gp left from your share of it." },
  { min: 100, max: 100, value: "You discovered something truly wonderful. You found a magic item (DM determines what it is)." },
];

// ---------------------------------------------------------------------------
// Life Events Master Table (d100)
// ---------------------------------------------------------------------------

export const LIFE_EVENT_TABLE: RangeEntry<string>[] = [
  { min: 1, max: 10, value: "TRAGEDY" },
  { min: 11, max: 20, value: "BOON" },
  { min: 21, max: 30, value: "LOVE" },
  { min: 31, max: 40, value: "ENEMY" },
  { min: 41, max: 50, value: "FRIEND" },
  { min: 51, max: 70, value: "WORK" },
  { min: 71, max: 75, value: "IMPORTANT_PERSON" },
  { min: 76, max: 80, value: "ADVENTURE" },
  { min: 81, max: 85, value: "SUPERNATURAL" },
  { min: 86, max: 90, value: "WAR" },
  { min: 91, max: 95, value: "CRIME" },
  { min: 96, max: 99, value: "ARCANE" },
  { min: 100, max: 100, value: "ODD" },
];

// ---------------------------------------------------------------------------
// Supernatural Experiences (d100) — used for "Supernatural experience" events
// ---------------------------------------------------------------------------

export const SUPERNATURAL_EXPERIENCES = [
  "You were ensorcelled by a fey and enslaved for {1d6} years before you escaped.",
  "You saw a demon and ran away before it could do anything to you.",
  "A devil tempted you. Make a DC 10 Wisdom saving throw. On a failed save, your alignment shifts one step toward evil.",
  "You woke up one morning miles from your home, with no idea how you got there.",
  "You visited a holy site and felt the presence of the divine there.",
  "You witnessed a falling red star, a ## face appearing in the frost, or some other bizarre but impressive event.",
  "You escaped certain death and believe it was the intervention of a god that saved you.",
  "You witnessed a minor miracle.",
  "You explored an empty house and found it to be haunted.",
  "You were briefly possessed. Roll a d6 to determine what type of creature possessed you: 1\u20132, celestial; 3\u20134, devil; 5, demon; 6, fey.",
  "You saw a ghost.",
  "You saw a ghoul feeding on a corpse.",
];

// ---------------------------------------------------------------------------
// Important People supplemental
// ---------------------------------------------------------------------------

export const IMPORTANT_PEOPLE = [
  "You met a powerful noble who took an interest in your future.",
  "You saved the life of a commoner who repays you by assisting you when they can.",
  "You found a mentor who schooled you in the ways of the world.",
  "A wandering sage taught you something valuable.",
  "You met a member of a secret society who offered you membership.",
  "You met a powerful merchant or artisan who owes you a favor.",
  "You saved a guard captain's life, and now they consider you a friend.",
  "You earned the respect of a retired adventurer who shared stories and lessons.",
  "A local priest took you under their wing and guided you spiritually.",
  "You met a veteran soldier who taught you about discipline and sacrifice.",
];

// ---------------------------------------------------------------------------
// D&D Classes (for random enemy/friend class rolls)
// ---------------------------------------------------------------------------

export const DND_CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard",
];

export const DND_RACES_SIMPLE = [
  "Human", "Dwarf", "Elf", "Halfling", "Gnome",
  "Half-Elf", "Half-Orc", "Tiefling", "Dragonborn",
];

export const ENEMY_FRIEND_CAUSES = [
  "differing worldviews or beliefs",
  "a business dispute or rivalry",
  "a shared adventure or quest",
  "a romantic entanglement",
  "a contest or competition",
  "a mutual enemy or ally",
  "a favor done or refused",
  "a debt owed or collected",
  "a misunderstanding that escalated",
  "a chance meeting in a dangerous situation",
];

// ---------------------------------------------------------------------------
// Race-Appropriate Name Tables
// ---------------------------------------------------------------------------

export interface RaceNameSet {
  male: string[];
  female: string[];
  surnames: string[];
}

const HUMAN_NAMES: RaceNameSet = {
  male: [
    "Aldric", "Bran", "Cedric", "Darius", "Edmund", "Fabian", "Gareth", "Hugo",
    "Ivan", "Jasper", "Kendrick", "Leander", "Marcus", "Nolan", "Osric", "Pavel",
    "Quinn", "Roland", "Stefan", "Theron", "Ulric", "Viktor", "Willem", "Xander",
    "Yorick", "Zephyr", "Alaric", "Benedict", "Cormac", "Dorian", "Erasmus",
    "Frederick", "Godfrey", "Henrik", "Ignatius", "Johann", "Klaus", "Lothar",
    "Magnus", "Nikolai", "Otto", "Percival", "Reginald", "Sebastian", "Tobias",
  ],
  female: [
    "Adela", "Brigitte", "Cassandra", "Diana", "Eleanor", "Freya", "Gwendolyn",
    "Helena", "Isolde", "Jocelyn", "Katarina", "Lysandra", "Miriam", "Natalia",
    "Ophelia", "Petra", "Rosalind", "Seraphina", "Tatiana", "Ursula", "Valentina",
    "Winifred", "Xiomara", "Yvette", "Zelda", "Astrid", "Beatrice", "Cordelia",
    "Dahlia", "Elara", "Fiona", "Gwyneth", "Hildegard", "Ingrid", "Juliana",
    "Katrina", "Lavinia", "Marguerite", "Nessa", "Odette",
  ],
  surnames: [
    "Ashford", "Blackwood", "Crawford", "Dunbar", "Everett", "Fairfax", "Greystone",
    "Hartwell", "Ironwood", "Justinian", "Kingswell", "Lancaster", "Moorland",
    "Northcott", "Oakridge", "Pemberton", "Ravencroft", "Stonebridge", "Thornton",
    "Underhill", "Vandermark", "Westbrook", "York", "Ashmore", "Blackthorn",
  ],
};

const DWARF_NAMES: RaceNameSet = {
  male: [
    "Adrik", "Baern", "Brottor", "Bruenor", "Dain", "Darrak", "Delg", "Eberk",
    "Einkil", "Fargrim", "Flint", "Gardain", "Harbek", "Kildrak", "Morgran",
    "Orsik", "Oskar", "Rangrim", "Rurik", "Taklinn", "Thoradin", "Thorin",
    "Tordek", "Traubon", "Travok", "Ulfgar", "Veit", "Vondal",
  ],
  female: [
    "Amber", "Artin", "Audhild", "Bardryn", "Dagnal", "Diesa", "Eldeth",
    "Falkrunn", "Finellen", "Gunnloda", "Gurdis", "Helja", "Hlin", "Kathra",
    "Kristryd", "Ilde", "Liftrasa", "Mardred", "Riswynn", "Sannl", "Torbera",
    "Torgga", "Vistra",
  ],
  surnames: [
    "Balderk", "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard",
    "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim",
    "Strakeln", "Torunn", "Ungart", "Stonehammer", "Deepdelver", "Coppermantle",
  ],
};

const ELF_NAMES: RaceNameSet = {
  male: [
    "Adran", "Aelar", "Aramil", "Arannis", "Aust", "Berrian", "Carric",
    "Enialis", "Erdan", "Erevan", "Galinndan", "Hadarai", "Heian", "Himo",
    "Immeral", "Ivellios", "Laucian", "Mindartis", "Paelias", "Peren",
    "Quarion", "Riardon", "Rolen", "Soveliss", "Thamior", "Tharivol",
    "Theren", "Varis",
  ],
  female: [
    "Adrie", "Althaea", "Anastrianna", "Andraste", "Antinua", "Bethrynna",
    "Birel", "Caelynn", "Drusilia", "Enna", "Felosial", "Ielenia", "Jelenneth",
    "Keyleth", "Leshanna", "Lia", "Meriele", "Mialee", "Naivara", "Quelenna",
    "Quillathe", "Sariel", "Shanairra", "Shava", "Silaqui", "Theirastra",
    "Thia", "Vadania", "Valanthe", "Xanaphia",
  ],
  surnames: [
    "Amakiir", "Amastacia", "Galanodel", "Holimion", "Ilphelkiir", "Liadon",
    "Meliamne", "Nailo", "Siannodel", "Xiloscient", "Nightbreeze", "Moonwhisper",
    "Starwatcher", "Windrunner", "Silverfrond",
  ],
};

const HALFLING_NAMES: RaceNameSet = {
  male: [
    "Alton", "Ander", "Cade", "Corrin", "Eldon", "Errich", "Finnan", "Garret",
    "Lindal", "Lyle", "Merric", "Milo", "Osborn", "Perrin", "Reed", "Roscoe",
    "Wellby", "Wendel",
  ],
  female: [
    "Andry", "Bree", "Callie", "Cora", "Euphemia", "Jillian", "Kithri",
    "Lavinia", "Lidda", "Merla", "Nedda", "Paela", "Portia", "Seraphina",
    "Shaena", "Trym", "Vani", "Verna",
  ],
  surnames: [
    "Brushgather", "Goodbarrel", "Greenbottle", "High-hill", "Hilltopple",
    "Leagallow", "Tealeaf", "Thorngage", "Tosscobble", "Underbough",
    "Bigheart", "Copperkettle", "Sweetwater",
  ],
};

const GNOME_NAMES: RaceNameSet = {
  male: [
    "Alston", "Alvyn", "Boddynock", "Brocc", "Burgell", "Dimble", "Eldon",
    "Erky", "Fonkin", "Frug", "Gerbo", "Gimble", "Glim", "Jebeddo", "Kellen",
    "Namfoodle", "Orryn", "Roondar", "Seebo", "Sindri", "Warryn", "Wrenn",
    "Zook",
  ],
  female: [
    "Bimpnottin", "Breena", "Caramip", "Carlin", "Donella", "Duvamil",
    "Ella", "Ellyjobell", "Ellywick", "Lilli", "Loopmottin", "Lorilla",
    "Mardnab", "Nissa", "Nyx", "Oda", "Orla", "Roywyn", "Shamil", "Tana",
    "Waywocket", "Zanna",
  ],
  surnames: [
    "Beren", "Daergel", "Folkor", "Garrick", "Nackle", "Murnig", "Ningel",
    "Raulnor", "Scheppen", "Timbers", "Turen", "Sparklegear", "Coppercoil",
    "Fizzlebang",
  ],
};

const HALF_ORC_NAMES: RaceNameSet = {
  male: [
    "Dench", "Feng", "Gell", "Henk", "Holg", "Imsh", "Keth", "Krusk",
    "Mhurren", "Ront", "Shump", "Thokk", "Mord", "Grul", "Brug",
    "Tarak", "Varg", "Rendar", "Grumbar", "Urzog",
  ],
  female: [
    "Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Ownka",
    "Shautha", "Sutha", "Vola", "Volen", "Yevelda", "Grisha", "Murga",
    "Ekk", "Ruthka", "Brenna",
  ],
  surnames: [
    "Dummik", "Hargash", "Lakbar", "Mhaenal", "Noogru", "Rhorik", "Shazgob",
    "Turge", "Ulkrunnar", "Skullcrusher", "Ironjaw", "Bloodfist",
  ],
};

const TIEFLING_NAMES: RaceNameSet = {
  male: [
    "Akmenos", "Amnon", "Barakas", "Damakos", "Ekemon", "Iados", "Kairon",
    "Leucis", "Melech", "Mordai", "Morthos", "Pelaios", "Skamos", "Therai",
    "Aether", "Carrion", "Castiel", "Draven", "Havoc", "Nihil",
  ],
  female: [
    "Akta", "Anakis", "Bryseis", "Criella", "Damaia", "Ea", "Kallista",
    "Lerissa", "Makaria", "Nemeia", "Orianna", "Phelaia", "Rieta", "Siraye",
    "Art", "Chant", "Despair", "Music", "Poetry", "Reverence",
  ],
  surnames: [
    "Virtue names are common: Ambition", "Art", "Carrion", "Chant", "Creed",
    "Despair", "Excellence", "Fear", "Glory", "Hope", "Ideal", "Music",
    "Nowhere", "Open", "Poetry", "Quest", "Random", "Reverence", "Sorrow",
    "Torment", "Weary",
  ],
};

const DRAGONBORN_NAMES: RaceNameSet = {
  male: [
    "Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv",
    "Medrash", "Mehen", "Nadarr", "Pandjed", "Patrin", "Rhogar", "Shamash",
    "Shedinn", "Tarhun", "Torinn", "Verthisathurgiesh",
  ],
  female: [
    "Akra", "Biri", "Daar", "Farideh", "Harann", "Havilar", "Jheri",
    "Kava", "Korinn", "Mishann", "Nala", "Perra", "Raiann", "Sora",
    "Surina", "Thava", "Uadjit",
  ],
  surnames: [
    "Clethtinthiallor", "Daardendrian", "Delmirev", "Drachedandion",
    "Fenkenkabradon", "Kepeshkmolik", "Kerrhylon", "Kimbatuul", "Linxakasendalor",
    "Myastan", "Nemmonis", "Norixius", "Ophinshtalajiir", "Prexijandilin",
    "Shestendeliath", "Turnuroth", "Verthisathurgiesh", "Yarjerit",
  ],
};

export const RACE_NAME_MAP: Record<string, RaceNameSet> = {
  human: HUMAN_NAMES,
  dwarf: DWARF_NAMES,
  elf: ELF_NAMES,
  halfling: HALFLING_NAMES,
  gnome: GNOME_NAMES,
  "half-orc": HALF_ORC_NAMES,
  "half-elf": ELF_NAMES, // Use elf names, could also use human
  tiefling: TIEFLING_NAMES,
  dragonborn: DRAGONBORN_NAMES,
};

export function getNameSetForRace(race: string): RaceNameSet {
  const lower = race.toLowerCase();
  for (const [key, names] of Object.entries(RACE_NAME_MAP)) {
    if (lower.includes(key)) return names;
  }
  return HUMAN_NAMES; // fallback
}

export function generateName(race: string, gender: "male" | "female"): { first: string; surname: string } {
  const nameSet = getNameSetForRace(race);
  const firstNames = gender === "male" ? nameSet.male : nameSet.female;
  return {
    first: pickRandom(firstNames),
    surname: pickRandom(nameSet.surnames),
  };
}

// ---------------------------------------------------------------------------
// Resolve dice expressions in text like {1d6}, {2d6x10}
// ---------------------------------------------------------------------------

export function resolveDiceExpressions(text: string): string {
  return text.replace(/\{(\d+)d(\d+)(?:x(\d+))?\}/g, (_match, count, sides, mult) => {
    const result = roll(Number(count), Number(sides));
    if (mult) return String(result * Number(mult));
    return String(result);
  });
}

// ---------------------------------------------------------------------------
// Generate a full life event description
// ---------------------------------------------------------------------------

export interface LifeEventResult {
  category: string;
  description: string;
}

export function generateLifeEvent(loveCount: { value: number }): LifeEventResult {
  const type = rollOnTable(LIFE_EVENT_TABLE);

  switch (type) {
    case "TRAGEDY": {
      const raw = pickRandom(TRAGEDIES);
      return { category: "Tragedy", description: resolveDiceExpressions(raw) };
    }
    case "BOON": {
      const raw = pickRandom(BOONS);
      return { category: "Boon", description: resolveDiceExpressions(raw) };
    }
    case "LOVE": {
      loveCount.value++;
      if (loveCount.value > 1) {
        return { category: "Love", description: "You had a child (or adopted one), adding to your growing family." };
      }
      return { category: "Love", description: "You fell in love or got married. If this result comes up again, you can choose to have a child instead." };
    }
    case "ENEMY": {
      const cls = pickRandom(DND_CLASSES);
      const race = pickRandom(DND_RACES_SIMPLE);
      const cause = pickRandom(ENEMY_FRIEND_CAUSES);
      return {
        category: "Enemy",
        description: `You made an enemy of an adventurer. The enemy is a ${race} ${cls}. The cause of the enmity was ${cause}.`,
      };
    }
    case "FRIEND": {
      const cls = pickRandom(DND_CLASSES);
      const race = pickRandom(DND_RACES_SIMPLE);
      const cause = pickRandom(ENEMY_FRIEND_CAUSES);
      return {
        category: "Friend",
        description: `You made a friend of an adventurer. Your friend is a ${race} ${cls}. The basis of your friendship was ${cause}.`,
      };
    }
    case "WORK": {
      const gp = roll(2, 6);
      return {
        category: "Work",
        description: `You spent time working in a job related to your background. You start with an extra ${gp} gp.`,
      };
    }
    case "IMPORTANT_PERSON": {
      return { category: "Important Person", description: pickRandom(IMPORTANT_PEOPLE) };
    }
    case "ADVENTURE": {
      return { category: "Adventure", description: rollOnTable(ADVENTURE_TABLE) };
    }
    case "SUPERNATURAL": {
      const raw = pickRandom(SUPERNATURAL_EXPERIENCES);
      return { category: "Supernatural", description: resolveDiceExpressions(raw) };
    }
    case "WAR": {
      return { category: "War", description: pickRandom(WAR_OUTCOMES) };
    }
    case "CRIME": {
      const crime = pickRandom(CRIMES);
      const punishment = resolveDiceExpressions(pickRandom(PUNISHMENTS));
      return {
        category: "Crime",
        description: `You committed a crime or were wrongly accused of committing ${crime.toLowerCase()}. ${punishment}`,
      };
    }
    case "ARCANE": {
      const raw = pickRandom(ARCANE_MATTERS);
      return { category: "Arcane Matters", description: resolveDiceExpressions(raw) };
    }
    case "ODD": {
      const raw = pickRandom(ODD_EVENTS);
      return { category: "Strange Occurrence", description: resolveDiceExpressions(raw) };
    }
    default:
      return { category: "Unknown", description: "Something happened." };
  }
}

// ---------------------------------------------------------------------------
// Background reason defaults (for backgrounds not in life.json)
// ---------------------------------------------------------------------------

export const DEFAULT_BACKGROUND_REASONS: Record<string, string[]> = {
  "Acolyte": [
    "I was drawn to the service of the gods from a young age.",
    "My family had a long tradition of serving in the temple.",
    "A divine vision set me on this path.",
  ],
  "Charlatan": [
    "I discovered early that I had a talent for deception.",
    "I needed to survive, and the con was the only way I knew.",
    "I learned from a master swindler who took me under their wing.",
  ],
  "Criminal": [
    "I fell in with bad company and learned to survive on the wrong side of the law.",
    "Poverty drove me to a life of crime.",
    "I had no other options and crime was the only path available.",
  ],
  "Entertainer": [
    "I was born with a gift for performance.",
    "A traveling troupe inspired me to take up the life of an entertainer.",
    "I discovered that I could move people with my art.",
  ],
  "Folk Hero": [
    "I stood up against a tyrant who oppressed my community.",
    "A prophecy marked me as a champion of the common people.",
    "I simply did what was right, and others called me a hero.",
  ],
  "Guild Artisan": [
    "I was apprenticed to a master craftsperson.",
    "My family had a tradition in the trade.",
    "I discovered a natural aptitude for crafting.",
  ],
  "Hermit": [
    "I sought solitude to find spiritual enlightenment.",
    "I was driven from society and forced to live alone.",
    "I needed time away from civilization to understand myself.",
  ],
  "Noble": [
    "I was born into privilege and expected to uphold my family's honor.",
    "My family's noble title came with great responsibility.",
    "I intend to prove myself worthy of my family's legacy.",
  ],
  "Outlander": [
    "I grew up in the wilderness, far from civilization.",
    "I left civilization behind to live off the land.",
    "My people are nomads, and I carry their traditions.",
  ],
  "Sage": [
    "My thirst for knowledge drove me to study relentlessly.",
    "A great mystery consumed my thoughts and led me to research.",
    "I was educated at a prestigious institution.",
  ],
  "Sailor": [
    "The call of the sea was in my blood.",
    "I needed to escape my old life and the sea offered freedom.",
    "I signed on with a ship to see the world.",
  ],
  "Soldier": [
    "I joined the military to serve my homeland.",
    "War came to my doorstep, and I had no choice but to fight.",
    "I sought discipline and purpose in military service.",
  ],
  "Urchin": [
    "I grew up on the streets, fending for myself.",
    "My parents died when I was young, leaving me to survive alone.",
    "I ran away from a bad home and learned to live by my wits.",
  ],
};

// ---------------------------------------------------------------------------
// Genders for sibling generation
// ---------------------------------------------------------------------------

export const GENDERS: ("male" | "female")[] = ["male", "female"];
