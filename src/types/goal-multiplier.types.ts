import type { GoalArchetype } from './goals.types';

/** The six progression tracks that turn completed-goal XP into multipliers. */
export type GoalMultiplierArchetype = GoalArchetype;

export const GOAL_MULTIPLIER_ARCHETYPES: readonly GoalMultiplierArchetype[] = ['personal', 'scholar', 'athlete', 'entrepreneur', 'fellowship', 'balanced'] as const;

export type GoalMultiplierXp = Record<GoalMultiplierArchetype, number>;
export type GoalMultiplierLevels = Record<GoalMultiplierArchetype, number>;
export type GoalMultiplierUpgradeLevels = Record<GoalMultiplierArchetype, number>;
