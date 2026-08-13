import { activeGoalMultiplierProduct, balancedXp, goalMultiplierUpgradeCost, goalMultiplierValue, multiplierLevelForXp } from '@/data/calculations/formula-goal-multipliers';
import { GOAL_MULTIPLIER_ARCHETYPES, type GoalMultiplierArchetype, type GoalMultiplierLevels, type GoalMultiplierUpgradeLevels, type GoalMultiplierXp } from '@/types/goal-multiplier.types';
import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useResourceStore } from '../store-world/createResourceSlice';
import { useProductionStore } from './_useProductionStore';

const emptyRecord = <Value>(value: Value): Record<GoalMultiplierArchetype, Value> => Object.fromEntries(GOAL_MULTIPLIER_ARCHETYPES.map(archetype => [archetype, value])) as Record<GoalMultiplierArchetype, Value>;

export interface GoalMultiplierStoreState {
	xp: GoalMultiplierXp;
	levels: GoalMultiplierLevels;
	upgradeLevels: GoalMultiplierUpgradeLevels;
	completedGoals: GoalMultiplierLevels;
	gildedArchetypes: GoalMultiplierArchetype[];
	claimedShardLevels: GoalMultiplierLevels;
	recordXp: (archetype: GoalMultiplierArchetype, amount: number) => void;
	purchaseUpgrade: (archetype: GoalMultiplierArchetype) => boolean;
	claimLevelShard: (archetype: GoalMultiplierArchetype) => boolean;
	setGildedArchetypes: (archetypes: GoalMultiplierArchetype[]) => void;
	isUnlocked: (archetype: GoalMultiplierArchetype) => boolean;
	getDarkEnergyMultiplier: (archetype: GoalMultiplierArchetype) => number;
	getProductionMultiplier: () => number;
	respecUpgrades: () => ReturnType<typeof decimal>;
	resetForTranscension: () => void;
	reset: () => void;
}

const levelsFromXp = (xp: GoalMultiplierXp): GoalMultiplierLevels => {
	const levels = Object.fromEntries(GOAL_MULTIPLIER_ARCHETYPES.map(archetype => [archetype, multiplierLevelForXp(xp[archetype])])) as GoalMultiplierLevels;
	return { ...levels, balanced: multiplierLevelForXp(balancedXp(xp)) };
};

const initialState = () => {
	const xp = emptyRecord(0);
	return {
		xp,
		levels: levelsFromXp(xp),
		upgradeLevels: emptyRecord(0),
		completedGoals: emptyRecord(0),
		gildedArchetypes: [] as GoalMultiplierArchetype[],
		claimedShardLevels: emptyRecord(0),
	};
};

const chaosForgeMultiplier = (archetype: GoalMultiplierArchetype, gilded: readonly GoalMultiplierArchetype[]) => {
	const production = useProductionStore.getState();
	const forgeLevel = production.levels['chaos-forge-gilding'] ?? 0;
	if (!forgeLevel || !gilded.includes(archetype)) return 1;
	const forgeMultiplier = forgeLevel >= 6 ? Math.floor(1.5 + 0.1 * forgeLevel) : 1.5;
	const chaosEnergy = useResourceStore.getState().resources.chaosEnergy;
	const criusMultiplier = (production.levels.crius ?? 0) > 0 ? Math.min(4, 1 + 0.1 * Math.max(0, decimal(chaosEnergy).max(1).log10())) : 1;
	return forgeMultiplier * criusMultiplier;
};

const goalMultipliersAvailable = () => useProductionStore.getState().unlockState.milestone >= 3;

const createGoalMultiplierStoreSlice: StateCreator<GoalMultiplierStoreState> = (set, get) => ({
	...initialState(),
	recordXp: (archetype, amount) => {
		if (!goalMultipliersAvailable() || !Number.isFinite(amount) || amount <= 0 || archetype === 'balanced') return;
		set(state => {
			const xp = { ...state.xp, [archetype]: state.xp[archetype] + Math.floor(amount) };
			xp.balanced = balancedXp(xp);
			const completedGoals = { ...state.completedGoals, [archetype]: state.completedGoals[archetype] + 1 };
			completedGoals.balanced = Math.min(completedGoals.personal, completedGoals.scholar, completedGoals.athlete, completedGoals.entrepreneur, completedGoals.fellowship);
			return { xp, levels: levelsFromXp(xp), completedGoals };
		});
	},
	purchaseUpgrade: archetype => {
		if (!get().isUnlocked(archetype)) return false;
		const level = get().upgradeLevels[archetype];
		if (level > 0 || !useResourceStore.getState().spendResource('darkEnergy', decimal(goalMultiplierUpgradeCost(level)))) return false;
		set(state => ({ upgradeLevels: { ...state.upgradeLevels, [archetype]: 1 } }));
		return true;
	},
	claimLevelShard: archetype => {
		const state = get();
		if (state.claimedShardLevels[archetype] >= state.levels[archetype]) return false;
		useResourceStore.getState().addResource('shards', 5);
		set(current => ({
			claimedShardLevels: {
				...current.claimedShardLevels,
				[archetype]: current.claimedShardLevels[archetype] + 1,
			},
		}));
		return true;
	},
	setGildedArchetypes: archetypes => {
		const forgeLevel = useProductionStore.getState().levels['chaos-forge-gilding'] ?? 0;
		if (!forgeLevel) return;
		const capacity = forgeLevel >= 6 ? GOAL_MULTIPLIER_ARCHETYPES.length : Math.min(5, forgeLevel);
		set({ gildedArchetypes: [...new Set(archetypes)].filter(archetype => GOAL_MULTIPLIER_ARCHETYPES.includes(archetype)).slice(0, capacity) });
	},
	isUnlocked: archetype => goalMultipliersAvailable() && get().completedGoals[archetype] >= 5,
	getDarkEnergyMultiplier: archetype => {
		const state = get();
		if (!state.isUnlocked(archetype)) return 1;
		return goalMultiplierValue(state.xp[archetype], chaosForgeMultiplier(archetype, state.gildedArchetypes));
	},
	getProductionMultiplier: () => {
		const state = get();
		if (!goalMultipliersAvailable()) return 1;
		const active = GOAL_MULTIPLIER_ARCHETYPES.filter(archetype => state.isUnlocked(archetype) && state.upgradeLevels[archetype] > 0);
		return activeGoalMultiplierProduct(state.xp, state.upgradeLevels, active);
	},
	respecUpgrades: () => {
		const state = get();
		const refund = GOAL_MULTIPLIER_ARCHETYPES.reduce((total, archetype) => {
			const upgrades = state.upgradeLevels[archetype];
			return total.plus(Array.from({ length: upgrades }, (_, level) => goalMultiplierUpgradeCost(level)).reduce((sum, cost) => sum + cost, 0));
		}, decimal(0));
		set({ upgradeLevels: emptyRecord(0), gildedArchetypes: [] });
		return refund;
	},
	resetForTranscension: () =>
		set(state => ({
			upgradeLevels: emptyRecord(0),
			gildedArchetypes: [],
			claimedShardLevels: state.claimedShardLevels,
		})),
	reset: () => set(initialState()),
});

export const useGoalMultiplierStore = create<GoalMultiplierStoreState>()(persist((...store) => ({ ...createGoalMultiplierStoreSlice(...store) }), { name: 'dragonfocus:goal-multipliers', storage: createJSONStorage(() => AsyncStorage) }));

/** Registers Goal Multipliers in the combined production store. */
export const createGoalMultiplierSlice = () => ({ goalMultiplierStore: useGoalMultiplierStore });
