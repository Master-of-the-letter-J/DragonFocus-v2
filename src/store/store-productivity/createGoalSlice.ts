import type { Goal, GoalInput, GoalReward, HabitGoal, SpecialHabitGoal, SpecialHabitKind, TaskGoal } from '@/types/goals.types';
import type { GameMode } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useStatsStore } from '../useStatsStore';
import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductivitySlice, ProductivityStoreState } from './_useProductivityStore';

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

const goalId = () => `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const allGoals = (state: Pick<GoalStoreState, 'incompleteHabits' | 'incompleteTasks' | 'specialHabits' | 'completed' | 'archived'>) => [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits, ...state.completed, ...state.archived];
const today = () => new Date().toISOString().slice(0, 10);

const difficultyXp = { trivial: 1, easy: 2, medium: 3, hard: 4, 'hard-plus': 5 } as const;
const harvestMultiplier: Record<GameMode, number> = { invincible: 0.5, 'lock-in': 4, easy: 1, medium: 2, hard: 4, 'hard-plus': 6 };
const FREE_SHARD_HARVEST_CAP = 50;
const PREMIUM_SHARD_HARVEST_CAP = FREE_SHARD_HARVEST_CAP * DRAGON_PACT_BENEFITS.goalShardCapMultiplier;

const specialHabitDetails: Record<SpecialHabitKind, { title: string; description: string; minimumPomodoroSeconds?: number }> = {
	'survey-check-in': { title: 'Complete Check-In Survey', description: 'Complete today’s check-in survey.' },
	'survey-check-out': { title: 'Complete Check-Out Survey', description: 'Complete today’s check-out survey.' },
	'pomodoro-30-seconds': { title: 'Focus for 30 Seconds', description: 'Complete a focused Pomodoro session lasting at least 30 seconds.', minimumPomodoroSeconds: 30 },
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
const calculateGoalReward = (goal: Goal, mode: GameMode, artemisLevel = 0, aphroditeLevel = 0, goalMultiplier = decimal(1), rewardMultiplier = 1): GoalReward => {
	if (goal.rewardBlocked) return { xp: '0', darkEnergy: '0', shards: '0', furyReduction: '0', quarks: '0' };

	const difficulty = difficultyXp[goal.difficulty];
	const streak = goal.type === 'task' ? 0 : goal.streak;
	const late = goal.dueAt ? Date.parse(goal.completedAt ?? '') > Date.parse(goal.dueAt) : false;
	const completedPomodoroHabit = goal.type === 'special-habit' && goal.specialKind.startsWith('pomodoro-');
	const daysToComplete = goal.type === 'task' ? Math.max(0, Math.floor((Date.parse(goal.completedAt ?? goal.createdAt) - Date.parse(goal.createdAt)) / 86_400_000)) : 0;
	const baseXp =
		late ? 2 + goal.subgoals.length
		: completedPomodoroHabit ? 3 + streak + goal.subgoals.length
		: goal.type === 'special-habit' ? 6 + 2 * streak + goal.subgoals.length
		: goal.type === 'habit' ? 5 + difficulty + streak + goal.subgoals.length
		: 5 + difficulty + daysToComplete + goal.subgoals.length;
	const hasCrimsonChallenge = goal.challenge === 'crimson' || goal.challenge === 'both';
	const hasQuantumChallenge = goal.challenge === 'quantum' || goal.challenge === 'both';
	const challengeMultiplier = hasCrimsonChallenge ? 2 : 1;
	const artemisMultiplier = artemisLevel > 0 ? decimal(2).times(decimal(1.5).pow(artemisLevel - 1)) : decimal(1);
	const totalXp = decimal(baseXp).times(challengeMultiplier).times(artemisMultiplier).times(rewardMultiplier);
	const darkEnergy = totalXp.times(goalMultiplier).times(harvestMultiplier[mode]);
	const baseShards =
		goal.type === 'special-habit' ?
			goal.specialKind.startsWith('survey-') ?
				Math.min(5, 1 + 2 * streak)
			:	Math.min(3, 1 + streak)
		: goal.type === 'habit' ? Math.min(3, streak)
		: 0;
	const bonusShards = hasCrimsonChallenge ? Math.max(0, difficulty - 2) : 0;
	const quantumBonus =
		goal.difficulty === 'medium' ? 4
		: goal.difficulty === 'hard' ? 8
		: goal.difficulty === 'hard-plus' ? 12
		: 0;

	return {
		xp: totalXp.toString(),
		darkEnergy: darkEnergy.toString(),
		shards: decimal(baseShards + bonusShards)
			.times(rewardMultiplier)
			.toString(),
		furyReduction: decimal(baseXp)
			.times(challengeMultiplier)
			.times(1 + aphroditeLevel * 0.1)
			.times(rewardMultiplier)
			.toString(),
		// Crimson doubles every non-shard reward, including a Quantum challenge's Quarks.
		quarks: hasQuantumChallenge && !late ? decimal(quantumBonus).times(challengeMultiplier).times(rewardMultiplier).toString() : '0',
	};
};

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
	addGoal: (input: GoalInput) => Goal | undefined;
	removeGoal: (id: string) => void;
	updateGoal: (id: string, changes: Partial<Goal>) => void;
	setGoalChallenge: (id: string, challenge: Goal['challenge']) => boolean;
	completeGoal: (id: string, now?: Date) => boolean;
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
});

const withoutGoal = (goals: Goal[], id: string) => goals.filter(goal => goal.id !== id);

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
				const activeOfType = input.type === 'habit' ? state.incompleteHabits.length : state.incompleteTasks.length;
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
					archetype: input.archetype ?? 'personal',
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
				const target = [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits].find(goal => goal.id === id);
				if (!target || target.challenge === challenge) return false;
				const premium = usePremiumStore.getState().isPremium;
				const wantsCrimson = challenge === 'crimson' || challenge === 'both';
				const wantsQuantum = challenge === 'quantum' || challenge === 'both';
				if (wantsCrimson && !premium) return false;

				const activeGoals = [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits].filter(goal => goal.id !== id);
				const crimsonChallenges = activeGoals.filter(goal => goal.challenge === 'crimson' || goal.challenge === 'both').length;
				const quantumChallenges = activeGoals.filter(goal => goal.challenge === 'quantum' || goal.challenge === 'both').length;
				const challengeLimit = premium ? DRAGON_PACT_BENEFITS.challengeLimitPerType : 3;
				if ((wantsCrimson && crimsonChallenges >= challengeLimit) || (wantsQuantum && quantumChallenges >= challengeLimit)) return false;

				const currentCrimson = target.challenge === 'crimson' || target.challenge === 'both';
				const currentQuantum = target.challenge === 'quantum' || target.challenge === 'both';
				const shardCost = (wantsCrimson && !currentCrimson ? 3 : 0) + (wantsQuantum && !currentQuantum ? 6 : 0);
				if (shardCost && !useWorldStore.getState().resourceStore.spendResource('shards', shardCost)) return false;

				const update = (goal: Goal) => (goal.id === id ? ({ ...goal, challenge } as Goal) : goal);
				setSlice(current => ({
					incompleteHabits: current.incompleteHabits.map(update) as HabitGoal[],
					incompleteTasks: current.incompleteTasks.map(update) as TaskGoal[],
					specialHabits: current.specialHabits.map(update) as SpecialHabitGoal[],
				}));
				return true;
			},
			completeGoal: (id, now = new Date()) => {
				const state = getSlice();
				const goal = [...state.incompleteHabits, ...state.incompleteTasks, ...state.specialHabits.filter(candidate => candidate.status === 'incomplete')].find(candidate => candidate.id === id);
				if (!goal) return false;
				if (goal.type === 'special-habit' && !isSpecialHabitReady(goal, getRoot())) {
					setSlice({ lastWarning: 'Complete the linked survey or Pomodoro session before marking this special habit complete.' });
					return false;
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
				const completed: Goal =
					goal.type === 'task' ?
						{
							...goal,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
						}
					: goal.type === 'special-habit' ?
						{
							...goal,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
							streak: goal.streakState === 'cracked' ? goal.streak : goal.streak + 1,
							streakState: goal.streakState === 'cracked' ? 'cracked' : 'active',
							streakDueAt: dayEnd(),
							frozenAt: undefined,
							repairPending: goal.streakState === 'cracked',
						}
					:	{
							...goal,
							status: 'completed',
							completedAt: now.toISOString(),
							rewardBlocked,
							streak: goal.streak + 1,
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
				useProductionStore.getState().updateUnlockState({ completedGoals: useProductionStore.getState().unlockState.completedGoals + 1 });
				return true;
			},
			restoreGoal: id => {
				const specialHabit = getSlice().specialHabits.find(candidate => candidate.id === id && candidate.status === 'completed');
				const goal = specialHabit ?? getSlice().completed.find(candidate => candidate.id === id);
				if (!goal) return false;

				if (goal.type === 'special-habit') {
					setSlice(state => ({
						specialHabits: state.specialHabits.map(habit => (habit.id === id ? { ...habit, status: 'incomplete', completedAt: undefined, streak: Math.max(0, habit.streak - 1), streakState: 'active', streakDueAt: dayEnd(), frozenAt: undefined, repairPending: false } : habit)),
						pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
					}));
					return true;
				}

				if (goal.type === 'habit') {
					setSlice(state => ({
						completed: withoutGoal(state.completed, id),
						incompleteHabits: [...state.incompleteHabits, { ...goal, status: 'incomplete', completedAt: undefined, streakState: 'dormant', streakDueAt: dayEnd(), frozenAt: undefined }],
						pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
					}));
					return true;
				}

				setSlice(state => ({
					completed: withoutGoal(state.completed, id),
					incompleteTasks: [...state.incompleteTasks, { ...goal, status: 'incomplete', completedAt: undefined, dueAt: goal.dueAt && Date.parse(goal.dueAt) < Date.now() ? nextMidnight() : goal.dueAt }],
					pendingHarvestIds: state.pendingHarvestIds.filter(goalId => goalId !== id),
				}));
				return true;
			},
			harvestGoal: (id, mode) => {
				if (mode === 'lock-in') {
					setSlice({ lastWarning: 'Harvesting is unavailable while Lock-In is active.' });
					return undefined;
				}
				const specialHabit = getSlice().specialHabits.find(candidate => candidate.id === id && candidate.status === 'completed');
				const goal = specialHabit ?? getSlice().completed.find(candidate => candidate.id === id);
				if (!goal) return undefined;

				const production = useProductionStore.getState();
				const levels = production.levels;
				const premium = usePremiumStore.getState().isPremium;
				const rewardMultiplier = premium ? DRAGON_PACT_BENEFITS.harvestMultiplier : 1;
				const baseReward = calculateGoalReward(goal, mode, levels.artemis ?? 0, levels.aphrodite ?? 0, decimal(1), rewardMultiplier);
				const goalMultipliers = useProductionStore.getState().goalMultiplierStore;
				goalMultipliers.recordXp(goal.archetype, decimal(baseReward.xp).toNumber());
				const goalMultiplier = decimal(goalMultipliers.getDarkEnergyMultiplier(goal.archetype));
				const reward = calculateGoalReward(goal, mode, levels.artemis ?? 0, levels.aphrodite ?? 0, goalMultiplier, rewardMultiplier);
				const state = getSlice();
				const harvestDate = today();
				const shardsHarvestedToday = state.shardHarvestDate === harvestDate ? state.shardsHarvestedToday : 0;
				const shardCap = premium ? PREMIUM_SHARD_HARVEST_CAP : FREE_SHARD_HARVEST_CAP;
				const isChallenge = goal.challenge !== 'none';
				const grantedShards = isChallenge ? decimal(reward.shards) : decimal(reward.shards).min(Math.max(0, shardCap - shardsHarvestedToday));
				const harvestedReward = { ...reward, shards: grantedShards.toString() };
				const resources = useWorldStore.getState().resourceStore;

				// Rewards are applied before a special habit is readied for its next daily cycle.
				resources.addResource('darkEnergy', harvestedReward.darkEnergy);
				resources.addResource('shards', harvestedReward.shards);
				resources.addResource('quarks', harvestedReward.quarks);
				resources.addResource('fury', decimal(harvestedReward.furyReduction).neg());
				setSlice({
					shardHarvestDate: harvestDate,
					shardsHarvestedToday: isChallenge ? shardsHarvestedToday : shardsHarvestedToday + grantedShards.toNumber(),
				});

				useStatsStore.getState().recordGoal(goal);
				useStatsStore.getState().recordResources(useWorldStore.getState().resourceStore.resources);
				useStatsStore.getState().refreshAchievements();
				if (goal.type === 'special-habit') {
					setSlice(state => ({
						specialHabits: state.specialHabits.map(habit => (habit.id === id ? { ...habit, status: 'incomplete', completedAt: undefined } : habit)),
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
				if (getSlice().lastMidnightDate === midnightDate) return;
				const nowMs = now.getTime();
				const hestiaLevel = useProductionStore.getState().levels.hestia ?? 0;
				const crackAfterMs = (24 + hestiaLevel * 12) * 60 * 60 * 1_000;
				const freezeExpiredHabit = <Habit extends HabitGoal | SpecialHabitGoal>(habit: Habit): Habit => {
					if (Date.parse(habit.streakDueAt) > nowMs) return habit;
					const frozenForMs = nowMs - Date.parse(habit.frozenAt ?? habit.streakDueAt);
					return {
						...habit,
						streakState: habit.streakState === 'frozen' && frozenForMs >= crackAfterMs ? 'cracked' : 'frozen',
						streakDueAt: dayEnd(now),
						frozenAt: habit.frozenAt ?? now.toISOString(),
					};
				};

				setSlice(state => ({
					incompleteHabits: state.incompleteHabits.map(freezeExpiredHabit),
					specialHabits: state.specialHabits.map(habit => {
						if (habit.status === 'completed') {
							return { ...habit, status: 'incomplete', completedAt: undefined, rewardBlocked: false, streakState: habit.streakState === 'cracked' ? 'cracked' : 'active', streakDueAt: dayEnd(now), frozenAt: undefined };
						}
						return freezeExpiredHabit(habit);
					}),
					lastMidnightDate: midnightDate,
					shardHarvestDate: midnightDate,
					shardsHarvestedToday: 0,
				}));
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
