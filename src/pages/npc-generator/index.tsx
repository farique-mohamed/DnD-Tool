import { useState, useCallback } from "react";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Card, Button, PageHeader, Badge, GOLD, GOLD_BRIGHT, GOLD_MUTED, SERIF } from "@/components/ui";

// ---------------------------------------------------------------------------
// NPC data pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Aldric", "Brenna", "Caelum", "Dahlia", "Elric", "Freya", "Gareth", "Helga",
  "Isolde", "Jorik", "Kira", "Lothar", "Mirael", "Nolan", "Orina", "Pyra",
  "Quillan", "Rowan", "Selene", "Theron", "Ulara", "Vex", "Wren", "Xandria",
  "Yorick", "Zara", "Ashwin", "Beatrix", "Corvin", "Delara", "Eamon", "Faye",
  "Gideon", "Hilda", "Ingrid", "Jasper", "Kael", "Liora", "Magnus", "Nessa",
  "Osric", "Petra", "Riven", "Sable", "Taran", "Uma", "Vasil", "Wynne",
  "Balthazar", "Cassandra", "Dorian", "Elysande", "Fendrel", "Gwyneth",
  "Hadrian", "Ione", "Jareth", "Kalista", "Leander", "Morwenna", "Nerissa",
  "Oberon", "Persephone", "Ragnar", "Seraphina", "Tobias", "Ursa", "Vesper",
];

const LAST_NAMES = [
  "Ashford", "Blackthorn", "Copperfield", "Darkholme", "Emberforge",
  "Frostwind", "Greymoor", "Hawkwood", "Ironhelm", "Jadescale",
  "Kingsworth", "Lightbane", "Moonwhisper", "Nighthollow", "Oakenshield",
  "Proudfoot", "Quicksilver", "Ravencrest", "Stormborn", "Thornwall",
  "Underhill", "Voidwalker", "Whitecliff", "Wyrmsbane", "Yarrow",
  "Stoneheart", "Brightwater", "Shadowmere", "Duskwood", "Fireforge",
  "Goleli", "Hearthstone", "Irontide", "Longshadow", "Mistral",
];

const RACES = [
  "Human", "Elf", "Half-Elf", "Dwarf", "Halfling", "Gnome",
  "Half-Orc", "Tiefling", "Dragonborn", "Goliath", "Aasimar",
  "Tabaxi", "Firbolg", "Kenku", "Tortle", "Genasi",
];

const GENDERS = ["Male", "Female", "Non-binary"];

const PERSONALITY_TRAITS = [
  "Fiercely loyal to friends",
  "Hopelessly superstitious",
  "Speaks in riddles and proverbs",
  "Has a dry, sarcastic wit",
  "Overly trusting of strangers",
  "Deeply paranoid about conspiracies",
  "Compulsively honest to a fault",
  "Collects trinkets and oddities",
  "Laughs at inappropriate moments",
  "Always tells long-winded stories",
  "Extremely competitive about everything",
  "Nervous around magic users",
  "Obsessed with personal honour",
  "Secretly romantic and sentimental",
  "Talks to animals as if they understand",
  "Cannot resist a dare or challenge",
  "Quotes ancient texts no one has heard of",
  "Prefers the company of the dead",
  "Haggling is a way of life",
  "Meticulous about cleanliness",
  "Loves gossip and rumour-spreading",
  "Deeply religious and prayerful",
  "Fascinated by fire",
  "Keeps a personal journal of everything",
];

const APPEARANCE_FEATURES = [
  "A prominent scar across the left cheek",
  "Mismatched eyes — one blue, one brown",
  "Wild, unkempt hair streaked with grey",
  "A neatly braided beard adorned with beads",
  "Tattoos of arcane symbols on both arms",
  "An eyepatch over the right eye",
  "Unusually tall and gaunt build",
  "Stocky and barrel-chested",
  "Pale skin with freckles everywhere",
  "Weather-beaten face with deep wrinkles",
  "A missing finger on the left hand",
  "An ornate earring in one ear",
  "Burn marks along the forearms",
  "Unusually bright, piercing green eyes",
  "A perpetual smirk that never fades",
  "Wears a tattered cloak regardless of weather",
  "Has an elaborate hairstyle pinned with feathers",
  "A nose that's clearly been broken multiple times",
  "Calloused hands from years of hard labour",
  "Striking silver or white hair despite young age",
];

const VOICE_MANNERISMS = [
  "Deep, gravelly voice — whispers everything",
  "High-pitched and fast-talking",
  "Speaks with a thick accent from the northern regions",
  "Calm and measured, pausing between sentences",
  "Booming and theatrical, like a stage performer",
  "Soft-spoken with a slight stutter",
  "Raspy voice, as if perpetually parched",
  "Singsong cadence, almost musical",
  "Clipped and formal, like a military officer",
  "Mumbles and trails off mid-sentence",
  "Overly enunciates every syllable",
  "Speaks in third person about themselves",
  "Uses big words incorrectly",
  "Always sounds slightly out of breath",
  "Has a distinctive laugh — cackling or snorting",
  "Ends every statement as if it were a question",
];

