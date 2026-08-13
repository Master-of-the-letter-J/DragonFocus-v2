import type { ProductionItemBase } from '@/types/production.types';

const BASE_RESPEC: Omit<ProductionItemBase, 'id' | 'name' | 'description' | 'effectId' | 'costs'> = {
	kind: 'respec',
	unlocks: [{ metric: 'effect', effectId: 'titan-pantheon' }],
	maxLevel: 1,
	persistsOnArmageddon: true,
	persistsOnTranscension: true,
};

export const RESPEC_POWERS: ProductionItemBase[] = [
	{ ...BASE_RESPEC, id: 'respec-dark-energy', name: 'Respec Dark Energy', description: 'Respecs Dark Energy upgrades and producers. Refunds Dark Energy and Plasma in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'dark-energy-respec' },
	{ ...BASE_RESPEC, id: 'respec-producers', name: 'Respec Producers', description: 'Respecs producers and producer upgrades. Refunds Energy and Dark Energy in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'producer-respec' },
	{ ...BASE_RESPEC, id: 'respec-amplifiers', name: 'Respec Amplifiers', description: 'Respecs amplifiers and amplifier gilds. Refunds Energy and Plasma in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'amplifier-respec' },
	{ ...BASE_RESPEC, id: 'respec-goal-multipliers', name: 'Respec Goal Multipliers', description: 'Respecs Goal Multiplier upgrades. Refunds Dark Energy and Plasma in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'goal-multiplier-respec' },
	{ ...BASE_RESPEC, id: 'respec-boost-upgrades', name: 'Respec Boost Upgrades', description: 'Respecs Pomodoro and boost upgrades. Refunds Dark Energy and Plasma in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'boost-respec' },
	{ ...BASE_RESPEC, id: 'respec-primordial-monuments', name: 'Respec Primordial Monument Upgrades', description: 'Respecs Primordial Monument upgrades and clears their fuel bars. Refunds Plasma in full; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'primordial-monument-respec' },
	{ ...BASE_RESPEC, id: 'respec-pantheons', name: 'Respec Pantheons', description: 'Respecs all Deities and Titans for Anomalies. This power is free to unlock and costs 5 Quarks per use.', costs: [], effectId: 'pantheon-respec' },
	{ ...BASE_RESPEC, id: 'respec-chaos-growths', name: 'Respec Chaos Growths', description: 'Respecs Quantum Growths and Evolutions while keeping Metamorphosis. Refunds every spent Plasma, Dark Plasma, and Quark; each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'chaos-respec' },
	{ ...BASE_RESPEC, id: 'respec-cyclopes-forge', name: 'Respec Cyclopes Forge', description: 'Respecs Cyclopes Forges for Anomalies. Each use costs 5 Quarks.', costs: [{ resource: 'anomaly', base: '5', growthFactor: 1 }], effectId: 'forge-respec' },
];
