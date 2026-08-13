import type { GoalMultiplierArchetype, GoalMultiplierUpgradeLevels, GoalMultiplierXp } from '@/types/goal-multiplier.types';

/** XP needed to advance from a level, rounded down to keep the UI predictable. */
export const goalMultiplierXpRequirement = (_level: number) => 250;

/** Each level compounds the archetype's base multiplier and its upgrade bonus. */
export const goalMultiplierValue = (xp: number, gildEffect = 1) => 1 + (Math.pow(1.005, Math.max(0, xp)) - 1) * Math.max(1, gildEffect);

export const goalMultiplierUpgradeCost = (_upgradeLevel: number) => 10;

/** Balanced XP is always constrained by the least-developed normal archetype. */
export const balancedXp = (xp: GoalMultiplierXp) => Math.min(xp.personal, xp.scholar, xp.athlete, xp.entrepreneur, xp.fellowship);

export const multiplierLevelForXp = (xp: number) => Math.floor(Math.max(0, xp) / 250);

/** Product used as the third multiplier on producer and amplifier output. */
export const activeGoalMultiplierProduct = (xp: GoalMultiplierXp, upgrades: GoalMultiplierUpgradeLevels, activeArchetypes: readonly GoalMultiplierArchetype[]) => activeArchetypes.reduce((product, archetype) => product * (upgrades[archetype] > 0 ? goalMultiplierValue(xp[archetype]) : 1), 1);