const OCCUPATIONS = [
  "Blacksmith", "Tavern keeper", "Merchant", "Herbalist", "Soldier",
  "Scholar", "Farmer", "Fisher", "Pickpocket", "Bard",
  "Bounty hunter", "Priest/Priestess", "Librarian", "Stable master",
  "Noble courtier", "Ship captain", "Miner", "Cartographer",
  "Alchemist", "Jeweller", "Baker", "Woodcarver",
  "Town crier", "Healer", "Ranger/Scout", "Gravedigger",
  "Tanner", "Scribe", "Brewer", "Weaver",
];

const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface NPC {
  name: string;
  race: string;
  gender: string;
  alignment: string;
  occupation: string;
  personalityTraits: string[];
  appearance: string;
  voiceMannerism: string;
}

function generateNPC(): NPC {
  const traitCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  return {
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    race: pick(RACES),
    gender: pick(GENDERS),
    alignment: pick(ALIGNMENTS),
    occupation: pick(OCCUPATIONS),
    personalityTraits: pickMultiple(PERSONALITY_TRAITS, traitCount),
    appearance: pick(APPEARANCE_FEATURES),
    voiceMannerism: pick(VOICE_MANNERISMS),
  };
}

function npcToClipboardText(npc: NPC): string {
  return [
    `Name: ${npc.name}`,
    `Race: ${npc.race}`,
    `Gender: ${npc.gender}`,
    `Alignment: ${npc.alignment}`,
    `Occupation: ${npc.occupation}`,
    `Personality: ${npc.personalityTraits.join("; ")}`,
    `Appearance: ${npc.appearance}`,
    `Voice/Mannerism: ${npc.voiceMannerism}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NpcGeneratorPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [npc, setNpc] = useState<NPC>(generateNPC);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setNpc(generateNPC());
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(npcToClipboardText(npc));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [npc]);

  // Role guard — only DM and ADMIN
  const hasAccess =
    user?.role === "DUNGEON_MASTER" || user?.role === "ADMIN";

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>NPC Generator — DnD Tool</title>
        </Head>

        {!hasAccess ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: GOLD_MUTED, fontFamily: SERIF, fontSize: "16px" }}>
              Only Dungeon Masters and Admins may summon NPCs.
            </p>
          </div>
        ) : (
          <>
            <PageHeader
              title="NPC Generator"
              subtitle="Summon a random soul from the ether"
            />

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "24px",
                flexWrap: "wrap",
              }}
            >
              <Button onClick={handleGenerate} size={isMobile ? "md" : "lg"}>
                ⚔️ Generate New NPC
              </Button>
              <Button
                variant="ghost"
                onClick={handleCopy}
                size={isMobile ? "md" : "lg"}
              >
                {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
              </Button>
            </div>

            {/* NPC Card */}
            <Card
              style={{
                maxWidth: "680px",
                margin: "0 auto",
              }}
            >
              {/* Name & core info */}
              <div style={{ marginBottom: "20px" }}>
                <h2
                  style={{
                    color: GOLD,
                    fontFamily: SERIF,
                    fontSize: isMobile ? "22px" : "28px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    margin: "0 0 12px 0",
                  }}
                >
                  {npc.name}
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <Badge>{npc.race}</Badge>
                  <Badge>{npc.gender}</Badge>
                  <Badge>{npc.alignment}</Badge>
                  <Badge>{npc.occupation}</Badge>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)`,
                  margin: "16px 0",
                }}
              />

              {/* Detail rows */}
              <NPCDetailSection
                label="Personality Traits"
                isMobile={isMobile}
              >
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    listStyleType: "disc",
                  }}
                >
                  {npc.personalityTraits.map((trait, i) => (
                    <li
                      key={i}
                      style={{
                        color: GOLD_BRIGHT,
                        fontFamily: SERIF,
                        fontSize: "14px",
                        lineHeight: "1.7",
                      }}
                    >
                      {trait}
                    </li>
                  ))}
                </ul>
              </NPCDetailSection>

              <NPCDetailSection label="Appearance" isMobile={isMobile}>
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "14px",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  {npc.appearance}
                </p>
              </NPCDetailSection>

              <NPCDetailSection
                label="Voice & Mannerism"
                isMobile={isMobile}
              >
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "14px",
                    lineHeight: "1.7",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  {npc.voiceMannerism}
                </p>
              </NPCDetailSection>
            </Card>
          </>
        )}
      </Layout>
    </ProtectedRoute>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function NPCDetailSection({
  label,
  isMobile,
  children,
}: {
  label: string;
  isMobile: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3
        style={{
          color: GOLD_MUTED,
          fontFamily: SERIF,
          fontSize: isMobile ? "12px" : "13px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </h3>
      {children}
    </div>
  );
}
