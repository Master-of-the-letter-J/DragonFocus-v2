import { AMPLIFIERS, PRODUCTION_BY_ID, TITANS } from '@/data/production-data';
import { GOAL_MULTIPLIER_ARCHETYPES, type GoalMultiplierArchetype } from '@/types/goal-multiplier.types';
import { decimal } from '@/utils/decimal';
import { scopeNestedSlice } from '../nested-slice';
import { useWorldStore } from '../store-world/_useWorldStore';
import type { ProductionSlice, ProductionStoreState } from './_useProductionStore';

export type GildTarget = 'amplifier' | 'goal';
export type ForgeTarget = 'deity' | 'titan';

export interface ForgingStoreState {
	gildedAmplifierIds: string[];
	gildedGoalArchetypes: GoalMultiplierArchetype[];
	forgedDeityIds: string[];
	forgedTitanIds: string[];
	setGildedTargets: (target: GildTarget, ids: string[]) => void;
	clearGilds: (target: GildTarget) => void;
	setForgedTargets: (target: ForgeTarget, ids: string[]) => void;
	clearForgedTargets: (target: ForgeTarget) => void;
	getGildMultiplier: (id: string, target: GildTarget) => number;
	getForgeMultiplier: (itemId: string, target: ForgeTarget) => number;
	resetForTranscension: () => void;
	reset: () => void;
}

const initialState = () => ({
	gildedAmplifierIds: [] as string[],
	gildedGoalArchetypes: [] as GoalMultiplierArchetype[],
	forgedDeityIds: [] as string[],
	forgedTitanIds: [] as string[],
});

const criusMultiplier = (production: ProductionStoreState) => {
	if ((production.levels.crius ?? 0) <= 0) return 1;
	const chaosEnergy = useWorldStore.getState().resourceStore.resources.chaosEnergy;
	return Math.min(4, 1 + 0.1 * Math.max(0, decimal(chaosEnergy).max(1).log10()));
};

/** Owns all Chaos gilds and Cyclopes forging selections and multipliers. */
export const createForgingSlice: ProductionSlice<'forgingStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionStoreState, 'forgingStore', ForgingStoreState>('forgingStore', set, get);

	return {
		forgingStore: {
			...initialState(),
			setGildedTargets: (target, ids) => {
				const production = getRoot();
				const forgeLevel = production.levels[target === 'amplifier' ? 'chaos-crucible-forge' : 'chaos-forge-gilding'] ?? 0;
				if (!forgeLevel) return;

				if (target === 'amplifier') {
					const allowed = [...new Set(ids)].filter(id => AMPLIFIERS.some(amplifier => amplifier.id === id)).slice(0, Math.min(3, forgeLevel));
					setSlice({ gildedAmplifierIds: allowed });
					return;
				}

				const capacity = forgeLevel >= 6 ? GOAL_MULTIPLIER_ARCHETYPES.length : Math.min(5, forgeLevel);
				const allowed = [...new Set(ids)].filter((id): id is GoalMultiplierArchetype =>
					GOAL_MULTIPLIER_ARCHETYPES.includes(id as GoalMultiplierArchetype) && production.goalMultiplierStore.levels[id as GoalMultiplierArchetype] >= 2,
				).slice(0, capacity);
				setSlice({ gildedGoalArchetypes: allowed });
			},
			clearGilds: target => setSlice(target === 'amplifier' ? { gildedAmplifierIds: [] } : { gildedGoalArchetypes: [] }),
			setForgedTargets: (target, ids) => {
				const production = getRoot();
				const forgeLevel = production.levels[target === 'deity' ? 'olympian-cyclopes-forge' : 'titan-cyclopes-forge'] ?? 0;
				if (!forgeLevel) return;
				const allowed = [...new Set(ids)].filter(id => PRODUCTION_BY_ID[id]?.kind === target).slice(0, Math.min(3, forgeLevel));
				setSlice(target === 'deity' ? { forgedDeityIds: allowed } : { forgedTitanIds: allowed });
			},
			clearForgedTargets: target => setSlice(target === 'deity' ? { forgedDeityIds: [] } : { forgedTitanIds: [] }),
			getGildMultiplier: (id, target) => {
				const production = getRoot();
				const forging = getSlice();
				if (target === 'amplifier') {
					const level = production.levels['chaos-crucible-forge'] ?? 0;
					if (!level || !forging.gildedAmplifierIds.includes(id)) return 1;
					const multiplier = level < 4 ? 1.5 : Math.floor(1.5 * Math.pow(1.5, level - 3));
					return multiplier * criusMultiplier(production);
				}

				const level = production.levels['chaos-forge-gilding'] ?? 0;
				if (!level || !forging.gildedGoalArchetypes.includes(id as GoalMultiplierArchetype)) return 1;
				const multiplier = level < 6 ? 1.5 : Math.floor(1.5 + 0.1 * level);
				return multiplier * criusMultiplier(production);
			},
			getForgeMultiplier: (itemId, target) => {
				const production = getRoot();
				const forging = getSlice();
				const level = production.levels[target === 'deity' ? 'olympian-cyclopes-forge' : 'titan-cyclopes-forge'] ?? 0;
				const selected = target === 'deity' ? forging.forgedDeityIds : forging.forgedTitanIds;
				if (!level || !selected.includes(itemId)) return 1;

				let multiplier = Math.pow(1.5, level);
				if (target === 'titan') {
					const titan = TITANS.find(candidate => candidate.id === itemId);
					const owned = production.levels[itemId] ?? 0;
					if (titan?.maxLevel !== undefined && Number.isFinite(titan.maxLevel) && owned > 0) multiplier = Math.min(multiplier, titan.maxLevel / owned);
				}
				return multiplier;
			},
			resetForTranscension: () => setSlice({ gildedAmplifierIds: [], gildedGoalArchetypes: [] }),
			reset: () => setSlice(initialState()),
		},
	};
};
