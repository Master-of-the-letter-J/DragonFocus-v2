import type { PantheonDefinition } from '@/types/production.types';

const deity = (id: string, name: string, description: string, effect: string, baseEffect: number, cost: string, growth: number): PantheonDefinition => ({
	id,
	name,
	kind: 'deity',
	description,
	effect,
	baseEffect,
	costs: [{ resource: 'anomaly', base: cost, growthFactor: growth }],
	unlocks: [{ metric: 'effect', effectId: 'olympian-pantheon' }],
	persistsOnArmageddon: true,
	persistsOnTranscension: true,
});

export const DEITIES: PantheonDefinition[] = [
	deity('zeus', 'Zeus', 'Allows additional Deities and multiplies all Energy production.', 'energy-production', 10, '10', 1.4),
	deity('poseidon', 'Poseidon', 'Multiplies Dark Energy earned.', 'dark-energy-earned', 2, '5', 1.3),
	deity('hades', 'Hades', 'Multiplies Plasma earned.', 'plasma-earned', 2, '5', 1.3),
	deity('hera', 'Hera', 'Multiplies the Population growth multiplier by ten per level.', 'population-growth', 10, '3', 1.2),
	deity('demeter', 'Demeter', 'Improves Population Efficiency and reduces the natural human decline factor by 25%.', 'population-energy', 1, '5', 1.3),
	deity('athena', 'Athena', 'Multiplies Crimson Shard energy effect.', 'shard-efficiency', 1.5, '5', 1.1),
	deity('apollo', 'Apollo', 'Multiplies non-fury Pomodoro boost effects.', 'pomodoro-boost', 2, '2', 1.5),
	deity('artemis', 'Artemis', 'Multiplies goal XP effects without altering fury loss.', 'goal-xp', 2, '2', 1.5),
	deity('aphrodite', 'Aphrodite', 'Raises fury threshold and goal fury reduction.', 'fury-control', 25, '1', 1.75),
	deity('hermes', 'Hermes', 'Unlocks and improves production cost discounts.', 'discount', 0.1, '3', 1.2),
	deity('dionysus', 'Dionysus', 'Multiplies all Deity effects while any streak is active.', 'deity-streak', 1.1, '4', 1.5),
	deity('hestia', 'Hestia', 'Extends the frozen-streak repair window by 12 hours per level.', 'streak-window', 12, '5', 2),
	deity('hecate', 'Hecate', 'Doubles Spell Luck per level, improves Snackbox odds, unlocks Divine spell rarities, and multiplies created spell effects by twice her level.', 'spell-luck', 2, '1', 1.75),
];
