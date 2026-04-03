import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Generic lazy-loading data hook factory
// ---------------------------------------------------------------------------
// Each hook created by this factory will:
//   1. Dynamically import() the data module on first call
//   2. Cache the result in a module-level variable so it persists across mounts
//   3. Return { data, isLoading } — data is null until loaded
// ---------------------------------------------------------------------------

interface DataLoaderResult<T> {
  data: T | null;
  isLoading: boolean;
}

function createDataLoader<T>(loader: () => Promise<T>): () => DataLoaderResult<T> {
  let cached: T | null = null;
  let promise: Promise<T> | null = null;

  return function useDataLoader(): DataLoaderResult<T> {
    const [data, setData] = useState<T | null>(cached);
    const [isLoading, setIsLoading] = useState(cached === null);

    useEffect(() => {
      if (cached !== null) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      if (!promise) {
        promise = loader().then((result) => {
          cached = result;
          return result;
        });
      }

      let cancelled = false;
      promise.then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }, []);

    return { data, isLoading };
  };
}

// ---------------------------------------------------------------------------
// Concrete data-loader hooks
// ---------------------------------------------------------------------------

export const useSpells = createDataLoader(async () => {
  const mod = await import("@/lib/spellsData");
  return { SPELLS: mod.SPELLS, SPELL_SOURCES: mod.SPELL_SOURCES };
});

export const useMonsters = createDataLoader(async () => {
  const mod = await import("@/lib/bestiaryData");
  return {
    MONSTER_LIST: mod.MONSTER_LIST,
    getMonsterByName: mod.getMonsterByName,
    abilityMod: mod.abilityMod,
    crLabel: mod.crLabel,
  };
});

export const useItems = createDataLoader(async () => {
  const mod = await import("@/lib/itemsData");
  return {
    ITEMS: mod.ITEMS,
    ITEM_SOURCES: mod.ITEM_SOURCES,
    ITEM_TYPES: mod.ITEM_TYPES,
    ITEM_RARITIES: mod.ITEM_RARITIES,
  };
});

export const useClasses = createDataLoader(async () => {
  const mod = await import("@/lib/classData");
  return {
    CLASS_LIST: mod.CLASS_LIST,
    getClassByName: mod.getClassByName,
    getClassByNameAndSource: mod.getClassByNameAndSource,
    getClassesBySource: mod.getClassesBySource,
  };
});

export const useRaces = createDataLoader(async () => {
  const mod = await import("@/lib/raceData");
  return {
    RACES: mod.RACES,
    RACE_SOURCES: mod.RACE_SOURCES,
    getRaceByName: mod.getRaceByName,
    getRaceByNameAndSource: mod.getRaceByNameAndSource,
  };
});

export const useAdventureList = createDataLoader(async () => {
  const mod = await import("@/lib/adventureData");
  return { ADVENTURE_LIST: mod.ADVENTURE_LIST };
});

export const useAdventureContent = createDataLoader(async () => {
  const mod = await import("@/lib/adventureData");
  return {
    ADVENTURE_DATA_MAP: mod.ADVENTURE_DATA_MAP,
    ADVENTURE_LIST: mod.ADVENTURE_LIST,
  };
});

export const useBackgrounds = createDataLoader(async () => {
  const mod = await import("@/lib/backgroundData");
  return {
    BACKGROUNDS: mod.BACKGROUNDS,
    BACKGROUND_NAMES: mod.BACKGROUND_NAMES,
    BACKGROUND_SOURCES: mod.BACKGROUND_SOURCES,
  };
});

export const useFeats = createDataLoader(async () => {
  const mod = await import("@/lib/featData");
  return {
    FEATS: mod.FEATS,
    getFeatsBySource: mod.getFeatsBySource,
    getFeatByName: mod.getFeatByName,
    getFeatByNameAndSource: mod.getFeatByNameAndSource,
  };
});

