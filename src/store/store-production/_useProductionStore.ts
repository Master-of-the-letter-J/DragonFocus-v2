import { calculateExponentialGrowth, calculateGeometricCost } from '@/data/calculations/formula-production';
import { AMPLIFIERS, DEITIES, PRODUCERS_BY_ID, PRODUCTION_BY_ID, TITANS } from '@/data/production-data';
import type { ProducerDefinition, ProductionEffectId, ProductionItem, ProductionUnlockState, PurchaseCost } from '@/types/production.types';
import type { SpendableResourceId } from '@/types/resources.types';
import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useResourceStore } from '../store-world/createResourceSlice';
import { createAmplifierSlice, useAmplifierStore } from './createAmplifierSlice';
import { createGoalMultiplierSlice, useGoalMultiplierStore } from './createGoalMultiplierSlice';
import { createProducerSlice, useProducerStore } from './createProducerSlice';
import { createRespecSlice, useRespecStore } from './createRespecSlice';

export interface ProducerProgress {
	durability: number;
	quantumGrowths: number;
	evolutions: number;
	metamorphosed: boolean;
}

export interface ProductionStoreState {
	producerStore: typeof useProducerStore;
	amplifierStore: typeof useAmplifierStore;
	goalMultiplierStore: typeof useGoalMultiplierStore;
	respecStore: typeof useRespecStore;
	levels: Record<string, number>;
	paidCostLevels: Record<string, number>;
	producerProgress: Record<string, ProducerProgress>;
	bestProducerLevels: Record<string, number>;
	destroyedProducerLevels: Record<string, number>;
	effects: Partial<Record<ProductionEffectId, boolean>>;
	unlockState: ProductionUnlockState;
	gildedAmplifierIds: string[];
	gildedGoalMultiplierIds: string[];
	forgedDeityIds: string[];
	forgedTitanIds: string[];
	unlockedAmplifierIds: string[];
	unlockedItemIds: string[];
	purchase: (itemId: string, quantity?: number) => boolean;
	sell: (itemId: string, quantity?: number) => boolean;
	getItem: (itemId: string) => ProductionItem | undefined;
	getCost: (itemId: string, quantity?: number) => ReturnType<typeof decimal>;
	getCosts: (itemId: string, quantity?: number) => Partial<Record<SpendableResourceId, ReturnType<typeof decimal>>>;
	canPurchase: (itemId: string) => boolean;
	setLevel: (itemId: string, level: number) => void;
	clearItems: (itemIds: readonly string[]) => void;
	clearGilds: (target: 'amplifier' | 'goal') => void;
	clearForgedTargets: (target: 'deity' | 'titan') => void;
	resetGrowthsAndEvolutions: () => void;
	updateUnlockState: (changes: Partial<ProductionUnlockState>) => void;
	isEffectActive: (effectId: ProductionEffectId) => boolean;
	setEffect: (effectId: ProductionEffectId, active: boolean) => void;
	growProducer: (producerId: string) => boolean;
	evolveProducer: (producerId: string) => boolean;
	metamorphoseProducer: (producerId: string) => boolean;
	setGildedTargets: (target: 'amplifier' | 'goal', ids: string[]) => void;
	setForgedTargets: (target: 'deity' | 'titan', ids: string[]) => void;
	getForgeMultiplier: (itemId: string, target: 'amplifier' | 'goal' | 'deity' | 'titan') => number;
	applyDragonMassDestruction: (dragonAgeDays: number) => number;
	applyArmageddonDestruction: (armageddonLevel: number) => number;
	repairProducer: (producerId: string, quantity?: number) => boolean;
	resetForArmageddon: () => void;
	resetForTranscension: () => void;
	reset: () => void;
}

type ProductionCoreState = Omit<ProductionStoreState, 'producerStore' | 'amplifierStore' | 'goalMultiplierStore' | 'respecStore'>;

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
const progressFor = (baseDurability = 1): ProducerProgress => ({ durability: baseDurability * 100, quantumGrowths: 0, evolutions: 0, metamorphosed: false });

