import type { ProductionItemBase } from '@/types/production.types';

interface MonumentConfig {
	id: string;
	name: string;
	description: string;
	cost: string;
	effectId: NonNullable<ProductionItemBase['effectId']>;
	milestone: number;
}

const createMonument = (config: MonumentConfig): ProductionItemBase => ({
	id: config.id,
	name: config.name,
	kind: 'transcension-monument',
	description: config.description,
	costs: [{ resource: 'anomaly', base: config.cost, growthFactor: 1 }],
	unlocks: [{ metric: 'milestone', amount: config.milestone }],
	maxLevel: 1,
	persistsOnArmageddon: true,
	persistsOnTranscension: true,
	effectId: config.effectId,
});

export const TRANSCENSION_MONUMENTS: ProductionItemBase[] = [
	createMonument({ id: 'gaia-olympian-pantheon', name: "Gaia's Olympian Pantheon", description: 'Unlocks Olympian Deities after Transcension.', cost: '0', effectId: 'olympian-pantheon', milestone: 6 }),
	createMonument({ id: 'gaia-titan-pantheon', name: "Gaia's Titan Pantheon", description: 'Unlocks Titans and respec powers.', cost: '50', effectId: 'titan-pantheon', milestone: 7 }),
	createMonument({ id: 'awaken-chaos', name: 'Awaken Chaos!', description: 'Unlocks Evolution Serums and Titanomachy.', cost: '250', effectId: 'chaos-awakened', milestone: 21 }),
	createMonument({ id: 'unleash-chaos', name: 'Unleash Chaos!', description: 'Unlocks producer metamorphosis.', cost: '500', effectId: 'chaos-unleashed', milestone: 35 }),
	createMonument({ id: 'nyxs-realm', name: "Nyx's Realm", description: 'Prevents population from resetting on Transcension.', cost: '250000', effectId: 'nyx-realm', milestone: 45 }),
	createMonument({ id: 'cyclopes-forge', name: "The Cyclopes' Forge", description: 'Unlocks advanced Deity and Titan forge targets.', cost: '500000', effectId: 'cyclopes-forge', milestone: 50 }),
	createMonument({ id: 'tartarus', name: 'Tartarus', description: 'Unlocks placing Kronos in Tartarus.', cost: '1000000', effectId: 'tartarus-unlocked', milestone: 50 }),
];
