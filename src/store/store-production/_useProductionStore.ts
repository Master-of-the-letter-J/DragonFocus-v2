import { calculateExponentialGrowth, calculateGeometricCost } from '@/data/calculations/formula-production';
import { DEITIES, PRODUCTION_BY_ID, TITANS } from '@/data/production-data';
import type { ProductionEffectId, ProductionItem, ProductionUnlockState, PurchaseCost } from '@/types/production.types';
import type { SpendableResourceId } from '@/types/resources.types';
import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useWorldStore } from '../store-world/_useWorldStore';
import { mergePersistedNestedState } from '../nested-slice';
import { createAmplifierSlice, type AmplifierStoreState } from './createAmplifierSlice';
import { createGoalMultiplierSlice, type GoalMultiplierStoreState } from './createGoalMultiplierSlice';
import { createForgingSlice, type ForgingStoreState } from './createForgingSlice';
import { createProducerSlice, type ProducerStoreState } from './createProducerSlice';
import { createRespecSlice, type RespecStoreState } from './createRespecSlice';

export interface ProductionStoreState {
	producerStore: ProducerStoreState;
	amplifierStore: AmplifierStoreState;
	goalMultiplierStore: GoalMultiplierStoreState;
	forgingStore: ForgingStoreState;
	respecStore: RespecStoreState;
	levels: Record<string, number>;
	paidCostLevels: Record<string, number>;
	effects: Partial<Record<ProductionEffectId, boolean>>;
	unlockState: ProductionUnlockState;
	unlockedItemIds: string[];
	purchase: (itemId: string, quantity?: number) => boolean;
	sell: (itemId: string, quantity?: number) => boolean;
	getItem: (itemId: string) => ProductionItem | undefined;
	getCost: (itemId: string, quantity?: number) => ReturnType<typeof decimal>;
	getCosts: (itemId: string, quantity?: number) => Partial<Record<SpendableResourceId, ReturnType<typeof decimal>>>;
	canPurchase: (itemId: string) => boolean;
	isItemUnlocked: (itemId: string) => boolean;
	setLevel: (itemId: string, level: number) => void;
	clearItems: (itemIds: readonly string[]) => void;
	updateUnlockState: (changes: Partial<ProductionUnlockState>) => void;
	isEffectActive: (effectId: ProductionEffectId) => boolean;
	setEffect: (effectId: ProductionEffectId, active: boolean) => void;
	resetForArmageddon: () => void;
	resetForTranscension: () => void;
	reset: () => void;
}

type ProductionCoreState = Omit<ProductionStoreState, 'producerStore' | 'amplifierStore' | 'goalMultiplierStore' | 'forgingStore' | 'respecStore'>;
export type ProductionSlice<Keys extends keyof ProductionStoreState> = StateCreator<ProductionStoreState, [], [], Pick<ProductionStoreState, Keys>>;

const emptyUnlockState = (): ProductionUnlockState => ({
	milestone: 0,
	completedGoals: 0,
	completedHabits: 0,
	completedTasks: 0,
	pomodoroMinutes: 0,
	pomodoroSessions: 0,
	population: '8000000000',
	dragonAge: 0,
	darkEnergyEarned: '0',
	plasmaEarned: '0',
	armageddons: 0,
	transcensions: 0,
	checkInCompleted: false,
	checkOutCompleted: false,
});
const geometricCost = (cost: PurchaseCost, owned: number, quantity: number) => calculateGeometricCost(cost, owned, quantity);