const wholeNumber = (value: number) => Math.max(0, Math.floor(value));

/** Growth #1 costs one Plasma and one Quark; later Growths use the same resource definitions. */
export const getQuantumGrowthCost = (producer: ProducerDefinition, currentGrowths: number) => ({
	plasmaResource: producer.quantumGrowth.plasmaCost.resource,
	plasma: calculateExponentialGrowth(producer.quantumGrowth.plasmaCost, wholeNumber(currentGrowths)),
	quarkResource: producer.quantumGrowth.quarkCost.resource,
	quarks: calculateExponentialGrowth(producer.quantumGrowth.quarkCost, wholeNumber(currentGrowths)),
});

/** Evolution #n costs 5^n Dark Plasma and 50n Quarks. */
export const getEvolutionSerumCost = (producer: ProducerDefinition, evolutionAmount: number) => {
	const amount = Math.max(1, Math.floor(evolutionAmount));
	return {
		darkPlasma: calculateExponentialGrowth(producer.evolution.darkPlasmaCost, amount - 1),
		quarks: decimal(producer.evolution.quarkCostPerEvolution).times(amount),
	};
};

const romanNumeral = (value: number) => {
	const numerals: readonly [number, string][] = [
		[1_000, 'M'],
		[900, 'CM'],
		[500, 'D'],
		[400, 'CD'],
		[100, 'C'],
		[90, 'XC'],
		[50, 'L'],
		[40, 'XL'],
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I'],
	];
	let remaining = Math.max(1, Math.floor(value));
	return numerals.reduce((label, [amount, symbol]) => {
		const count = Math.floor(remaining / amount);
		remaining %= amount;
		return label + symbol.repeat(count);
	}, '');
};

/** Names expose the producer's machine-to-dragon lifecycle without storing duplicate labels. */
export const getProducerDisplayName = (producer: ProducerDefinition, progress: Pick<ProducerProgress, 'quantumGrowths' | 'evolutions' | 'metamorphosed'>) => {
	const evolutions = wholeNumber(progress.evolutions);
	if (!evolutions) return progress.quantumGrowths > 0 ? `${producer.name} Dragon Egg` : producer.name;

	const stages = ['Hatchling', 'Dragonet', 'Juvenile', 'Young Adult', 'Adult'] as const;
	if (evolutions <= stages.length) return progress.metamorphosed && evolutions === stages.length ? producer.metamorphosis.name : `${producer.name} ${stages[evolutions - 1]}`;

	const stageRoot = progress.metamorphosed ? producer.metamorphosis.name : `${producer.name} Adult`;
	const greekStages = ['αʹ', 'βʹ', 'γʹ', 'δʹ', 'εʹ', 'ϛʹ', 'ζʹ', 'ηʹ', 'θʹ', 'ιʹ'];
	const stage = evolutions - stages.length;
	return `${stageRoot} Stage ${greekStages[stage - 1] ?? romanNumeral(stage)}`;
};

/** Durability is a static resistance number; it is not a rechargeable health bar. */
const durabilityCapacity = (producerId: string, levels: Record<string, number>) => {
	const producer = PRODUCERS_BY_ID[producerId];
	if (!producer) return 100;
	return producer.baseDurability * 100 * Math.pow(producer.upgrades.durabilityMultiplier, levels[`${producerId}-core-upgrade`] ?? 0);
};

const geometricCost = (cost: PurchaseCost, owned: number, quantity: number) => calculateGeometricCost(cost, owned, quantity);

/** Evaluates every unlock requirement against the current world and production state. */
const requirementsMet = (item: ProductionItem, state: ProductionStoreState) => {
	const resources = useResourceStore.getState().resources;
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
				return useResourceStore.getState().totalAllTime[requirement.resource ?? 'energy'].gte(requirement.amount ?? 0);
			case 'resource-amount':
				return useResourceStore.getState().resources[requirement.resource ?? 'energy'].gte(requirement.amount ?? 0);
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
	producerProgress: {} as Record<string, ProducerProgress>,
	bestProducerLevels: {} as Record<string, number>,
	destroyedProducerLevels: {} as Record<string, number>,
	effects: {} as Partial<Record<ProductionEffectId, boolean>>,
	unlockState: emptyUnlockState(),
	gildedAmplifierIds: [] as string[],
	gildedGoalMultiplierIds: [] as string[],
	forgedDeityIds: [] as string[],
	forgedTitanIds: [] as string[],
	unlockedAmplifierIds: [AMPLIFIERS[0].id],
	unlockedItemIds: [] as string[],
});

