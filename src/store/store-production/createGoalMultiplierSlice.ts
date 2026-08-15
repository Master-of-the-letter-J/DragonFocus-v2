import { activeGoalMultiplierProduct, balancedXp, goalMultiplierUpgradeCost, goalMultiplierValue, multiplierLevelForXp } from '@/data/calculations/formula-goal-multipliers';
import { GOAL_MULTIPLIER_ARCHETYPES, type GoalMultiplierArchetype, type GoalMultiplierLevels, type GoalMultiplierUpgradeLevels, type GoalMultiplierXp } from '@/types/goal-multiplier.types';
import { decimal } from '@/utils/decimal';
import { scopeNestedSlice } from '../nested-slice';
import { useWorldStore } from '../store-world/_useWorldStore';
import type { ProductionSlice, ProductionStoreState } from './_useProductionStore';

const emptyRecord = <Value>(value: Value): Record<GoalMultiplierArchetype, Value> => Object.fromEntries(GOAL_MULTIPLIER_ARCHETYPES.map(archetype => [archetype, value])) as Record<GoalMultiplierArchetype, Value>;

export interface GoalMultiplierStoreState {
	xp: GoalMultiplierXp;
	levels: GoalMultiplierLevels;
	upgradeLevels: GoalMultiplierUpgradeLevels;
	completedGoals: GoalMultiplierLevels;
	claimedShardLevels: GoalMultiplierLevels;
	recordXp: (archetype: GoalMultiplierArchetype, amount: number) => void;
	purchaseUpgrade: (archetype: GoalMultiplierArchetype) => boolean;
	claimLevelShard: (archetype: GoalMultiplierArchetype) => boolean;
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
		claimedShardLevels: emptyRecord(0),
	};
};

export const createGoalMultiplierSlice: ProductionSlice<'goalMultiplierStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionStoreState, 'goalMultiplierStore', GoalMultiplierStoreState>('goalMultiplierStore', set, get);
	const goalMultipliersAvailable = () => getRoot().unlockState.milestone >= 3;

	return {
		goalMultiplierStore: {
			...initialState(),
			recordXp: (archetype, amount) => {
		if (!goalMultipliersAvailable() || !Number.isFinite(amount) || amount <= 0 || archetype === 'balanced') return;
		setSlice(state => {
			const xp = { ...state.xp, [archetype]: state.xp[archetype] + Math.floor(amount) };
			xp.balanced = balancedXp(xp);
			const completedGoals = { ...state.completedGoals, [archetype]: state.completedGoals[archetype] + 1 };
			completedGoals.balanced = Math.min(completedGoals.personal, completedGoals.scholar, completedGoals.athlete, completedGoals.entrepreneur, completedGoals.fellowship);
			return { xp, levels: levelsFromXp(xp), completedGoals };
		});
	},
	purchaseUpgrade: archetype => {
		if (!getSlice().isUnlocked(archetype)) return false;
		const level = getSlice().upgradeLevels[archetype];
		if (level > 0 || !useWorldStore.getState().resourceStore.spendResource('darkEnergy', decimal(goalMultiplierUpgradeCost(level)))) return false;
		setSlice(state => ({ upgradeLevels: { ...state.upgradeLevels, [archetype]: 1 } }));
		return true;
	},
	claimLevelShard: archetype => {
		const state = getSlice();
		if (state.claimedShardLevels[archetype] >= state.levels[archetype]) return false;
		useWorldStore.getState().resourceStore.addResource('shards', 5);
		setSlice(current => ({
			claimedShardLevels: {
				...current.claimedShardLevels,
				[archetype]: current.claimedShardLevels[archetype] + 1,
			},
		}));
		return true;
	},
	isUnlocked: archetype => goalMultipliersAvailable() && getSlice().completedGoals[archetype] >= 5,
	getDarkEnergyMultiplier: archetype => {
		const state = getSlice();
		if (!state.isUnlocked(archetype)) return 1;
		return goalMultiplierValue(state.xp[archetype], getRoot().forgingStore.getGildMultiplier(archetype, 'goal'));
	},
	getProductionMultiplier: () => {
		const state = getSlice();
		if (!goalMultipliersAvailable()) return 1;
		const active = GOAL_MULTIPLIER_ARCHETYPES.filter(archetype => state.isUnlocked(archetype) && state.upgradeLevels[archetype] > 0);
		return activeGoalMultiplierProduct(state.xp, state.upgradeLevels, active);
	},
	respecUpgrades: () => {
		const state = getSlice();
		const refund = GOAL_MULTIPLIER_ARCHETYPES.reduce((total, archetype) => {
			const upgrades = state.upgradeLevels[archetype];
			return total.plus(Array.from({ length: upgrades }, (_, level) => goalMultiplierUpgradeCost(level)).reduce((sum, cost) => sum + cost, 0));
		}, decimal(0));
		setSlice({ upgradeLevels: emptyRecord(0) });
		getRoot().forgingStore.clearGilds('goal');
		return refund;
	},
	resetForTranscension: () =>
		setSlice(state => ({
			upgradeLevels: emptyRecord(0),
			claimedShardLevels: state.claimedShardLevels,
		})),
	reset: () => setSlice(initialState()),
		},
	};
};
