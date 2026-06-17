// Aníma App — Design System Tokens
// Calming, premium palette based on mockups and RNF-07

export const ColorsLight = {
  // Core
  primary: '#5B9BD5',      // Sky blue
  primaryLight: '#87CEEB',  // Light sky
  secondary: '#9B8EC4',     // Lavender
  accent: '#F7C97E',        // Warm gold
  peach: '#FFDAB9',         // Peach
  mint: '#A8E6CF',          // Mint

  // Backgrounds
  bgPrimary: '#E8F4FD',     // Very light blue
  bgSecondary: '#F0F6FF',   // Lighter blue
  bgCard: 'rgba(255,255,255,0.85)',
  bgCardSolid: '#FFFFFF',

  // Text
  textPrimary: '#2D3748',
  textSecondary: '#4A5568',
  textLight: '#A0AEC0',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#A8E6CF',
  warning: '#FCD34D',
  error: '#FC8181',
  info: '#87CEEB',

  // Mood Colors
  moodAnimado: '#A8E6CF',
  moodMejor: '#87CEEB',
  moodNeutral: '#FCD34D',
  moodTriste: '#C4B7EB',
  moodMuyTriste: '#FC8181',

  // Specific
  dreamText: '#2D3748', 
};

// 🌙 PREMIUM DARK MODE PALETTE (Modo Lunar)
export const ColorsDark = {
  // Core - Adjusted for dark mode luminance
  primary: '#73AEE3',       // Slightly lighter/softer blue for contrast against dark
  primaryLight: '#87CEEB',   
  secondary: '#B5A8D9',      // Lighter lavender for glow
  accent: '#E6C894',         // Desaturated gold/sand
  peach: '#FFDAB9',          
  mint: '#A8E6CF',           

  // Backgrounds - "Noche suave emocional"
  bgPrimary: '#1E1B2E',      // Deep Lavender-Blue
  bgSecondary: '#232038',    // Slightly lighter night
  bgCard: '#2C2847',         // SOLID Dark Lavender (No Glassmorphism as requested)
  bgCardSolid: '#2C2847',    // Same as bgCard

  // Text - "Tinted white"
  textPrimary: '#FFFFFF',    // Pure White for max contrast
  textSecondary: '#E2E8F0',  // Very light gray/lavender
  textLight: '#A0AEC0',      // Light gray for captions
  textOnPrimary: '#151221',  // Dark text on bright buttons for contrast

  // Semantic
  success: '#8BC4AB',        // Desaturated mint
  warning: '#E5C065',        // Desaturated yellow
  error: '#E57373',          // Softer red
  info: '#73AEE3',

  // Mood Colors - Adjusted luminosity
  moodAnimado: '#8BC4AB',
  moodMejor: '#73AEE3',
  moodNeutral: '#E5C065',
  moodTriste: '#9B8EC4',
  moodMuyTriste: '#E57373',

  // Specific
  dreamText: '#F2EFFF',
};

// Default export
export const Colors = ColorsLight;

export const Gradients = {
  primary: ['#E8F4FD', '#F0F6FF', '#FFFFFF'] as const,
  jewel: ['#5B9BD5', '#7EC8B8'] as const,
  warmSunset: ['#F7C97E', '#FFDAB9'] as const,
  lavender: ['#C4B7EB', '#9B8EC4'] as const,
  aurora: ['rgba(91,155,213,0.15)', 'rgba(155,142,196,0.08)', 'rgba(168,230,207,0.1)'] as const,
  loginBg: ['#E8F4FD', '#D5E8F7', '#C4DCF0'] as const,
  splash: ['#D5E8F7', '#E8F4FD', '#F0F6FF'] as const,
  
  // 🌙 Dark Dream Mode Gradients
  // Deep Night: Dark Lavender -> Deep Space Blue -> Abyss
  dreamNight: ['#232038', '#1E1B2E', '#151221'] as const, 
  
  // Dark Jewels
  darkJewel: ['#5B9BD5', '#6B5B95'] as const, 
  dreamOrb: ['#A78BFA', '#C8B6FF'] as const,
};

export const Shadows = {
  small: {
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  h2: { fontSize: 22, fontWeight: '600' as const, fontFamily: 'Poppins_600SemiBold' },
  h3: { fontSize: 18, fontWeight: '600' as const, fontFamily: 'Poppins_600SemiBold' },
  body: { fontSize: 15, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, fontFamily: 'Poppins_500Medium' },
  caption: { fontSize: 12, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  button: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'Poppins_600SemiBold' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export type MoodType = 'animado' | 'mejor' | 'neutral' | 'triste' | 'muy_triste';

export const MoodConfig: Record<MoodType, {
  emoji: string;
  label: string;
  color: string;
  icon: string;
}> = {
  animado: { emoji: '😊', label: 'Animado', color: Colors.moodAnimado, icon: 'sunny-outline' },
  mejor: { emoji: '🙂', label: 'Mejor', color: Colors.moodMejor, icon: 'partly-sunny-outline' },
  neutral: { emoji: '😐', label: 'Neutral', color: Colors.moodNeutral, icon: 'cloud-outline' },
  triste: { emoji: '😔', label: 'Triste', color: Colors.moodTriste, icon: 'rainy-outline' },
  muy_triste: { emoji: '😢', label: 'Muy Triste', color: Colors.moodMuyTriste, icon: 'thunderstorm-outline' },
};

// Daily affirmations (RF-16)
export const DAILY_AFFIRMATIONS = [
  'Cada día es una nueva oportunidad para crecer y florecer. 🌱',
  'Eres más fuerte de lo que crees y más valiente de lo que imaginas. 💪',
  'Mereces paz, amor y toda la belleza que la vida ofrece. 🌸',
  'Tus emociones son válidas. Está bien sentir lo que sientes. 💙',
  'Hoy eliges ser amable contigo mismo/a. ✨',
  'Cada paso cuenta, por pequeño que parezca. 🦋',
  'Tu bienestar importa. Tómate un momento para respirar. 🍃',
];