const effectsForLevels = (levels: Record<string, number>) =>
	Object.fromEntries(
		Object.entries(levels)
			.filter(([id, level]) => level > 0 && PRODUCTION_BY_ID[id]?.effectId)
			.map(([id]) => [PRODUCTION_BY_ID[id].effectId!, true]),
	) as Partial<Record<ProductionEffectId, boolean>>;

/** Applies a one-time destruction event and records every lost unit as repairable. */
const producerDestruction = (state: ProductionStoreState, damageNumerator: number, minimumFraction: number) => {
	let totalDestroyed = 0;
	const destroyedProducerLevels = { ...state.destroyedProducerLevels };
	const bestProducerLevels = { ...state.bestProducerLevels };
	const levels = { ...state.levels };

	for (const producer of Object.values(PRODUCERS_BY_ID)) {
		const owned = levels[producer.id] ?? 0;
		if (!owned || state.producerProgress[producer.id]?.metamorphosed) continue;

		const durability = Math.max(0.000_001, durabilityCapacity(producer.id, state.levels));
		const destroyedFraction = Math.min(1, Math.max(minimumFraction, damageNumerator / durability));
		const destroyed = Math.min(owned, Math.max(1, Math.ceil(owned * destroyedFraction)));
		bestProducerLevels[producer.id] = Math.max(bestProducerLevels[producer.id] ?? 0, owned);
		levels[producer.id] = owned - destroyed;
		destroyedProducerLevels[producer.id] = (destroyedProducerLevels[producer.id] ?? 0) + destroyed;
		totalDestroyed += destroyed;
	}

	return { levels, bestProducerLevels, destroyedProducerLevels, totalDestroyed };
};