/** Evaluates every unlock requirement against the current world and production state. */
const requirementsMet = (item: ProductionItem, state: ProductionStoreState) => {
	const resources = useWorldStore.getState().resourceStore.resources;
	return (item.unlocks ?? []).every(requirement => {
		switch (requirement.metric) {
			case 'milestone':
				return state.unlockState.milestone >= (requirement.amount ?? 0);
			case 'check-in':
				return state.unlockState.checkInCompleted;
			case 'check-out':
				return state.unlockState.checkOutCompleted;
			case 'pomodoro-minutes':
				return state.unlockState.pomodoroMinutes >= (requirement.amount ?? 0);
			case 'pomodoro-sessions':
				return state.unlockState.pomodoroSessions >= (requirement.amount ?? 0);
			case 'completed-goals':
				return state.unlockState.completedGoals >= (requirement.amount ?? 0);
			case 'completed-habits':
				return state.unlockState.completedHabits >= (requirement.amount ?? 0);
			case 'completed-tasks':
				return state.unlockState.completedTasks >= (requirement.amount ?? 0);
			case 'population':
				return resources.population.gte(requirement.amount ?? 0);
			case 'dragon-age':
				return state.unlockState.dragonAge >= (requirement.amount ?? 0);
			case 'dark-energy-earned':
				return decimal(state.unlockState.darkEnergyEarned).gte(requirement.amount ?? 0);
			case 'plasma-earned':
				return decimal(state.unlockState.plasmaEarned).gte(requirement.amount ?? 0);
			case 'resource-earned':
				return useWorldStore.getState().resourceStore.totalAllTime[requirement.resource ?? 'energy'].gte(requirement.amount ?? 0);
			case 'resource-amount':
				return useWorldStore.getState().resourceStore.resources[requirement.resource ?? 'energy'].gte(requirement.amount ?? 0);
			case 'owned-producer':
			case 'owned-item':
				return (state.levels[requirement.itemId ?? ''] ?? 0) >= (requirement.amount ?? 0);
			case 'armageddons':
				return state.unlockState.armageddons >= (requirement.amount ?? 0);
			case 'transcensions':
				return state.unlockState.transcensions >= (requirement.amount ?? 0);
			case 'pantheon-members':
				return (
					['zeus', 'poseidon', 'hades', 'hera', 'demeter', 'athena', 'apollo', 'artemis', 'aphrodite', 'hermes', 'dionysus', 'hestia', 'hectate', 'kronos', 'oceanus', 'hyperion', 'iapetus', 'coeus', 'crius', 'atlas', 'prometheus', 'rhea', 'themis', 'mnemosyne', 'phoebe', 'tethys', 'theia'].filter(id => (state.levels[id] ?? 0) > 0).length >=
					(requirement.amount ?? 0)
				);
			case 'titan-equivalents':
				return ['kronos', 'oceanus', 'hyperion', 'iapetus', 'coeus', 'crius', 'atlas', 'prometheus', 'rhea', 'themis', 'mnemosyne', 'phoebe', 'tethys', 'theia'].reduce((total, id) => total + (state.levels[id] ?? 0), 0) >= (requirement.amount ?? 0);
			case 'effect':
				return Boolean(requirement.effectId && state.effects[requirement.effectId]);
		}
	});
};

const initialState = () => ({
	levels: {} as Record<string, number>,
	paidCostLevels: {} as Record<string, number>,
	effects: {} as Partial<Record<ProductionEffectId, boolean>>,
	unlockState: emptyUnlockState(),
	unlockedItemIds: [] as string[],
});

const effectsForLevels = (levels: Record<string, number>) =>
	Object.fromEntries(
		Object.entries(levels)
			.filter(([id, level]) => level > 0 && PRODUCTION_BY_ID[id]?.effectId)
			.map(([id]) => [PRODUCTION_BY_ID[id].effectId!, true]),
	) as Partial<Record<ProductionEffectId, boolean>>;

