import type { ForgeDefinition } from '@/types/production.types';

export const FORGES: ForgeDefinition[] = [
	{
		id: 'chaos-crucible-forge',
		name: "Chaos's Crucible",
		kind: 'forge',
		description: 'Gilds one amplifier at level one, three at level three, and scales all selected gilds after level four.',
		costs: [{ resource: 'plasma', base: '3', growthFactor: 3 }],
		unlocks: [{ metric: 'effect', effectId: 'chaos-crucible' }],
		persistsOnArmageddon: true,
		persistsOnTranscension: false,
		forgeTarget: 'amplifier',
	},
	{ id: 'chaos-forge-gilding', name: "Chaos's Forge", kind: 'forge', description: 'Gilds goal multipliers and increases their XP effect.', costs: [{ resource: 'plasma', base: '4', growthFactor: 4 }], unlocks: [{ metric: 'effect', effectId: 'chaos-forge' }], persistsOnArmageddon: true, persistsOnTranscension: false, forgeTarget: 'goal' },
	{
		id: 'olympian-cyclopes-forge',
		name: 'Olympian Cyclopes Forge',
		kind: 'forge',
		description: 'Forges selected Deities: one at unlock, three at level three, then scales their effect.',
		costs: [{ resource: 'anomaly', base: '125000', growthFactor: 4 }],
		unlocks: [{ metric: 'effect', effectId: 'cyclopes-forge' }],
		persistsOnArmageddon: true,
		persistsOnTranscension: true,
		forgeTarget: 'deity',
	},
	{
		id: 'titan-cyclopes-forge',
		name: 'Titan Cyclopes Forge',
		kind: 'forge',
		description: 'Forges selected Titans: one at unlock, three at level three, then scales their effect.',
		costs: [{ resource: 'anomaly', base: '250000', growthFactor: 4 }],
		unlocks: [{ metric: 'effect', effectId: 'cyclopes-forge' }],
		persistsOnArmageddon: true,
		persistsOnTranscension: true,
		forgeTarget: 'titan',
	},
];