const createProductionSlice: StateCreator<ProductionStoreState, [], [], ProductionCoreState> = (set, get) => ({
	...initialState(),
	purchase: (itemId, quantity = 1) => {
		const item = PRODUCTION_BY_ID[itemId];
		const amount = Math.max(1, Math.floor(quantity));
		const owned = get().levels[itemId] ?? 0;
		if (!item || !get().canPurchase(itemId) || (item.maxLevel !== undefined && owned + amount > item.maxLevel)) return false;
		const costs = get().getCosts(itemId, amount);
		const resources = useResourceStore.getState();
		if (!Object.entries(costs).every(([resource, cost]) => resources.resources[resource as SpendableResourceId].gte(cost))) return false;
		for (const [resource, cost] of Object.entries(costs)) resources.spendResource(resource as SpendableResourceId, cost);
		set(state => {
			const amplifierIndex = item.kind === 'amplifier' ? AMPLIFIERS.findIndex(amplifier => amplifier.id === itemId) : -1;
			const nextAmplifier = amplifierIndex >= 0 && owned + amount >= 5 ? AMPLIFIERS[amplifierIndex + 1]?.id : undefined;
			return {
				levels: { ...state.levels, [itemId]: owned + amount },
				bestProducerLevels: item.kind === 'producer' ? { ...state.bestProducerLevels, [itemId]: Math.max(state.bestProducerLevels[itemId] ?? 0, owned + amount) } : state.bestProducerLevels,
				destroyedProducerLevels: item.kind === 'producer' ? { ...state.destroyedProducerLevels, [itemId]: Math.max(0, (state.destroyedProducerLevels[itemId] ?? 0) - amount) } : state.destroyedProducerLevels,
				paidCostLevels: item.oneTimeUntilTranscension?.length ? { ...state.paidCostLevels, [itemId]: Math.max(state.paidCostLevels[itemId] ?? 0, owned + amount) } : state.paidCostLevels,
				producerProgress: item.kind === 'producer' ? { ...state.producerProgress, [itemId]: state.producerProgress[itemId] ?? { ...progressFor(PRODUCERS_BY_ID[itemId]?.baseDurability), durability: durabilityCapacity(itemId, state.levels) } } : state.producerProgress,
				effects: item.effectId ? { ...state.effects, [item.effectId]: true } : state.effects,
				unlockedAmplifierIds: nextAmplifier ? [...new Set([...state.unlockedAmplifierIds, nextAmplifier])] : state.unlockedAmplifierIds,
				unlockedItemIds: [...new Set([...(state.unlockedItemIds ?? []), itemId])],
			};
		});
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
		for (const cost of item.costs) useResourceStore.getState().addResource(cost.resource, geometricCost(cost, owned - amount, amount).times(refundRate));
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
			const destroyed = item.kind === 'producer' ? (get().destroyedProducerLevels[itemId] ?? 0) : 0;
			const belowPreviousBest = Math.max(0, (get().bestProducerLevels[itemId] ?? owned) - owned);
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
		if (item.kind === 'amplifier' && !get().unlockedAmplifierIds.includes(itemId)) return false;
		if (item.kind === 'deity' && item.id !== 'zeus' && (get().levels.zeus ?? 0) === 0) return false;
		if (item.kind === 'titan' && item.id !== 'kronos' && (get().levels.kronos ?? 0) === 0) return false;
		return requirementsMet(item, get());
	},
	setLevel: (itemId, level) =>
		set(state => {
			const nextLevel = Math.max(0, Math.floor(level));
			return {
				levels: { ...state.levels, [itemId]: nextLevel },
				bestProducerLevels: PRODUCTION_BY_ID[itemId]?.kind === 'producer' ? { ...state.bestProducerLevels, [itemId]: Math.max(state.bestProducerLevels[itemId] ?? 0, nextLevel) } : state.bestProducerLevels,
			};
		}),
	clearItems: itemIds => {
		const ids = new Set(itemIds);
		if (!ids.size) return;
		set(state => ({
			levels: Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, ids.has(id) ? 0 : level])),
			paidCostLevels: Object.fromEntries(Object.entries(state.paidCostLevels).filter(([id]) => !ids.has(id))),
		}));
	},
	clearGilds: target => set(target === 'amplifier' ? { gildedAmplifierIds: [] } : { gildedGoalMultiplierIds: [] }),
	clearForgedTargets: target => set(target === 'deity' ? { forgedDeityIds: [] } : { forgedTitanIds: [] }),
	resetGrowthsAndEvolutions: () =>
		set(state => ({
			producerProgress: Object.fromEntries(Object.entries(state.producerProgress).map(([id, progress]) => [id, { ...progress, quantumGrowths: 0, evolutions: 0 }])) as Record<string, ProducerProgress>,
		})),
	updateUnlockState: changes => set(state => ({ unlockState: { ...state.unlockState, ...changes } })),
	isEffectActive: effectId => Boolean(get().effects[effectId]),
	setEffect: (effectId, active) => set(state => ({ effects: { ...state.effects, [effectId]: active } })),
	growProducer: producerId => {
		const producer = PRODUCERS_BY_ID[producerId];
		const progress = get().producerProgress[producerId] ?? progressFor(producer?.baseDurability);
		if (!producer || !get().effects['signal-chaos']) return false;
		const resources = useResourceStore.getState();
		const cost = getQuantumGrowthCost(producer, progress.quantumGrowths);
		if (resources.resources[cost.plasmaResource].lt(cost.plasma) || resources.resources[cost.quarkResource].lt(cost.quarks)) return false;
		resources.spendResource(cost.plasmaResource, cost.plasma);
		resources.spendResource(cost.quarkResource, cost.quarks);
		set(state => ({ producerProgress: { ...state.producerProgress, [producerId]: { ...progress, quantumGrowths: progress.quantumGrowths + 1 } } }));
		return true;
	},
	evolveProducer: producerId => {
		const producer = PRODUCERS_BY_ID[producerId];
		const progress = get().producerProgress[producerId] ?? progressFor(producer?.baseDurability);
		if (!producer || !get().effects['chaos-awakened'] || progress.quantumGrowths < (progress.evolutions + 1) * producer.evolution.requiredGrowths) return false;
		const serum = getEvolutionSerumCost(producer, progress.evolutions + 1);
		const resources = useResourceStore.getState();
		if (resources.resources.darkPlasma.lt(serum.darkPlasma) || resources.resources.quarks.lt(serum.quarks)) return false;
		resources.spendResource('darkPlasma', serum.darkPlasma);
		resources.spendResource('quarks', serum.quarks);
		set(state => ({ producerProgress: { ...state.producerProgress, [producerId]: { ...progress, evolutions: progress.evolutions + 1 } } }));
		return true;
	},
	metamorphoseProducer: producerId => {
		const producer = PRODUCERS_BY_ID[producerId];
		const progress = get().producerProgress[producerId] ?? progressFor(producer?.baseDurability);
		const otherMetamorphoses = Object.entries(get().producerProgress).filter(([id, other]) => id !== producerId && other.metamorphosed).length;
		if (!producer || !get().effects['chaos-unleashed'] || progress.metamorphosed || progress.evolutions < 5) return false;
		const cost = calculateExponentialGrowth(producer.metamorphosis.cost, otherMetamorphoses);
		if (!useResourceStore.getState().spendResource(producer.metamorphosis.cost.resource, cost)) return false;
		set(state => ({ producerProgress: { ...state.producerProgress, [producerId]: { ...progress, metamorphosed: true } } }));
		return true;
	},
	setGildedTargets: (target, ids) => {
		const forgeId = target === 'amplifier' ? 'chaos-crucible-forge' : 'chaos-forge-gilding';
		const forgeLevel = get().levels[forgeId] ?? 0;
		if (!forgeLevel) return;
		const capacity = target === 'amplifier' ? Math.min(3, forgeLevel) : Math.min(6, forgeLevel);
		const allowed = [...new Set(ids)].filter(id => (target === 'amplifier' ? PRODUCTION_BY_ID[id]?.kind === 'amplifier' : PRODUCTION_BY_ID[id]?.kind === 'goal-multiplier')).slice(0, capacity);
		set(target === 'amplifier' ? { gildedAmplifierIds: allowed } : { gildedGoalMultiplierIds: allowed });
	},
	setForgedTargets: (target, ids) => {
		const forgeLevel = get().levels[target === 'deity' ? 'olympian-cyclopes-forge' : 'titan-cyclopes-forge'] ?? 0;
		if (!forgeLevel) return;
		const capacity = Math.min(3, forgeLevel);
		const allowed = [...new Set(ids)].filter(id => PRODUCTION_BY_ID[id]?.kind === target).slice(0, capacity);
		set(target === 'deity' ? { forgedDeityIds: allowed } : { forgedTitanIds: allowed });
	},
	getForgeMultiplier: (itemId, target) => {
		const forgeId =
			target === 'amplifier' ? 'chaos-crucible-forge'
			: target === 'goal' ? 'chaos-forge-gilding'
			: target === 'deity' ? 'olympian-cyclopes-forge'
			: 'titan-cyclopes-forge';
		const selected =
			target === 'amplifier' ? get().gildedAmplifierIds
			: target === 'goal' ? get().gildedGoalMultiplierIds
			: target === 'deity' ? get().forgedDeityIds
			: get().forgedTitanIds;
		const level = get().levels[forgeId] ?? 0;
		if (!selected.includes(itemId) || !level) return 1;
		let baseMultiplier =
			target === 'amplifier' ?
				level < 4 ?
					1.5
				:	Math.floor(1.5 * Math.pow(1.5, level - 3))
			: target === 'goal' ?
				level < 6 ?
					1.5
				:	Math.floor(1.5 + 0.1 * level)
			:	Math.pow(1.5, level);
		if (target === 'titan') {
			const titan = TITANS.find(candidate => candidate.id === itemId);
			const owned = get().levels[itemId] ?? 0;
			if (titan?.maxLevel !== undefined && Number.isFinite(titan.maxLevel) && owned > 0) {
				baseMultiplier = Math.min(baseMultiplier, titan.maxLevel / owned);
			}
		}
		const chaosEnergy = useResourceStore.getState().resources.chaosEnergy;
		const criusMultiplier = (get().levels.crius ?? 0) > 0 ? Math.min(4, 1 + 0.1 * Math.max(0, decimal(chaosEnergy).max(1).log10())) : 1;
		return baseMultiplier * (target === 'amplifier' || target === 'goal' ? criusMultiplier : 1);
	},
	// Destroyed = owned * max(1/2, (0.5 * dragon age)^2 / durability).
	applyDragonMassDestruction: dragonAgeDays => {
		if (!Number.isFinite(dragonAgeDays) || dragonAgeDays < 0) return 0;
		let totalDestroyed = 0;
		set(state => {
			const destruction = producerDestruction(state, Math.pow(dragonAgeDays * 0.5, 2), 0.5);
			totalDestroyed = destruction.totalDestroyed;
			return { levels: destruction.levels, bestProducerLevels: destruction.bestProducerLevels, destroyedProducerLevels: destruction.destroyedProducerLevels };
		});
		return totalDestroyed;
	},
	// Destroyed = owned * max(1/10, Armageddon level^2 / durability).
	applyArmageddonDestruction: armageddonLevel => {
		if (!Number.isFinite(armageddonLevel) || armageddonLevel < 0) return 0;
		let totalDestroyed = 0;
		set(state => {
			const destruction = producerDestruction(state, Math.pow(armageddonLevel, 2), 0.1);
			totalDestroyed = destruction.totalDestroyed;
			return { levels: destruction.levels, bestProducerLevels: destruction.bestProducerLevels, destroyedProducerLevels: destruction.destroyedProducerLevels };
		});
		return totalDestroyed;
	},
	repairProducer: (producerId, quantity = 1) => {
		const repairable = get().destroyedProducerLevels[producerId] ?? 0;
		if (!repairable || PRODUCTION_BY_ID[producerId]?.kind !== 'producer') return false;
		return get().purchase(producerId, Math.min(repairable, Math.max(1, Math.floor(quantity))));
	},
	resetForArmageddon: () =>
		set(state => {
			const levels = Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, PRODUCTION_BY_ID[id]?.persistsOnArmageddon ? level : 0]));
			return { levels, effects: effectsForLevels(levels), producerProgress: state.producerProgress };
		}),
	resetForTranscension: () =>
		set(state => {
			const levels = Object.fromEntries(Object.entries(state.levels).map(([id, level]) => [id, PRODUCTION_BY_ID[id]?.persistsOnTranscension ? level : 0]));
			// Metamorphosis is permanent, but its temporary Growth and Evolution progress resets.
			const producerProgress = Object.fromEntries(
				Object.entries(state.producerProgress)
					.filter(([, progress]) => progress.metamorphosed)
					.map(([id]) => [id, { ...progressFor(PRODUCERS_BY_ID[id]?.baseDurability), metamorphosed: true }]),
			) as Record<string, ProducerProgress>;
			return {
				levels,
				paidCostLevels: {},
				effects: effectsForLevels(levels),
				producerProgress,
				bestProducerLevels: {},
				destroyedProducerLevels: {},
				gildedAmplifierIds: [],
				gildedGoalMultiplierIds: [],
			};
		}),
	reset: () => set(initialState()),
});

/** Combined production hook composed through feature-owned Zustand slices. */
export const useProductionStore = create<ProductionStoreState>()(
	persist(
		(...store) => ({
			...createProductionSlice(...store),
			...createProducerSlice(),
			...createAmplifierSlice(),
			...createGoalMultiplierSlice(),
			...createRespecSlice(),
		}),
		{ name: 'dragonfocus:production', storage: createJSONStorage(() => AsyncStorage) },
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
			return [id, target ? level * useProductionStore.getState().getForgeMultiplier(id, target) : level];
		}),
	);
