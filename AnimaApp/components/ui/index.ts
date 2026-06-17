/**
 * components/ui/index.ts — Barrel export centralizado.
 *
 * ¿POR QUÉ este archivo?
 * Permite que todos los imports existentes en la app sigan funcionando
 * sin modificación. En vez de:
 *   import { GlassCard, Mascot } from '../../components/ui'
 * que antes apuntaba al monolito ui.tsx (1,345 líneas), ahora apunta aquí
 * y re-exporta desde archivos individuales.
 *
 * BENEFICIO: Los consumidores NO necesitan saber la estructura interna.
 * Solo hacemos `import { X } from 'components/ui'` y funciona.
 */

// Layout & Background
export { AuroraBackground } from './AuroraBackground';
export { GlassCard } from './GlassCard';
export { SectionHeader } from './SectionHeader';

// Buttons & Inputs
export { JewelButton } from './JewelButton';
export { MoodButton } from './MoodButton';
export { FeatureButton } from './FeatureButton';
export { AmbientButton } from './AmbientButton';

// Cards & Widgets
export { ActivityCard } from './ActivityCard';
export { ConnectionRadarCard, MicroChallengeCard } from './ClinicalWidgets';
export { WeeklyProgressRing } from './WeeklyProgressRing';

// Chat
export { ChatBubble, TypingIndicator } from './ChatBubble';

// Visual
export { Mascot } from './Mascot';
export type { MascotVariant } from './Mascot';
export { FloatingParticles } from './FloatingParticles';

// Pre-existing individual components (already existed before refactor)
export { PremiumButton } from './PremiumButton';
export { AnimatedEntrance } from './AnimatedEntrance';
export { ParticlesBackground } from './ParticlesBackground';
