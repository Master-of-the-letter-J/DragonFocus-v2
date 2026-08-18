import type { SpellSize } from '@/types/world.types';

export type SpellSnackboxId = 'snackbox';

export interface SpellSnackboxDefinition {
	id: SpellSnackboxId;
	name: string;
	shardCost: number;
	minimumRolls: number;
	maximumRolls: number;
	identicalRollBundle: number;
	standardWeights: Partial<Record<SpellSize, number>>;
	hecateWeights: Partial<Record<SpellSize, number>>;
}

/** Integer weights total 100, making every disclosed chance independently testable. */
export const SPELL_SNACKBOXES: readonly SpellSnackboxDefinition[] = [
	{ id: 'snackbox', name: 'Dragon Snackbox', shardCost: 20, minimumRolls: 1, maximumRolls: 2, identicalRollBundle: 1, standardWeights: { 1: 78, 2: 10, 3: 8, 4: 4 }, hecateWeights: { 1: 35, 2: 12, 3: 25, 4: 15, 5: 8, 6: 5 } },
];

export const SPELL_SNACKBOX_BY_ID = Object.fromEntries(SPELL_SNACKBOXES.map(box => [box.id, box])) as Record<SpellSnackboxId, SpellSnackboxDefinition>;

export const rollWeightedSpellSize = (weights: Partial<Record<SpellSize, number>>, randomValue: number): SpellSize => {
	const roll = Math.max(0, Math.min(0.999_999_999, randomValue)) * 100;
	let cumulative = 0;
	for (let size = 1; size <= 8; size += 1) {
		cumulative += weights[size as SpellSize] ?? 0;
		if (roll < cumulative) return size as SpellSize;
	}
	return 1;
};
