import type { PantheonDefinition } from '@/types/production.types';

const titan = (id: string, name: string, description: string, effect: string, baseEffect: number, titanEquivalents = 1, maxLevel = 1, cost = '125', growth = 1): PantheonDefinition => ({
	id,
	name,
	kind: 'titan',
	description,
	effect,
	baseEffect,
	costs: [{ resource: 'anomaly', base: cost, growthFactor: growth }],
	unlocks: [{ metric: 'effect', effectId: 'titan-pantheon' }, ...(id === 'kronos' ? [] : [{ metric: 'titan-equivalents' as const, amount: titanEquivalents }])],
	maxLevel,
	persistsOnArmageddon: true,
	persistsOnTranscension: true,
});

export const TITANS: PantheonDefinition[] = [
	titan('kronos', 'Kronos', 'Debuffs Zeus to 2.5× and produces Chaos Energy.', 'chaos-production', 1, 0, Number.POSITIVE_INFINITY, '250', 2),
	titan('oceanus', 'Oceanus', 'Adds 0.1% Dark Energy per square root of Chaos Energy.', 'chaos-dark-energy', 0.001, 2),
	titan('hyperion', 'Hyperion', 'Adds 0.1% Plasma per square root of Chaos Energy.', 'chaos-plasma', 0.001, 2),
	titan('iapetus', 'Iapetus', 'Multiplies every Armageddon level by a bounded Chaos logarithm.', 'armageddon-level', 0.05, 1),
	titan('coeus', 'Coeus', 'Multiplies Plasma Quantum boosts by a bounded Chaos logarithm.', 'quantum-plasma', 0.1, 1),
	titan('crius', 'Crius', 'Multiplies amplifier and goal gilds by a bounded Chaos logarithm.', 'gilds', 0.1, 1),
	titan('atlas', 'Atlas', 'Multiplies Chaos production by Titanomachy up to three times.', 'titanomachy-chaos', 1, 1, 3),
	titan('prometheus', 'Prometheus', 'Permanently improves Zeus through a bounded Chaos logarithm.', 'zeus-chaos', 0.2, 2),
	titan('rhea', 'Rhea', 'Adds 1% Population growth per Chaos Energy.', 'chaos-population', 0.01, 2),
	titan('themis', 'Themis', 'Lets gilded Goal Multipliers affect Chaos production.', 'goal-chaos', 1, 3),
	titan('mnemosyne', 'Mnemosyne', 'Unlocks Chaos and Chaos Gambit boost tiers.', 'chaos-boost-unlock', 1, 1, 2),
	titan('phoebe', 'Phoebe', 'Adds 1% Chaos production per Crimson Shard.', 'shard-chaos', 0.01, 1),
	titan('tethys', 'Tethys', 'Quadruples flat Chaos production while a streak is active.', 'streak-chaos', 4, 1),
	titan('theia', 'Theia', 'Raises fury threshold through Chaos logarithm.', 'chaos-fury-threshold', 20, 1, 2),
];
