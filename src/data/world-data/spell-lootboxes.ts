import type { SpellSize } from '@/types/world.types';

export type SpellLootboxId = 'basic' | 'mega' | 'titanic' | 'impossible';

export interface SpellLootboxDefinition {
	id: SpellLootboxId;
	name: string;
	shardCost: number;
	minimumRolls: number;
	maximumRolls: number;
	identicalRollBundle: number;
	standardWeights: Partial<Record<SpellSize, number>>;
	hectateWeights: Partial<Record<SpellSize, number>>;
}

/** Integer weights total 100, making every disclosed chance independently testable. */
export const SPELL_LOOTBOXES: readonly SpellLootboxDefinition[] = [
	{ id: 'basic', name: 'Basic Lootbox', shardCost: 20, minimumRolls: 1, maximumRolls: 2, identicalRollBundle: 1, standardWeights: { 1: 78, 2: 10, 3: 8, 4: 4 }, hectateWeights: { 1: 35, 2: 12, 3: 25, 4: 15, 5: 8, 6: 5 } },
	{ id: 'mega', name: 'Mega Lootbox', shardCost: 50, minimumRolls: 3, maximumRolls: 5, identicalRollBundle: 1, standardWeights: { 1: 58, 2: 19, 3: 15, 4: 5, 7: 2, 8: 1 }, hectateWeights: { 1: 24, 2: 10, 3: 32, 4: 18, 5: 6, 6: 4, 7: 4, 8: 2 } },
	{ id: 'titanic', name: 'Titanic Lootbox', shardCost: 500, minimumRolls: 30, maximumRolls: 50, identicalRollBundle: 1, standardWeights: { 1: 48, 2: 24, 3: 15, 4: 10, 7: 2, 8: 1 }, hectateWeights: { 1: 10, 2: 5, 3: 32, 4: 25, 5: 11, 6: 7, 7: 6, 8: 4 } },
	{ id: 'impossible', name: 'Impossible Lootbox', shardCost: 5_000, minimumRolls: 40, maximumRolls: 60, identicalRollBundle: 10, standardWeights: { 1: 38, 2: 29, 3: 25, 4: 5, 7: 2, 8: 1 }, hectateWeights: { 1: 10, 2: 8, 3: 32, 4: 15, 5: 15, 6: 11, 7: 5, 8: 4 } },
];

export const SPELL_LOOTBOX_BY_ID = Object.fromEntries(SPELL_LOOTBOXES.map(box => [box.id, box])) as Record<SpellLootboxId, SpellLootboxDefinition>;

export const rollWeightedSpellSize = (weights: Partial<Record<SpellSize, number>>, randomValue: number): SpellSize => {
	const roll = Math.max(0, Math.min(0.999_999_999, randomValue)) * 100;
	let cumulative = 0;
	for (let size = 1; size <= 8; size += 1) {
		cumulative += weights[size as SpellSize] ?? 0;
		if (roll < cumulative) return size as SpellSize;
	}
	return 1;
};