export const useConditions = createDataLoader(async () => {
  const mod = await import("@/lib/conditionData");
  return {
    CONDITIONS: mod.CONDITIONS,
    DISEASES: mod.DISEASES,
    ALL_ENTRIES: mod.ALL_ENTRIES,
    CONDITION_SOURCES: mod.CONDITION_SOURCES,
    getConditionsBySource: mod.getConditionsBySource,
    getConditionByName: mod.getConditionByName,
  };
});

export const useLanguages = createDataLoader(async () => {
  const mod = await import("@/lib/languageData");
  return {
    LANGUAGES: mod.LANGUAGES,
    LANGUAGE_SOURCES: mod.LANGUAGE_SOURCES,
    LANGUAGE_TYPES: mod.LANGUAGE_TYPES,
    STANDARD_LANGUAGES: mod.STANDARD_LANGUAGES,
    EXOTIC_LANGUAGES: mod.EXOTIC_LANGUAGES,
    RARE_LANGUAGES: mod.RARE_LANGUAGES,
    ALL_LANGUAGES: mod.ALL_LANGUAGES,
  };
});

export const useVehicles = createDataLoader(async () => {
  const mod = await import("@/lib/vehicleData");
  return {
    VEHICLES: mod.VEHICLES,
    VEHICLE_SOURCES: mod.VEHICLE_SOURCES,
  };
});

export const useBooks = createDataLoader(async () => {
  const mod = await import("@/lib/bookData");
  return {
    BOOK_LIST: mod.BOOK_LIST,
    BOOK_DATA_MAP: mod.BOOK_DATA_MAP,
    DMG_2014_DATA: mod.DMG_2014_DATA,
    DMG_2024_DATA: mod.DMG_2024_DATA,
    PHB_2014_DATA: mod.PHB_2014_DATA,
    PHB_2024_DATA: mod.PHB_2024_DATA,
  };
});

export const useLife = createDataLoader(async () => {
  const mod = await import("@/lib/lifeData");
  return {
    LIFE_CLASSES: mod.LIFE_CLASSES,
    LIFE_BACKGROUNDS: mod.LIFE_BACKGROUNDS,
  };
});

export const useMonsterFeatures = createDataLoader(async () => {
  const mod = await import("@/lib/monsterFeatureData");
  return {
    MONSTER_FEATURES: mod.MONSTER_FEATURES,
    getMonsterFeature: mod.getMonsterFeature,
  };
});

export const useStartingEquipment = createDataLoader(async () => {
  const mod = await import("@/lib/startingEquipmentData");
  return {
    ALL_CLASS_STARTING_EQUIPMENT: mod.ALL_CLASS_STARTING_EQUIPMENT,
    ALL_BACKGROUND_STARTING_EQUIPMENT: mod.ALL_BACKGROUND_STARTING_EQUIPMENT,
    getClassStartingEquipment: mod.getClassStartingEquipment,
    getBackgroundStartingEquipment: mod.getBackgroundStartingEquipment,
  };
});

export const useSpellcastingProgression = createDataLoader(async () => {
  const mod = await import("@/lib/spellcastingProgressionData");
  return {
    getCantripsKnown: mod.getCantripsKnown,
    getSpellsKnownOrPrepared: mod.getSpellsKnownOrPrepared,
    getSpellManagementType: mod.getSpellManagementType,
    getWizardSpellbookSize: mod.getWizardSpellbookSize,
  };
});

export const useExpertise = createDataLoader(async () => {
  const mod = await import("@/lib/expertiseData");
  return {
    EXPERTISE_CONFIG: mod.EXPERTISE_CONFIG,
    getExpertiseConfig: mod.getExpertiseConfig,
    getExpertiseCountAtLevel: mod.getExpertiseCountAtLevel,
    getNewExpertiseAtLevel: mod.getNewExpertiseAtLevel,
    classHasExpertise: mod.classHasExpertise,
  };
});
