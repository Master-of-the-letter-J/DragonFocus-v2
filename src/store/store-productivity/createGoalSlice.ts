import type { Goal, GoalArchetype, GoalInput, GoalReward, HabitGoal, SpecialHabitGoal, SpecialHabitKind, TaskGoal } from '@/types/goals.types';
import type { GameMode } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import { getDeityLevels, useProductionStore } from '../store-production/_useProductionStore';
import { useProductionSpecialStore } from '../store-production-special/_useProductionSpecialStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useStatsStore } from '../useStatsStore';
import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductivitySlice, ProductivityStoreState } from './_useProductivityStore';
import { calculateSpellMultiplier, calculateTitanomachyMultiplier } from '@/data/calculations/formula-resources';
import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { usePrestigeStore } from '../store-prestige/_usePrestigeStore';

const dayEnd = (from = new Date()) => {
	const date = new Date(from);
	date.setHours(23, 59, 59, 999);
	return date.toISOString();
};

const nextMidnight = () => {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	date.setHours(0, 0, 0, 0);
	return date.toISOString();
};

const nextDayEnd = (from = new Date()) => {
	const date = new Date(from);
	date.setDate(date.getDate() + 1);
	return dayEnd(date);
};

const goalId = () => `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const allGoals = (state: Pick<GoalStoreState, 'incompleteHabits' | 'incompleteTasks' | 'specialHabits' | 'completed' | 'archived'>) => [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits, ...state.completed, ...state.archived];
const today = () => new Date().toISOString().slice(0, 10);

const difficultyXp = { trivial: 1, easy: 2, medium: 3, hard: 4, 'hard-plus': 5 } as const;
const harvestMultiplier: Record<GameMode, number> = { invincible: 0.5, 'lock-in': 4, easy: 1, medium: 2, hard: 4, 'hard-plus': 6 };
const FREE_SHARD_HARVEST_CAP = 50;
const PREMIUM_SHARD_HARVEST_CAP = FREE_SHARD_HARVEST_CAP * DRAGON_PACT_BENEFITS.goalShardCapMultiplier;
const isLate = (goal: Goal, at = goal.completedAt) => Boolean(goal.dueAt && at && Date.parse(at) > Date.parse(goal.dueAt));
const hasHarvestChallenge = (goal: Goal) => goal.challenge === 'harvest' || goal.challenge === 'both';
const hasQuantumChallenge = (goal: Goal) => goal.challenge === 'quantum' || goal.challenge === 'both';
const challengeFailureFury = (goal: Goal) => (hasHarvestChallenge(goal) ? 5 : 0) + (hasQuantumChallenge(goal) ? 10 : 0);

const specialHabitDetails: Record<SpecialHabitKind, { title: string; description: string; minimumPomodoroSeconds?: number }> = {
	'survey-check-in': { title: 'Complete Check-In Survey', description: 'Complete today’s check-in survey.' },
	'survey-check-out': { title: 'Complete Check-Out Survey', description: 'Complete today’s check-out survey.' },
	'pomodoro-30-seconds': { title: 'Complete a Pomodoro Session', description: 'Complete a focused Pomodoro session of any duration.', minimumPomodoroSeconds: 1 },
	'pomodoro-15-minutes': { title: 'Focus for 15 Minutes', description: 'Complete a focused Pomodoro session lasting at least 15 minutes.', minimumPomodoroSeconds: 15 * 60 },
	'pomodoro-30-minutes': { title: 'Focus for 30 Minutes', description: 'Complete a focused Pomodoro session lasting at least 30 minutes.', minimumPomodoroSeconds: 30 * 60 },
	'pomodoro-45-minutes': { title: 'Focus for 45 Minutes', description: 'Complete a focused Pomodoro session lasting at least 45 minutes.', minimumPomodoroSeconds: 45 * 60 },
	'pomodoro-60-minutes': { title: 'Focus for 60 Minutes', description: 'Complete a focused Pomodoro session lasting at least 60 minutes.', minimumPomodoroSeconds: 60 * 60 },
};

const createSpecialHabits = (): SpecialHabitGoal[] =>
	(Object.keys(specialHabitDetails) as SpecialHabitKind[]).map(specialKind => {
		const details = specialHabitDetails[specialKind];
		return {
			id: `special-${specialKind}`,
			title: details.title,
			description: details.description,
			type: 'special-habit',
			specialKind,
			category: 'other',
			archetype: 'balanced',
			difficulty: 'trivial',
			importance: 'not-important',
			pinned: false,
			pomodoroPinned: false,
			estimatedPomodoros: 1,
			challenge: 'none',
			subgoals: [],
			status: 'incomplete',
			createdAt: new Date().toISOString(),
			dueAt: dayEnd(),
			rewardBlocked: false,
			repeat: 'daily',
			daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
			streak: 0,
			streakState: 'dormant',
			streakDueAt: dayEnd(),
			repairPending: false,
		};
	});

const isSpecialHabitReady = (goal: SpecialHabitGoal, productivity: ProductivityStoreState) => {
	if (goal.specialKind === 'survey-check-in') return productivity.surveys.checkInCompleted;
	if (goal.specialKind === 'survey-check-out') return productivity.surveys.checkOutCompleted;
	const minimumSeconds = specialHabitDetails[goal.specialKind].minimumPomodoroSeconds ?? Number.POSITIVE_INFINITY;
	return productivity.pomodoro.lastCompletedSessionSeconds >= minimumSeconds;
};
interface HarvestPremiumMultipliers {
	xp: number;
	darkEnergy: number;
	furyReduction: number;
}

const STANDARD_HARVEST_MULTIPLIERS: HarvestPremiumMultipliers = { xp: 1, darkEnergy: 1, furyReduction: 1 };

const calculateGoalReward = (
	goal: Goal,
	mode: GameMode,
	artemisLevel = 0,
	aphroditeLevel = 0,
	goalMultiplier = decimal(1),
	darkEnergyEffectMultiplier = 1,
	titanomachyHarvestMultiplier = 1,
	premiumMultipliers: HarvestPremiumMultipliers = STANDARD_HARVEST_MULTIPLIERS,
): GoalReward => {
	if (goal.rewardBlocked) return { xp: '0', darkEnergy: '0', shards: '0', furyReduction: '0', quarks: '0' };

	const difficulty = difficultyXp[goal.difficulty];
	const streak = goal.type === 'task' ? 0 : goal.streak;
	if (goal.type === 'special-habit') {
		const completedStreak = goal.streak;
		const isCheckIn = goal.specialKind === 'survey-check-in';
		const isCheckOut = goal.specialKind === 'survey-check-out';
		const baseDarkEnergy = isCheckIn || isCheckOut ? 10 + 2 * completedStreak : 5 + completedStreak;
		const baseShards = isCheckIn || isCheckOut ? 1 + 2 * completedStreak : 1 + completedStreak;
		return {
			xp: '0',
			darkEnergy: decimal(baseDarkEnergy).times(harvestMultiplier[mode]).times(titanomachyHarvestMultiplier).times(goalMultiplier).times(darkEnergyEffectMultiplier).times(premiumMultipliers.darkEnergy).toString(),
			shards: decimal(baseShards).toString(),
			furyReduction: '0',
			quarks: '0',
		};
	}
	const late = isLate(goal);
	const daysToComplete = goal.type === 'task' ? Math.max(0, Math.floor((Date.parse(goal.completedAt ?? goal.createdAt) - Date.parse(goal.createdAt)) / 86_400_000)) : 0;
	const baseXp =
		late ? 2 + goal.subgoals.length
		: goal.type === 'habit' ? 5 + difficulty + streak + goal.subgoals.length
		: 5 + difficulty + daysToComplete + goal.subgoals.length;
	const harvestChallenge = hasHarvestChallenge(goal) && !late;
	const quantumChallenge = hasQuantumChallenge(goal) && !late;
	const challengeMultiplier = (harvestChallenge ? 2 : 1) * (quantumChallenge ? 2 : 1);
	const artemisMultiplier = artemisLevel > 0 ? decimal(2).times(decimal(1.5).pow(artemisLevel - 1)) : decimal(1);
	const totalXp = decimal(baseXp)
		.times(challengeMultiplier)
		.times(artemisMultiplier)
		.times(harvestMultiplier[mode])
		.times(titanomachyHarvestMultiplier)
		.times(premiumMultipliers.xp);
	const darkEnergy = totalXp.times(goalMultiplier).times(darkEnergyEffectMultiplier).times(premiumMultipliers.darkEnergy);
	const baseShards = late ? 0 : goal.type === 'habit' ? streak : daysToComplete;
	const bonusShards = harvestChallenge ? 6 : 0;

	return {
		xp: totalXp.toString(),
		darkEnergy: darkEnergy.toString(),
		shards: decimal(baseShards + bonusShards).toString(),
		furyReduction: decimal(baseXp)
			.times(1 + aphroditeLevel * 0.1)
			.times(premiumMultipliers.furyReduction)
			.toString(),
		quarks: quantumChallenge ? '12' : '0',
	};
};

export interface SpecialRewardNotification {
	id: string;
	title: string;
	streak: number;
	reward: GoalReward;
}

export interface GoalStoreState {
	incompleteHabits: HabitGoal[];
	incompleteTasks: TaskGoal[];
	specialHabits: SpecialHabitGoal[];
	completed: Goal[];
	archived: Goal[];
	pendingHarvestIds: string[];
	autoHarvestEnabled: boolean;
	shardsHarvestedToday: number;
	shardHarvestDate: string;
	recentCompletionTimes: number[];
	emergencyCompletionsToday: number;
	emergencyDate: string;
	maxHabits: number;
	maxTasks: number;
	lastMidnightDate?: string;
	lastWarning?: string;
	specialRewardNotifications: SpecialRewardNotification[];
	addGoal: (input: GoalInput) => Goal | undefined;
	removeGoal: (id: string) => void;
	updateGoal: (id: string, changes: Partial<Goal>) => void;
	setGoalChallenge: (id: string, challenge: Goal['challenge']) => boolean;
	completeGoal: (id: string, now?: Date, automaticSpecial?: boolean) => boolean;
	completeSpecialHabit: (kind: SpecialHabitKind, now?: Date) => boolean;
	dismissSpecialRewardNotification: () => void;
	restoreGoal: (id: string) => boolean;
	harvestGoal: (id: string, mode: GameMode) => GoalReward | undefined;
	harvestAllPending: (mode: GameMode) => GoalReward[];
	setAutoHarvest: (enabled: boolean) => void;
	getGoal: (id: string) => Goal | undefined;
	getPomodoroGoals: () => Goal[];
	processMidnight: (now?: Date) => void;
	repairHabitStreak: (id: string) => boolean;
	resetHabitStreak: (id: string) => boolean;
	reset: () => void;
}

const initialState = () => ({
	incompleteHabits: [] as HabitGoal[],
	incompleteTasks: [] as TaskGoal[],
	specialHabits: createSpecialHabits(),
	completed: [] as Goal[],
	archived: [] as Goal[],
	pendingHarvestIds: [] as string[],
	autoHarvestEnabled: false,
	shardsHarvestedToday: 0,
	shardHarvestDate: today(),
	recentCompletionTimes: [] as number[],
	emergencyCompletionsToday: 0,
	emergencyDate: today(),
	maxHabits: 15,
	maxTasks: 20,
	lastMidnightDate: undefined as string | undefined,
	specialRewardNotifications: [] as SpecialRewardNotification[],
});

const withoutGoal = (goals: Goal[], id: string) => goals.filter(goal => goal.id !== id);

/** Gives every category a predictable Goal Multiplier track while keeping archetypes editable. */
const defaultArchetypeForCategory = (category: string | undefined): GoalArchetype => {
	const normalized = (category ?? 'custom').trim().toLowerCase().replaceAll(' ', '-');
	if (['intellectual', 'educational', 'education', 'scholar'].includes(normalized)) return 'scholar';
	if (['health', 'fitness', 'diet', 'physical', 'athlete'].includes(normalized)) return 'athlete';
	if (['family', 'relationships', 'community', 'spiritual', 'contribution', 'fellowship'].includes(normalized)) return 'fellowship';
	if (['financial', 'career', 'entrepreneur'].includes(normalized)) return 'entrepreneur';
	return 'personal';
};

export const createGoalSlice: ProductivitySlice<'goals'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductivityStoreState, 'goals', GoalStoreState>('goals', set, get);

	return {
		goals: {
			...initialState(),
			addGoal: input => {
				if (input.type === 'special-habit') {
					setSlice({ lastWarning: 'Special habits are permanent and are created automatically.' });
					return undefined;
				}
				const state = getSlice();
				const incompleteOfType = input.type === 'habit' ? state.incompleteHabits.length : state.incompleteTasks.length;
				const createdTodayOfType = [...state.completed, ...state.archived].filter(goal => goal.type === input.type && goal.createdAt.slice(0, 10) === today()).length;
				const activeOfType = incompleteOfType + createdTodayOfType;
				const limit =
					usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.goalLimit
					: input.type === 'habit' ? state.maxHabits
					: state.maxTasks;

				if (activeOfType >= limit) {
					setSlice({ lastWarning: `You can keep up to ${limit} incomplete ${input.type}s. Harvest or remove one first.` });
					return undefined;
				}
				const common = {
					id: goalId(),
					title: input.title.trim(),
					description: input.description?.trim(),
					type: input.type,
					category: input.category ?? 'other',
					archetype: input.archetype ?? defaultArchetypeForCategory(input.category),
					difficulty: input.difficulty ?? 'easy',
					importance: input.importance ?? 'not-important',
					pinned: false,
					pomodoroPinned: false,
					estimatedPomodoros: Math.max(1, input.estimatedPomodoros ?? 1),
					challenge: 'none' as const,
					subgoals: [],
					status: 'incomplete' as const,
					createdAt: new Date().toISOString(),
					dueAt: input.dueAt,
					rewardBlocked: false,
				};
				if (!common.title) {
					setSlice({ lastWarning: 'A goal needs a title.' });
					return undefined;
				}
				const goal: Goal =
					input.type === 'habit' ?
						{ ...common, type: 'habit', repeat: input.repeat ?? 'daily', daysOfWeek: input.daysOfWeek ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], streak: 0, streakState: 'dormant', streakDueAt: dayEnd() }
					:	{ ...common, type: 'task', estimatedMinutes: Math.max(1, input.estimatedMinutes ?? 15) };
				setSlice(current => (input.type === 'habit' ? { incompleteHabits: [...current.incompleteHabits, goal as HabitGoal], lastWarning: undefined } : { incompleteTasks: [...current.incompleteTasks, goal as TaskGoal], lastWarning: undefined }));
				return goal;
			},
			removeGoal: id =>
				setSlice(state => ({
					incompleteHabits: withoutGoal(state.incompleteHabits, id) as HabitGoal[],
					incompleteTasks: withoutGoal(state.incompleteTasks, id) as TaskGoal[],
					completed: withoutGoal(state.completed, id),
					archived: withoutGoal(state.archived, id),
					pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
				})),
			updateGoal: (id, changes) =>
				setSlice(state => {
					const { challenge: ignoredChallenge, ...safeChanges } = changes;
					void ignoredChallenge;
					const patch = (goal: Goal) => (goal.id === id ? ({ ...goal, ...safeChanges } as Goal) : goal);
					return {
						incompleteHabits: state.incompleteHabits.map(patch) as HabitGoal[],
						incompleteTasks: state.incompleteTasks.map(patch) as TaskGoal[],
						specialHabits: state.specialHabits.map(patch) as SpecialHabitGoal[],
						completed: state.completed.map(patch),
						archived: state.archived.map(patch),
					};
				}),
			setGoalChallenge: (id, challenge) => {
				const state = getSlice();
				const target = [...state.incompleteHabits, ...state.incompleteTasks].find(goal => goal.id === id);
				if (!target) return false;
				if (target.challenge === challenge) return true;
				const wantsHarvest = challenge === 'harvest' || challenge === 'both';
				const wantsQuantum = challenge === 'quantum' || challenge === 'both';
				if (wantsHarvest && difficultyXp[target.difficulty] < difficultyXp.easy) {
					setSlice({ lastWarning: 'Harvest Challenge requires Easy difficulty or higher.' });
					return false;
				}
				if (wantsQuantum && difficultyXp[target.difficulty] < difficultyXp.medium) {
					setSlice({ lastWarning: 'Quantum Challenge requires Medium difficulty or higher.' });
					return false;
				}
				if (wantsQuantum && useProductionStore.getState().unlockState.milestone < 6) {
					setSlice({ lastWarning: 'Quantum Challenge unlocks at Milestone 6.' });
					return false;
				}
				const challengeLimit = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.challengeGoalLimit : 5;
				const activeChallengeGoals = [...state.incompleteHabits, ...state.incompleteTasks].filter(goal => goal.id !== id && goal.challenge !== 'none').length;
				if (challenge !== 'none' && activeChallengeGoals >= challengeLimit) {
					setSlice({ lastWarning: `You already have the maximum of ${challengeLimit} active challenge goals.` });
					return false;
				}

				const currentHarvest = target.challenge === 'harvest' || target.challenge === 'both';
				const currentQuantum = target.challenge === 'quantum' || target.challenge === 'both';
				const shardCost = (wantsHarvest && !currentHarvest ? 3 : 0) + (wantsQuantum && !currentQuantum ? 6 : 0);
				if (shardCost && !useWorldStore.getState().resourceStore.spendResource('shards', shardCost)) {
					setSlice({ lastWarning: `You need ${shardCost} Crimson Shards to enable this challenge.` });
					return false;
				}

				const update = (goal: Goal) => (goal.id === id ? ({ ...goal, challenge, challengeFailed: false } as Goal) : goal);
				setSlice(current => ({
					incompleteHabits: current.incompleteHabits.map(update) as HabitGoal[],
					incompleteTasks: current.incompleteTasks.map(update) as TaskGoal[],
					lastWarning: undefined,
				}));
				return true;
			},
			completeGoal: (id, now = new Date(), automaticSpecial = false) => {
				const state = getSlice();
				const goal = [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits.filter(candidate => candidate.status === 'incomplete')].find(candidate => candidate.id === id);
				if (!goal) return false;
				if (goal.type === 'special-habit') {
					if (!automaticSpecial) {
						setSlice({ lastWarning: 'This special goal is checked off automatically by its linked survey or Pomodoro session.' });
						return false;
					}
					if (!isSpecialHabitReady(goal, getRoot())) {
						setSlice({ lastWarning: 'Complete the linked survey or Pomodoro session before marking this special habit complete.' });
						return false;
					}
				}
				const time = now.getTime();

				const recent = state.recentCompletionTimes.filter(timestamp => time - timestamp < 30_000);
				if (recent.length >= 20) {
					setSlice({ recentCompletionTimes: recent, lastWarning: 'Spam detection is active. Please wait before completing more goals.' });
					return false;
				}

				const day = now.toISOString().slice(0, 10);
				const emergencyCount = state.emergencyDate === day ? state.emergencyCompletionsToday : 0;
				const completedQuickly = goal.type !== 'special-habit' && time - Date.parse(goal.createdAt) < 15 * 60_000;
				const rewardBlocked = goal.rewardBlocked || (completedQuickly && emergencyCount >= 3);
				const failedChallengeFury = goal.type !== 'special-habit' && isLate(goal, now.toISOString()) ? challengeFailureFury(goal) : 0;
				const failedChallengeState = failedChallengeFury ? { challenge: 'none' as const, challengeFailed: true } : {};
				const completed: Goal =
					goal.type === 'task' ?
						{
							...goal,
							...failedChallengeState,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
						}
					: goal.type === 'special-habit' ?
						{
							...goal,
							...failedChallengeState,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
							streak: goal.streakState === 'cracked' ? goal.streak : goal.streak + 1,
							streakBeforeCompletion: goal.streak,
							streakState: goal.streakState === 'cracked' ? 'cracked' : 'active',
							streakDueAt: dayEnd(),
							frozenAt: undefined,
							repairPending: goal.streakState === 'cracked',
						}
					:	{
							...goal,
							...failedChallengeState,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
							streak: goal.streak + 1,
							streakBeforeCompletion: goal.streak,
							streakState: 'active',
							streakDueAt: dayEnd(),
							frozenAt: undefined,
						};

				setSlice(current => ({
					incompleteHabits: withoutGoal(current.incompleteHabits, id) as HabitGoal[],
					incompleteTasks: withoutGoal(current.incompleteTasks, id) as TaskGoal[],
					specialHabits: goal.type === 'special-habit' ? current.specialHabits.map(habit => (habit.id === id ? (completed as SpecialHabitGoal) : habit)) : current.specialHabits,
					completed: goal.type === 'special-habit' ? current.completed : [...current.completed, completed],
					pendingHarvestIds: [...new Set([...current.pendingHarvestIds, id])],
					recentCompletionTimes: [...recent, time],
					emergencyCompletionsToday: emergencyCount + (completedQuickly ? 1 : 0),
					emergencyDate: day,
					lastWarning: rewardBlocked ? 'This Emergency Directive completion is recorded but has no reward.' : undefined,
				}));
				if (failedChallengeFury) useWorldStore.getState().resourceStore.addResource('fury', failedChallengeFury);
				useProductionStore.getState().updateUnlockState({ completedGoals: useProductionStore.getState().unlockState.completedGoals + 1 });
				return true;
			},
			completeSpecialHabit: (kind, now = new Date()) => {
				const specialHabit = getSlice().specialHabits.find(goal => goal.specialKind === kind && goal.status === 'incomplete');
				if (!specialHabit || specialHabit.lastRewardedOn === now.toISOString().slice(0, 10)) return false;
				if (!getSlice().completeGoal(specialHabit.id, now, true)) return false;
				const completed = getSlice().specialHabits.find(goal => goal.id === specialHabit.id);
				if (!completed || completed.status !== 'completed') return false;
				const reward = getSlice().harvestGoal(completed.id, useWorldStore.getState().optionsStore.gameMode);
				if (!reward) return false;
				setSlice(state => ({
					specialRewardNotifications: [...state.specialRewardNotifications, { id: `${completed.id}-${now.getTime()}`, title: completed.title, streak: completed.streak, reward }],
				}));
				return true;
			},
			dismissSpecialRewardNotification: () => setSlice(state => ({ specialRewardNotifications: state.specialRewardNotifications.slice(1) })),
			restoreGoal: id => {
				const specialHabit = getSlice().specialHabits.find(candidate => candidate.id === id && candidate.status === 'completed');
				const goal = specialHabit ?? getSlice().completed.find(candidate => candidate.id === id);
				if (!goal) return false;
				const duePassed = goal.type !== 'task' && Date.parse(goal.streakDueAt) <= Date.now();
				const restoredStreakState = duePassed ? 'frozen' as const : 'active' as const;
				useProductionStore.getState().updateUnlockState({ completedGoals: Math.max(0, useProductionStore.getState().unlockState.completedGoals - 1) });

				if (goal.type === 'special-habit') {
					setSlice(state => ({
						specialHabits: state.specialHabits.map(habit => (habit.id === id ? { ...habit, status: 'incomplete', completedAt: undefined, streakBeforeCompletion: undefined, streak: Math.max(0, habit.streak - 1), streakState: restoredStreakState, streakDueAt: dayEnd(), frozenAt: duePassed ? new Date().toISOString() : undefined, repairPending: false } : habit)),
						pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
					}));
					return true;
				}

				if (goal.type === 'habit') {
					setSlice(state => ({
						completed: withoutGoal(state.completed, id),
						incompleteHabits: [...state.incompleteHabits, { ...goal, status: 'incomplete', completedAt: undefined, streakBeforeCompletion: undefined, streak: Math.max(0, goal.streak - 1), streakState: restoredStreakState, streakDueAt: dayEnd(), frozenAt: duePassed ? new Date().toISOString() : undefined }],
						pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
					}));
					return true;
				}

				setSlice(state => ({
					completed: withoutGoal(state.completed, id),
					incompleteTasks: [...state.incompleteTasks, { ...goal, status: 'incomplete', completedAt: undefined, streakBeforeCompletion: undefined, dueAt: goal.dueAt && Date.parse(goal.dueAt) < Date.now() ? nextMidnight() : goal.dueAt }],
					pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
				}));
				return true;
			},
			harvestGoal: (id, mode) => {
				const specialHabit = getSlice().specialHabits.find(candidate => candidate.id === id && candidate.status === 'completed');
				const goal = specialHabit ?? getSlice().completed.find(candidate => candidate.id === id);
				if (!goal) return undefined;
				if (mode === 'lock-in' && goal.type !== 'special-habit') {
					setSlice({ lastWarning: 'Harvesting is unavailable while Lock-In is active.' });
					return undefined;
				}

				const production = useProductionStore.getState();
				const levels = production.levels;
				const deityLevels = getDeityLevels(levels);
				const premium = usePremiumStore.getState().isPremium;
				const premiumMultipliers: HarvestPremiumMultipliers =
					premium ?
						{
							xp: DRAGON_PACT_BENEFITS.harvestXpMultiplier,
							darkEnergy: DRAGON_PACT_BENEFITS.harvestDarkEnergyMultiplier,
							furyReduction: DRAGON_PACT_BENEFITS.harvestFuryReductionMultiplier,
						}
					: STANDARD_HARVEST_MULTIPLIERS;
				const goalMultipliers = useProductionStore.getState().goalMultiplierStore;
				const goalMultiplier = decimal(goalMultipliers.getDarkEnergyMultiplier(goal.archetype));
				const prestige = usePrestigeStore.getState();
				const dragonAge = useWorldStore.getState().resourceStore.dragon.ageDays;
				const titanomachyHarvestMultiplier = calculateTitanomachyMultiplier(prestige.titanomachyActive, dragonAge, WORLD_CONSTANTS.titanomachyProductionAdditivePerAge);
				const activeSpells = useProductionSpecialStore.getState().spells.activeSpells;
				const poseidonHarvestMultiplier = decimal(2).pow(deityLevels.poseidon ?? 0).toNumber();
				const darkEnergySpellMultiplier = calculateSpellMultiplier(activeSpells, 'darkEnergy').toNumber();
				const calmSpellMultiplier = calculateSpellMultiplier(activeSpells, 'furyReduction').toNumber();
				const reward = calculateGoalReward(
					goal,
					mode,
					deityLevels.artemis ?? 0,
					deityLevels.aphrodite ?? 0,
					goalMultiplier,
					poseidonHarvestMultiplier * darkEnergySpellMultiplier,
					titanomachyHarvestMultiplier,
					{ ...premiumMultipliers, furyReduction: premiumMultipliers.furyReduction * calmSpellMultiplier },
				);
				goalMultipliers.recordXp(goal.archetype, decimal(reward.xp).toNumber());
				const state = getSlice();
				const harvestDate = today();
				const shardsHarvestedToday = state.shardHarvestDate === harvestDate ? state.shardsHarvestedToday : 0;
				const shardCap = premium ? PREMIUM_SHARD_HARVEST_CAP : FREE_SHARD_HARVEST_CAP;
				const challengeBypassesShardCap = goal.challenge !== 'none' && !isLate(goal);
				const cappedShards = challengeBypassesShardCap ? decimal(0) : decimal(reward.shards);
				const grantedCappedShards = cappedShards.min(Math.max(0, shardCap - shardsHarvestedToday));
				const grantedShards = challengeBypassesShardCap ? decimal(reward.shards) : grantedCappedShards;
				const harvestedReward = { ...reward, shards: grantedShards.toString() };
				const resources = useWorldStore.getState().resourceStore;

				// Rewards are applied before a special habit is readied for its next daily cycle.
				resources.addResources({ darkEnergy: harvestedReward.darkEnergy, shards: harvestedReward.shards, quarks: harvestedReward.quarks, fury: decimal(harvestedReward.furyReduction).neg() });
				setSlice({
					shardHarvestDate: harvestDate,
					shardsHarvestedToday: shardsHarvestedToday + grantedCappedShards.toNumber(),
				});

				useStatsStore.getState().recordGoal(goal);
				useStatsStore.getState().recordResources(useWorldStore.getState().resourceStore.resources);
				useStatsStore.getState().refreshAchievements();
				if (goal.type === 'special-habit') {
					setSlice(state => ({
						specialHabits: state.specialHabits.map(habit => (habit.id === id ? { ...habit, status: 'incomplete', completedAt: undefined, streakBeforeCompletion: undefined, rewardBlocked: false, streakDueAt: nextDayEnd(), lastRewardedOn: today() } : habit)),
						pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
					}));
				} else {
					const archived: Goal = { ...goal, status: 'archived', archivedAt: new Date().toISOString() };
					setSlice(state => ({ completed: withoutGoal(state.completed, id), archived: [...state.archived, archived], pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id) }));
				}
				return harvestedReward;
			},
			harvestAllPending: mode => [...getSlice().pendingHarvestIds].map(id => getSlice().harvestGoal(id, mode)).filter((reward): reward is GoalReward => Boolean(reward)),
			setAutoHarvest: enabled => setSlice({ autoHarvestEnabled: enabled }),
			getGoal: id => allGoals(getSlice()).find(goal => goal.id === id),
			getPomodoroGoals: () => [...getSlice().incompleteHabits, ...getSlice().incompleteTasks, ...getSlice().specialHabits].filter(goal => goal.pomodoroPinned),
			processMidnight: (now = new Date()) => {
				const midnightDate = now.toISOString().slice(0, 10);
				const previousMidnightDate = getSlice().lastMidnightDate;
				const nowMs = now.getTime();
				const expiredChallengeTasks = getSlice().incompleteTasks.filter(task => task.dueAt && Date.parse(task.dueAt) <= nowMs && task.challenge !== 'none' && !task.challengeFailed);
				if (expiredChallengeTasks.length) {
					const expiredIds = new Set(expiredChallengeTasks.map(task => task.id));
					setSlice(state => ({ incompleteTasks: state.incompleteTasks.map(task => (expiredIds.has(task.id) ? { ...task, challenge: 'none' as const, challengeFailed: true } : task)) }));
					useWorldStore.getState().resourceStore.addResource('fury', expiredChallengeTasks.reduce((sum, task) => sum + challengeFailureFury(task), 0));
				}
				if (previousMidnightDate === midnightDate) return;
				if (previousMidnightDate && getSlice().autoHarvestEnabled && useWorldStore.getState().optionsStore.gameMode !== 'lock-in') getSlice().harvestAllPending(useWorldStore.getState().optionsStore.gameMode);
				const hestiaLevel = useProductionStore.getState().levels.hestia ?? 0;
				const crackAfterMs = (24 + hestiaLevel * 12) * 60 * 60 * 1_000;
				let challengeFuryPenalty = 0;
				const freezeExpiredHabit = <Habit extends HabitGoal | SpecialHabitGoal>(habit: Habit): Habit => {
					if (Date.parse(habit.streakDueAt) > nowMs) return habit;
					const frozenForMs = nowMs - Date.parse(habit.frozenAt ?? habit.streakDueAt);
					const nextState = habit.streakState === 'frozen' && frozenForMs >= crackAfterMs ? 'cracked' as const : 'frozen' as const;
					const challengeBroken = nextState === 'cracked' && habit.streakState !== 'cracked' && habit.challenge !== 'none';
					if (challengeBroken) challengeFuryPenalty += challengeFailureFury(habit);
					return {
						...habit,
						streakState: nextState,
						streakDueAt: dayEnd(now),
						frozenAt: habit.frozenAt ?? now.toISOString(),
						challenge: challengeBroken ? 'none' : habit.challenge,
						challengeFailed: challengeBroken || habit.challengeFailed,
					};
				};

				setSlice(state => ({
					incompleteHabits: state.incompleteHabits.map(freezeExpiredHabit),
					specialHabits: state.specialHabits.map(habit => {
						if (habit.status === 'completed') return habit;
						return freezeExpiredHabit(habit);
					}),
					lastMidnightDate: midnightDate,
					shardHarvestDate: midnightDate,
					shardsHarvestedToday: 0,
				}));
				if (challengeFuryPenalty) useWorldStore.getState().resourceStore.addResource('fury', challengeFuryPenalty);
				if (previousMidnightDate) getRoot().surveys.resetDaily();
			},
			repairHabitStreak: id => {
				const habit = getSlice().incompleteHabits.find(goal => goal.id === id) ?? getSlice().specialHabits.find(goal => goal.id === id);
				const repairCost = Math.max(5, habit?.streak ?? 0);
				if (!habit || habit.streakState !== 'cracked' || !useWorldStore.getState().resourceStore.spendResource('shards', repairCost)) return false;
				setSlice(state => ({
					incompleteHabits: state.incompleteHabits.map(goal => (goal.id === id ? { ...goal, streakState: 'active', streak: Math.max(1, goal.streak), streakDueAt: dayEnd(), frozenAt: undefined } : goal)),
					specialHabits: state.specialHabits.map(goal => (goal.id === id ? { ...goal, streakState: 'active', streak: Math.max(1, goal.streak), streakDueAt: dayEnd(), frozenAt: undefined, repairPending: false } : goal)),
				}));
				return true;
			},
			resetHabitStreak: id => {
				const habit = getSlice().incompleteHabits.find(goal => goal.id === id) ?? getSlice().specialHabits.find(goal => goal.id === id);
				if (!habit || habit.streakState !== 'cracked') return false;
				setSlice(state => ({
					incompleteHabits: state.incompleteHabits.map(goal => (goal.id === id ? { ...goal, streak: 1, streakState: 'active', streakDueAt: dayEnd(), frozenAt: undefined } : goal)),
					specialHabits: state.specialHabits.map(goal => (goal.id === id ? { ...goal, streak: 1, streakState: 'active', streakDueAt: dayEnd(), frozenAt: undefined, repairPending: false } : goal)),
				}));
				return true;
			},
			reset: () => setSlice(initialState()),
		},
	};
};

const migrateGoalChallenge = <GoalType extends Goal>(goal: GoalType): GoalType => {
	const storedChallenge = goal.challenge as Goal['challenge'] | 'crimson';
	return (storedChallenge === 'crimson' ? { ...goal, challenge: 'harvest' as const } : goal) as GoalType;
};

/** Keeps pre-Harvest-Challenge saves compatible with the current goal model. */
export const migrateGoalStore = (goals: GoalStoreState): GoalStoreState => ({
	...goals,
	incompleteHabits: goals.incompleteHabits.map(migrateGoalChallenge),
	incompleteTasks: goals.incompleteTasks.map(migrateGoalChallenge),
	specialHabits: goals.specialHabits.map(migrateGoalChallenge),
	completed: goals.completed.map(migrateGoalChallenge),
	archived: goals.archived.map(migrateGoalChallenge),
});
