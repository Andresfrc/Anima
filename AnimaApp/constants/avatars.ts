import { ImageSourcePropType } from 'react-native';

export interface AvatarItem {
  id: string;
  source: ImageSourcePropType;
}

export interface AvatarCategory {
  title: string;
  icon: string;
  data: AvatarItem[];
}

// ── Personas (Whisk_* files) ──────────────────────────────────
const PERSON_SOURCES: Record<string, ImageSourcePropType> = {
  'person_01': require('../assets/images/profile-images/Whisk_038b15327163802a1c940d914394019cdr (1).jpeg'),
  'person_02': require('../assets/images/profile-images/Whisk_06b65d3a99efd7f993641a565d3b941ddr (1).jpeg'),
  'person_03': require('../assets/images/profile-images/Whisk_194b0b7d628e86da7444ebc8f9223cbcdr (1).jpeg'),
  'person_04': require('../assets/images/profile-images/Whisk_24576ad12183f4286b44643087fb6d5edr (1).jpeg'),
  'person_05': require('../assets/images/profile-images/Whisk_4091e140446c752a56e4a6c084efb44adr (1).jpeg'),
  'person_06': require('../assets/images/profile-images/Whisk_49156abc9e7968ebe494a1b39774ec45dr (1).jpeg'),
  'person_07': require('../assets/images/profile-images/Whisk_5d0a547c373b4359ada4b5e16ba9f927dr (1).jpeg'),
  'person_08': require('../assets/images/profile-images/Whisk_663ab35be9200d180dc4dad0b54fdaf0dr (1).jpeg'),
  'person_09': require('../assets/images/profile-images/Whisk_6d1d2756886c004b9b5482bbc81ca835dr (1).jpeg'),
  'person_10': require('../assets/images/profile-images/Whisk_70446aea6a09381b00744525aba3fce6dr (1).jpeg'),
  'person_11': require('../assets/images/profile-images/Whisk_8d291a7c608f891aca1425fd21730981dr (1).jpeg'),
  'person_12': require('../assets/images/profile-images/Whisk_91f2ae49bc6b403907d4218f5c9d4832dr (1).jpeg'),
  'person_13': require('../assets/images/profile-images/Whisk_a1b65fffc88c8bdb97747d6991013332dr (1).jpeg'),
  'person_14': require('../assets/images/profile-images/Whisk_b3a4bb615e84d1eafb94add0c3ebce50dr (1).jpeg'),
  'person_15': require('../assets/images/profile-images/Whisk_cb5a66a1e451db6a2584ca8f67e90537dr (1).jpeg'),
  'person_16': require('../assets/images/profile-images/Whisk_e0695626d85cca7b2984cb3ce5f05be7dr (1).jpeg'),
  'person_17': require('../assets/images/profile-images/Whisk_ed8792f4c0248959d9549a433ebe57fbdr (1).jpeg'),
  'person_18': require('../assets/images/profile-images/Whisk_f506c8d37b131b5aedd4790eb8391a3edr (1).jpeg'),
  'person_19': require('../assets/images/profile-images/Whisk_fe55e64e91885d2975244e1bcec12f2bdr (1).jpeg'),
};

// ── Animales (A* files) ───────────────────────────────────────
const ANIMAL_SOURCES: Record<string, ImageSourcePropType> = {
  'animal_01': require('../assets/images/profile-images/A1.jpeg'),
  'animal_02': require('../assets/images/profile-images/A2.jpeg'),
  'animal_03': require('../assets/images/profile-images/A3.jpeg'),
  'animal_04': require('../assets/images/profile-images/A4.jpeg'),
  'animal_05': require('../assets/images/profile-images/A5.jpeg'),
  'animal_06': require('../assets/images/profile-images/A6.jpeg'),
  'animal_07': require('../assets/images/profile-images/A7.jpeg'),
};

// ── Fantasía (F* files) ───────────────────────────────────────
const FANTASY_SOURCES: Record<string, ImageSourcePropType> = {
  'fantasy_01': require('../assets/images/profile-images/F1.jpeg'),
  'fantasy_02': require('../assets/images/profile-images/F2.jpeg'),
  'fantasy_03': require('../assets/images/profile-images/F3.jpeg'),
  'fantasy_04': require('../assets/images/profile-images/F4.jpeg'),
};

// ── Combined lookup for resolving stored IDs ──────────────────
const ALL_SOURCES: Record<string, ImageSourcePropType> = {
  ...PERSON_SOURCES,
  ...ANIMAL_SOURCES,
  ...FANTASY_SOURCES,
};

// ── Helper to build AvatarItem[] from a source map ────────────
function toItems(sources: Record<string, ImageSourcePropType>): AvatarItem[] {
  return Object.entries(sources).map(([id, source]) => ({ id, source }));
}

/**
 * Categorized avatar list for the picker UI.
 */
export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    title: 'Personas',
    icon: 'person-outline',
    data: toItems(PERSON_SOURCES),
  },
  {
    title: 'Animales',
    icon: 'paw-outline',
    data: toItems(ANIMAL_SOURCES),
  },
  {
    title: 'Fantasía',
    icon: 'sparkles-outline',
    data: toItems(FANTASY_SOURCES),
  },
];

/**
 * Get an avatar source by its ID. Returns null if not found.
 */
export function getAvatarSource(id: string | null): ImageSourcePropType | null {
  if (!id) return null;
  return ALL_SOURCES[id] ?? null;
}
