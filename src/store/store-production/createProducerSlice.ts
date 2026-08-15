import { calculateExponentialGrowth } from '@/data/calculations/formula-production';
import { PRODUCERS, PRODUCERS_BY_ID } from '@/data/production-data';
import type { ProducerDefinition } from '@/types/production.types';
import { decimal } from '@/utils/decimal';
import { scopeNestedSlice } from '../nested-slice';
import { useWorldStore } from '../store-world/_useWorldStore';
import type { ProductionSlice, ProductionStoreState } from './_useProductionStore';

export interface ProducerProgress {
	durability: number;
	quantumGrowths: number;
	evolutions: number;
	metamorphosed: boolean;
}

export interface ProducerStoreState {
	producers: readonly ProducerDefinition[];
	progress: Record<string, ProducerProgress>;
	bestLevels: Record<string, number>;
	destroyedLevels: Record<string, number>;
	buy: (producerId: string, quantity?: number) => boolean;
	sell: (producerId: string, quantity?: number) => boolean;
	grow: (producerId: string) => boolean;
	evolve: (producerId: string) => boolean;
	metamorphose: (producerId: string) => boolean;
	getDisplayName: (producerId: string) => string | undefined;
	recordPurchase: (producerId: string, nextLevel: number, quantity: number) => void;
	recordLevel: (producerId: string, level: number) => void;
	resetGrowthsAndEvolutions: () => void;
	applyDragonMassDestruction: (dragonAgeDays: number) => number;
	applyArmageddonDestruction: (armageddonLevel: number) => number;
	repair: (producerId: string, quantity?: number) => boolean;
	resetForTranscension: () => void;
	reset: () => void;
}

const progressFor = (baseDurability = 1): ProducerProgress => ({ durability: baseDurability * 100, quantumGrowths: 0, evolutions: 0, metamorphosed: false });
const wholeNumber = (value: number) => Math.max(0, Math.floor(value));

/** Growth #1 costs one Plasma and one Quark; later Growths use the producer's growth definitions. */
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

const initialState = () => ({
	producers: PRODUCERS,
	progress: {} as Record<string, ProducerProgress>,
	bestLevels: {} as Record<string, number>,
	destroyedLevels: {} as Record<string, number>,
});

const destroyProducers = (production: ProductionStoreState, damageNumerator: number, minimumFraction: number) => {
	const producerState = production.producerStore;
	let totalDestroyed = 0;
	const destroyedLevels = { ...producerState.destroyedLevels };
	const bestLevels = { ...producerState.bestLevels };
	const levels = { ...production.levels };

	for (const producer of Object.values(PRODUCERS_BY_ID)) {
		const owned = levels[producer.id] ?? 0;
		if (!owned || producerState.progress[producer.id]?.metamorphosed) continue;
		const durability = Math.max(0.000_001, durabilityCapacity(producer.id, levels));
		const destroyedFraction = Math.min(1, Math.max(minimumFraction, damageNumerator / durability));
		const destroyed = Math.min(owned, Math.max(1, Math.ceil(owned * destroyedFraction)));
		bestLevels[producer.id] = Math.max(bestLevels[producer.id] ?? 0, owned);
		levels[producer.id] = owned - destroyed;
		destroyedLevels[producer.id] = (destroyedLevels[producer.id] ?? 0) + destroyed;
		totalDestroyed += destroyed;
	}

	return { levels, bestLevels, destroyedLevels, totalDestroyed };
};