const createProductionSlice: StateCreator<ProductionStoreState, [], [], ProductionCoreState> = (set, get) => ({
	...initialState(),
	purchase: (itemId, quantity = 1) => {
		const item = PRODUCTION_BY_ID[itemId];
		const amount = Math.max(1, Math.floor(quantity));
		const owned = get().levels[itemId] ?? 0;
		if (!item || !get().canPurchase(itemId) || (item.maxLevel !== undefined && owned + amount > item.maxLevel)) return false;
		const costs = get().getCosts(itemId, amount);
		const resources = useWorldStore.getState().resourceStore;
		if (!Object.entries(costs).every(([resource, cost]) => resources.resources[resource as SpendableResourceId].gte(cost))) return false;
		for (const [resource, cost] of Object.entries(costs)) resources.spendResource(resource as SpendableResourceId, cost);
		set(state => ({
				levels: { ...state.levels, [itemId]: owned + amount },
				paidCostLevels: item.oneTimeUntilTranscension?.length ? { ...state.paidCostLevels, [itemId]: Math.max(state.paidCostLevels[itemId] ?? 0, owned + amount) } : state.paidCostLevels,
				effects: item.effectId ? { ...state.effects, [item.effectId]: true } : state.effects,
				unlockedItemIds: [...new Set([...(state.unlockedItemIds ?? []), itemId])],
			}));
		if (item.kind === 'producer') get().producerStore.recordPurchase(itemId, owned + amount, amount);
		if (item.kind === 'amplifier') get().amplifierStore.recordPurchase(itemId, owned + amount);
		return true;
	},
	sell: (itemId, quantity = 1) => {
		const item = PRODUCTION_BY_ID[itemId];
		const owned = get().levels[itemId] ?? 0;
		const amount = Math.min(owned, Math.max(1, Math.floor(quantity)));
		if (!item || !amount || item.effectId) return false;
		const requiresRespec = ['energy-upgrade', 'producer-upgrade', 'goal-multiplier', 'pomodoro-boost', 'deity', 'titan', 'forge'].includes(item.kind);
		if (requiresRespec && !get().effects['pantheon-respec']) return false;
		const refundRate =
			item.kind === 'producer' || item.kind === 'amplifier' ? 0.5
			: item.kind === 'deity' || item.kind === 'titan' ? 1
			: 0.7;
		for (const cost of item.costs) useWorldStore.getState().resourceStore.addResource(cost.resource, geometricCost(cost, owned - amount, amount).times(refundRate));
		set(state => ({ levels: { ...state.levels, [itemId]: owned - amount } }));
		return true;
	},
	getItem: itemId => PRODUCTION_BY_ID[itemId],
	getCost: (itemId, quantity = 1) => {
		const item = PRODUCTION_BY_ID[itemId];
		if (!item) return decimal(0);
		return Object.values(get().getCosts(itemId, quantity))[0] ?? decimal(0);
	},
	getCosts: (itemId, quantity = 1) => {
		const item = PRODUCTION_BY_ID[itemId];
		if (!item) return {};
		const owned = get().levels[itemId] ?? 0;
		const levels = get().levels;
		const hermesDiscount = (levels.hermes ?? 0) * 0.01;
		const repairDiscount = item.kind === 'producer' ? Math.min(1, (levels['producer-discount'] ?? 0) * 0.25) : 0;
		const amplifierDiscount = item.kind === 'amplifier' ? Math.min(0.9, (levels['amplifier-discount-glitch'] ?? 0) * (0.1 + hermesDiscount)) : 0;
		const discount = 1 - amplifierDiscount;
		const amount = Math.max(1, Math.floor(quantity));
		const paidLevel = get().paidCostLevels[itemId] ?? 0;
		const totals: Partial<Record<SpendableResourceId, ReturnType<typeof decimal>>> = {};
		for (const cost of [...item.costs, ...(item.activationCosts ?? [])]) {
			if (cost.resource === 'anomaly' && item.kind === 'deity' && item.id !== 'hectate') {
				const summoned = DEITIES.filter(deity => (levels[deity.id] ?? 0) > 0).length;
				const value = Array.from({ length: amount }, (_, index) => {
					const level = owned + index;
					return level === 0 ? decimal(Math.floor(Math.pow(2.5, summoned))) : calculateExponentialGrowth(cost, level - 1);
				}).reduce((total, levelCost) => total.plus(levelCost), decimal(0));
				totals.anomaly = (totals.anomaly ?? decimal(0)).plus(value);
				continue;
			}
			if (cost.resource === 'anomaly' && item.kind === 'titan' && item.id !== 'kronos' && owned === 0) {
				const titanEquivalents = TITANS.filter(titan => titan.id !== 'kronos').reduce((total, titan) => total + (levels[titan.id] ?? 0), 0);
				const value = decimal(125).times(decimal(2).pow(titanEquivalents));
				totals.anomaly = (totals.anomaly ?? decimal(0)).plus(value);
				continue;
			}
			const remembered = item.oneTimeUntilTranscension?.includes(cost.resource) ?? false;
			const start = remembered ? Math.max(owned, paidLevel) : owned;
			const payableQuantity = remembered ? Math.max(0, owned + amount - start) : amount;
			if (!payableQuantity) continue;
			const destroyed = item.kind === 'producer' ? (get().producerStore.destroyedLevels[itemId] ?? 0) : 0;
			const belowPreviousBest = Math.max(0, (get().producerStore.bestLevels[itemId] ?? owned) - owned);
			const repairQuantity = Math.min(payableQuantity, destroyed, belowPreviousBest);
			const regularQuantity = payableQuantity - repairQuantity;
			const repairValue = repairQuantity ? geometricCost(cost, start, repairQuantity).times(1 - repairDiscount) : decimal(0);
			const regularValue = regularQuantity ? geometricCost(cost, start + repairQuantity, regularQuantity).times(discount) : decimal(0);
			const value = repairValue.plus(regularValue);
			totals[cost.resource] = (totals[cost.resource] ?? decimal(0)).plus(value);
		}
		if (owned === 0 && !(get().unlockedItemIds ?? []).includes(itemId)) {
			for (const cost of item.unlockCosts ?? []) {
				totals[cost.resource] = (totals[cost.resource] ?? decimal(0)).plus(decimal(cost.base));
			}
		}
		return totals;
	},
	canPurchase: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		if (!item || (item.maxLevel !== undefined && (get().levels[itemId] ?? 0) >= item.maxLevel)) return false;
		return get().isItemUnlocked(itemId);
	},
	isItemUnlocked: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		if (!item) return false;
		if (item.kind === 'amplifier' && !get().amplifierStore.isUnlocked(itemId)) return false;
		if (item.kind === 'deity' && item.id !== 'zeus' && (get().levels.zeus ?? 0) === 0) return false;
		if (item.kind === 'titan' && item.id !== 'kronos' && (get().levels.kronos ?? 0) === 0) return false;
		return requirementsMet(item, get());
	},
	setLevel: (itemId, level) => {
		const nextLevel = Math.max(0, Math.floor(level));
		set(state => ({ levels: { ...state.levels, [itemId]: nextLevel } }));
		if (PRODUCTION_BY_ID[itemId]?.kind === 'producer') get().producerStore.recordLevel(itemId, nextLevel);
	},
	clearItems: itemIds => {
		const ids = new Set(itemIds);
		if (!ids.size) return;
		set(state => ({
			levels: Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, ids.has(id) ? 0 : level])),
			paidCostLevels: Object.fromEntries(Object.entries(state.paidCostLevels).filter(([id]) => !ids.has(id))),
		}));
	},
	updateUnlockState: changes => set(state => ({ unlockState: { ...state.unlockState, ...changes } })),
	isEffectActive: effectId => Boolean(get().effects[effectId]),
	setEffect: (effectId, active) => set(state => ({ effects: { ...state.effects, [effectId]: active } })),
	resetForArmageddon: () =>
		set(state => {
			const levels = Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, PRODUCTION_BY_ID[id]?.persistsOnArmageddon ? level : 0]));
			return { levels, effects: effectsForLevels(levels) };
		}),
	resetForTranscension: () => {
		get().forgingStore.resetForTranscension();
		get().goalMultiplierStore.resetForTranscension();
		get().producerStore.resetForTranscension();
		set(state => {
			const levels = Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, PRODUCTION_BY_ID[id]?.persistsOnTranscension ? level : 0]));
			return {
				levels,
				paidCostLevels: {},
				effects: effectsForLevels(levels),
			};
		});
	},
	reset: () => {
		get().producerStore.reset();
		get().amplifierStore.reset();
		get().goalMultiplierStore.reset();
		get().forgingStore.reset();
		get().respecStore.reset();
		set(initialState());
	},
});

