import type { ProductionEffectId, ProductionItemBase, PurchaseCost, UnlockRequirement } from '@/types/production.types';

type MonumentConfig = {
	id: string;
	name: string;
	description: string;
	costs: PurchaseCost[];
	effectId: ProductionEffectId;
	unlocks?: UnlockRequirement[];
	persistsOnTranscension?: boolean;
};

const monument = ({ id, name, description, costs, effectId, unlocks = [], persistsOnTranscension = false }: MonumentConfig): ProductionItemBase => ({
	id,
	name,
	kind: 'armageddon-monument',
	description,
	costs,
	unlocks,
	maxLevel: 1,
	persistsOnArmageddon: true,
	persistsOnTranscension,
	effectId,
});

/** Armageddon monuments grant unlocks; only Signal Chaos remains active after Transcension. */
export const ARMAGEDDON_MONUMENTS: ProductionItemBase[] = [
	monument({
		id: 'signal-chaos',
		name: 'Signal Chaos (The First Primordial)',
		description: 'Unlocks Plasma and Quantum production boosting, plus Quantum Challenges.',
		costs: [{ resource: 'plasma', base: '5', growthFactor: 1 }],
		effectId: 'signal-chaos',
		persistsOnTranscension: true,
	}),
	monument({
		id: 'awaken-gaia',
		name: 'Awaken Gaia',
		description: 'Multiplies Energy by five and opens the path to pantheons.',
		costs: [{ resource: 'plasma', base: '25', growthFactor: 1 }],
		effectId: 'gaia-awakened',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
	monument({
		id: 'awaken-uranus',
		name: 'Awaken Uranus',
		description: 'Doubles Dark Energy and completes the second primordial awakening.',
		costs: [{ resource: 'plasma', base: '125', growthFactor: 1 }],
		effectId: 'uranus-awakened',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
	monument({
		id: 'chaos-crucible',
		name: 'Primordial Crucible',
		description: 'Unlocks Plasma amplifier gilding.',
		costs: [{ resource: 'plasma', base: '100', growthFactor: 1 }],
		effectId: 'chaos-crucible',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
	monument({
		id: 'chaos-forge',
		name: 'Primordial Forge',
		description: 'Unlocks Goal Multiplier XP gilding.',
		costs: [{ resource: 'plasma', base: '100', growthFactor: 1 }],
		effectId: 'chaos-forge',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
	monument({
		id: 'primordial-sanctuary',
		name: 'Primordial Sanctuary',
		description: 'Unlocks Crimson Heart upgrades in Special Energy Upgrades.',
		costs: [{ resource: 'plasma', base: '250', growthFactor: 1 }],
		effectId: 'primordial-sanctuary',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
	monument({
		id: 'primordial-eros',
		name: 'Primordial Eros Monument',
		description: 'Stores 30 minutes per level of double fury reduction. Fuel costs Plasma plus one Quark.',
		costs: [{ resource: 'plasma', base: '1000000', growthFactor: 1 }],
		effectId: 'eros-monument',
		unlocks: [{ metric: 'effect', effectId: 'wrath-apocalypse' }],
	}),
	monument({
		id: 'primordial-ananke',
		name: 'Primordial Ananke Monument',
		description: 'Stores 30 minutes per level of population immortality. Fuel costs Plasma plus one Shard.',
		costs: [{ resource: 'plasma', base: '1000000', growthFactor: 1 }],
		effectId: 'ananke-monument',
		unlocks: [{ metric: 'effect', effectId: 'reincarnation-apocalypse' }],
	}),
	monument({
		id: 'primordial-aether',
		name: 'Primordial Aether Monument',
		description: 'Stores 30 minutes per level of x(2 x 1.5^level) Energy. Fuel costs Plasma plus one Quark.',
		costs: [{ resource: 'plasma', base: '1000000', growthFactor: 1 }],
		effectId: 'aether-monument',
		unlocks: [{ metric: 'effect', effectId: 'freeze-apocalypse' }],
	}),
	monument({
		id: 'primordial-chronos',
		name: 'Primordial Chronos Monument',
		description: 'Stores 30 minutes per level of double age gain. Fuel costs Plasma plus one Quark.',
		costs: [{ resource: 'plasma', base: '1000000', growthFactor: 1 }],
		effectId: 'chronos-monument',
		unlocks: [{ metric: 'effect', effectId: 'roulette-apocalypse' }],
	}),
	monument({
		id: 'primordial-converter',
		name: 'Primordial Converter',
		description: 'Unlocks Dark Plasma, Quark, fury, age, and spell conversions.',
		costs: [{ resource: 'plasma', base: '1000000', growthFactor: 1 }],
		effectId: 'primordial-converter',
		unlocks: [{ metric: 'effect', effectId: 'signal-chaos' }],
	}),
];