/** Owns producer purchases, evolution, durability, destruction, and repair state. */
export const createProducerSlice: ProductionSlice<'producerStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionStoreState, 'producerStore', ProducerStoreState>('producerStore', set, get);

	const applyDestruction = (damageNumerator: number, minimumFraction: number) => {
		const destruction = destroyProducers(getRoot(), damageNumerator, minimumFraction);
		set(state => ({
			levels: destruction.levels,
			producerStore: { ...state.producerStore, bestLevels: destruction.bestLevels, destroyedLevels: destruction.destroyedLevels },
		}));
		return destruction.totalDestroyed;
	};

	return {
		producerStore: {
			...initialState(),
			buy: (producerId, quantity = 1) => (PRODUCERS_BY_ID[producerId] ? getRoot().purchase(producerId, quantity) : false),
			sell: (producerId, quantity = 1) => (PRODUCERS_BY_ID[producerId] ? getRoot().sell(producerId, quantity) : false),
			grow: producerId => {
				const production = getRoot();
				const producer = PRODUCERS_BY_ID[producerId];
				const progress = getSlice().progress[producerId] ?? progressFor(producer?.baseDurability);
				if (!producer || !production.effects['signal-chaos']) return false;
				const resources = useWorldStore.getState().resourceStore;
				const cost = getQuantumGrowthCost(producer, progress.quantumGrowths);
				if (resources.resources[cost.plasmaResource].lt(cost.plasma) || resources.resources[cost.quarkResource].lt(cost.quarks)) return false;
				resources.spendResource(cost.plasmaResource, cost.plasma);
				resources.spendResource(cost.quarkResource, cost.quarks);
				setSlice(state => ({ progress: { ...state.progress, [producerId]: { ...progress, quantumGrowths: progress.quantumGrowths + 1 } } }));
				return true;
			},
			evolve: producerId => {
				const production = getRoot();
				const producer = PRODUCERS_BY_ID[producerId];
				const progress = getSlice().progress[producerId] ?? progressFor(producer?.baseDurability);
				if (!producer || !production.effects['chaos-awakened'] || progress.quantumGrowths < (progress.evolutions + 1) * producer.evolution.requiredGrowths) return false;
				const serum = getEvolutionSerumCost(producer, progress.evolutions + 1);
				const resources = useWorldStore.getState().resourceStore;
				if (resources.resources.darkPlasma.lt(serum.darkPlasma) || resources.resources.quarks.lt(serum.quarks)) return false;
				resources.spendResource('darkPlasma', serum.darkPlasma);
				resources.spendResource('quarks', serum.quarks);
				setSlice(state => ({ progress: { ...state.progress, [producerId]: { ...progress, evolutions: progress.evolutions + 1 } } }));
				return true;
			},
			metamorphose: producerId => {
				const production = getRoot();
				const producer = PRODUCERS_BY_ID[producerId];
				const progress = getSlice().progress[producerId] ?? progressFor(producer?.baseDurability);
				const otherMetamorphoses = Object.entries(getSlice().progress).filter(([id, other]) => id !== producerId && other.metamorphosed).length;
				if (!producer || !production.effects['chaos-unleashed'] || progress.metamorphosed || progress.evolutions < 5) return false;
				const cost = calculateExponentialGrowth(producer.metamorphosis.cost, otherMetamorphoses);
				if (!useWorldStore.getState().resourceStore.spendResource(producer.metamorphosis.cost.resource, cost)) return false;
				setSlice(state => ({ progress: { ...state.progress, [producerId]: { ...progress, metamorphosed: true } } }));
				return true;
			},
			getDisplayName: producerId => {
				const producer = PRODUCERS_BY_ID[producerId];
				if (!producer) return undefined;
				return getProducerDisplayName(producer, getSlice().progress[producerId] ?? progressFor(producer.baseDurability));
			},
			recordPurchase: (producerId, nextLevel, quantity) => {
				const producer = PRODUCERS_BY_ID[producerId];
				if (!producer) return;
				setSlice(state => ({
					bestLevels: { ...state.bestLevels, [producerId]: Math.max(state.bestLevels[producerId] ?? 0, nextLevel) },
					destroyedLevels: { ...state.destroyedLevels, [producerId]: Math.max(0, (state.destroyedLevels[producerId] ?? 0) - quantity) },
					progress: { ...state.progress, [producerId]: state.progress[producerId] ?? { ...progressFor(producer.baseDurability), durability: durabilityCapacity(producerId, getRoot().levels) } },
				}));
			},
			recordLevel: (producerId, level) => setSlice(state => ({ bestLevels: { ...state.bestLevels, [producerId]: Math.max(state.bestLevels[producerId] ?? 0, level) } })),
			resetGrowthsAndEvolutions: () => setSlice(state => ({ progress: Object.fromEntries(Object.entries(state.progress).map(([id, progress]) => [id, { ...progress, quantumGrowths: 0, evolutions: 0 }])) as Record<string, ProducerProgress> })),
			applyDragonMassDestruction: dragonAgeDays => (!Number.isFinite(dragonAgeDays) || dragonAgeDays < 0 ? 0 : applyDestruction(Math.pow(dragonAgeDays * 0.5, 2), 0.5)),
			applyArmageddonDestruction: armageddonLevel => (!Number.isFinite(armageddonLevel) || armageddonLevel < 0 ? 0 : applyDestruction(Math.pow(armageddonLevel, 2), 0.1)),
			repair: (producerId, quantity = 1) => {
				const repairable = getSlice().destroyedLevels[producerId] ?? 0;
				if (!repairable || !PRODUCERS_BY_ID[producerId]) return false;
				return getRoot().purchase(producerId, Math.min(repairable, Math.max(1, Math.floor(quantity))));
			},
			resetForTranscension: () =>
				setSlice(state => ({
					progress: Object.fromEntries(
						Object.entries(state.progress)
							.filter(([, progress]) => progress.metamorphosed)
							.map(([id]) => [id, { ...progressFor(PRODUCERS_BY_ID[id]?.baseDurability), metamorphosed: true }]),
					) as Record<string, ProducerProgress>,
					bestLevels: {},
					destroyedLevels: {},
				})),
			reset: () => setSlice(initialState()),
		},
	};
};
