export type GoalType = 'habit' | 'task' | 'special-habit';
export type GoalArchetype = 'personal' | 'scholar' | 'athlete' | 'entrepreneur' | 'fellowship' | 'balanced';
export type GoalCategory = 'personal' | 'mental' | 'physical' | 'career' | 'relationships' | 'contribution' | 'financial' | 'other' | (string & {});
export type GoalImportance = 'important-plus' | 'important' | 'not-important';
export type GoalDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'hard-plus';
export type GoalStatus = 'incomplete' | 'completed' | 'archived';
export type StreakState = 'active' | 'dormant' | 'frozen' | 'cracked' | 'broken';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type SpecialHabitKind = 'survey-check-in' | 'survey-check-out' | 'pomodoro-30-seconds' | 'pomodoro-15-minutes' | 'pomodoro-30-minutes' | 'pomodoro-45-minutes' | 'pomodoro-60-minutes';

export interface SubGoal {
	id: string;
	title: string;
	difficulty?: GoalDifficulty;
	completedAt?: string;
}

export interface GoalBase {
	id: string;
	title: string;
	description?: string;
	type: GoalType;
	category: GoalCategory;
	archetype: GoalArchetype;
	difficulty: GoalDifficulty;
	importance: GoalImportance;
	pinned: boolean;
	pomodoroPinned: boolean;
	estimatedPomodoros: number;
	challenge: 'none' | 'crimson' | 'quantum' | 'both';
	subgoals: SubGoal[];
	status: GoalStatus;
	createdAt: string;
	completedAt?: string;
	archivedAt?: string;
	dueAt?: string;
	rewardBlocked: boolean;
}

export interface TaskGoal extends GoalBase {
	type: 'task';
	estimatedMinutes: number;
}

export interface HabitGoal extends GoalBase {
	type: 'habit';
	repeat: 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'custom';
	daysOfWeek: Weekday[];
	streak: number;
	streakState: StreakState;
	streakDueAt: string;
	frozenAt?: string;
}

/** A permanent daily habit driven by a survey or a completed Pomodoro session. */
export interface SpecialHabitGoal extends Omit<HabitGoal, 'type'> {
	type: 'special-habit';
	specialKind: SpecialHabitKind;
	repairPending: boolean;
}

export type Goal = HabitGoal | TaskGoal | SpecialHabitGoal;

export interface GoalReward {
	xp: string;
	darkEnergy: string;
	shards: string;
	furyReduction: string;
	quarks: string;
}

export interface GoalInput {
	title: string;
	type: GoalType;
	category?: GoalCategory;
	archetype?: GoalArchetype;
	difficulty?: GoalDifficulty;
	importance?: GoalImportance;
	description?: string;
	dueAt?: string;
	estimatedMinutes?: number;
	repeat?: HabitGoal['repeat'];
	daysOfWeek?: Weekday[];
	estimatedPomodoros?: number;
	specialKind?: SpecialHabitKind;
}