/** Combined production hook composed through feature-owned Zustand slices. */
export const useProductionStore = create<ProductionStoreState>()(
	persist(
		(...store) => ({
			...createProductionSlice(...store),
			...createProducerSlice(...store),
			...createAmplifierSlice(...store),
			...createGoalMultiplierSlice(...store),
			...createForgingSlice(...store),
			...createRespecSlice(...store),
		}),
		{
			name: 'dragonfocus:production',
			storage: createJSONStorage(() => AsyncStorage),
			merge: (persisted, current) => {
				const stored = (persisted ?? {}) as Partial<ProductionStoreState> & {
					producerProgress?: ProducerStoreState['progress'];
					bestProducerLevels?: ProducerStoreState['bestLevels'];
					destroyedProducerLevels?: ProducerStoreState['destroyedLevels'];
					unlockedAmplifierIds?: string[];
					gildedAmplifierIds?: string[];
					gildedGoalMultiplierIds?: string[];
					forgedDeityIds?: string[];
					forgedTitanIds?: string[];
				};
				const merged = mergePersistedNestedState(stored, current, ['producerStore', 'amplifierStore', 'goalMultiplierStore', 'forgingStore', 'respecStore']);
				return {
					...merged,
					producerStore: {
						...merged.producerStore,
						progress: stored.producerProgress ?? merged.producerStore.progress,
						bestLevels: stored.bestProducerLevels ?? merged.producerStore.bestLevels,
						destroyedLevels: stored.destroyedProducerLevels ?? merged.producerStore.destroyedLevels,
					},
					amplifierStore: { ...merged.amplifierStore, unlockedIds: stored.unlockedAmplifierIds ?? merged.amplifierStore.unlockedIds },
					forgingStore: {
						...merged.forgingStore,
						gildedAmplifierIds: stored.gildedAmplifierIds ?? merged.forgingStore.gildedAmplifierIds,
						gildedGoalArchetypes: (stored.gildedGoalMultiplierIds as ForgingStoreState['gildedGoalArchetypes'] | undefined) ?? merged.forgingStore.gildedGoalArchetypes,
						forgedDeityIds: stored.forgedDeityIds ?? merged.forgingStore.forgedDeityIds,
						forgedTitanIds: stored.forgedTitanIds ?? merged.forgingStore.forgedTitanIds,
					},
				};
			},
		},
	),
);

export const getLevel = (levels: Record<string, number>, itemId: string) => levels[itemId] ?? 0;
export const getDeityLevels = (levels: Record<string, number>) =>
	Object.fromEntries(
		['zeus', 'poseidon', 'hades', 'hera', 'demeter', 'athena', 'apollo', 'artemis', 'aphrodite', 'hermes', 'dionysus', 'hestia', 'hectate', 'kronos', 'oceanus', 'hyperion', 'iapetus', 'coeus', 'crius', 'atlas', 'prometheus', 'rhea', 'themis', 'mnemosyne', 'phoebe', 'tethys', 'theia'].map(id => {
			const level = levels[id] ?? 0;
			const kind = PRODUCTION_BY_ID[id]?.kind;
			const target =
				kind === 'titan' ? 'titan'
				: kind === 'deity' ? 'deity'
				: undefined;
			return [id, target ? level * useProductionStore.getState().forgingStore.getForgeMultiplier(id, target) : level];
		}),
	);
