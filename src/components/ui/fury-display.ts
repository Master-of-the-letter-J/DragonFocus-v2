import type { DragonFuryBand } from '@/types/world.types';

/** Presentation-only stage labels; progression rules remain owned by the world store. */
export const displayFuryStage = (band: DragonFuryBand, angerShields: number) => {
	if (angerShields > 0) return 'Calm';
	if (band === 'calm' || band === 'normal') return 'Normal';
	if (band === 'angry') return 'Angry';
	if (band === 'critical') return 'Critical';
	return 'Supernova';
};
