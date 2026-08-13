import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useCrimsonHeartStore } from '../store-production-special/createCrimsonHeartSlice';
import { useResourceStore } from '../store-world/createResourceSlice';
import { useStatsStore } from '../useStatsStore';
import type { ProductivitySlice } from './_useProductivityStore';

export type PomodoroStatus = 'idle' | 'countdown-active' | 'countdown-break' | 'count-up' | 'crimson-heart';

export interface PomodoroBoost {
	id: string;
	name: string;
	resourceMultiplier: number;
	description: string;
}

export interface CompletedPomodoroSession {
	seconds: number;
	completed: boolean;
	shards: string;
	furyReduction: string;
}

export interface PomodoroStoreState {
	status: PomodoroStatus;
	isPaused: boolean;
	secondsRemaining: number;
	elapsedSeconds: number;
	activeDurationSeconds: number;
	shortBreakSeconds: number;
	longBreakSeconds: number;
	pinnedGoalIds: string[];
	activeBoostIds: string[];
	completedSessionCount: number;
	pomodoroHabitStreak: number;
	lastCompletedSessionSeconds: number;
	startCountdown: (minutes: number) => boolean;
	startCountUp: () => boolean;
	pause: () => void;
	resume: () => void;
	tick: (seconds?: number) => CompletedPomodoroSession | undefined;
	endSession: (completed?: boolean) => CompletedPomodoroSession | undefined;
	startBreak: (kind: 'short' | 'long') => boolean;
	adjustTime: (seconds: number) => void;
	setBreakDurations: (shortMinutes: number, longMinutes: number) => boolean;
	pinGoal: (goalId: string) => void;
	unpinGoal: (goalId: string) => void;
	setActiveBoosts: (boostIds: string[]) => void;
	reset: () => void;
}

export const POMODORO_BOOSTS: PomodoroBoost[] = [
	{ id: 'steady-flame', name: 'Steady Flame', resourceMultiplier: 1.25, description: 'A reliable production boost.' },
	{ id: 'clear-mind', name: 'Clear Mind', resourceMultiplier: 1.5, description: 'A stronger reward boost for focused sessions.' },
	{ id: 'crimson-surge', name: 'Crimson Surge', resourceMultiplier: 2, description: 'A powerful short-session multiplier.' },
];

const initialState = () => ({
	status: 'idle' as PomodoroStatus,
	isPaused: false,
	secondsRemaining: 0,
	elapsedSeconds: 0,
	activeDurationSeconds: 25 * 60,
	shortBreakSeconds: 5 * 60,
	longBreakSeconds: 15 * 60,
	pinnedGoalIds: [] as string[],
	activeBoostIds: [] as string[],
	completedSessionCount: 0,
	pomodoroHabitStreak: 0,
	lastCompletedSessionSeconds: 0,
});

const rewardForSession = (seconds: number, completed: boolean): CompletedPomodoroSession => {
	const focusedSeconds = completed ? seconds : 0;
	return {
		seconds,
		completed,
		shards: decimal(focusedSeconds)
			.div(15 * 60)
			.times(0.5)
			.min(12)
			.toString(),
		furyReduction: decimal(focusedSeconds).div(60).toString(),
	};
};

const applySessionReward = (session: CompletedPomodoroSession) => {
	if (!session.completed || !session.seconds) return;
	useResourceStore.getState().addResource('shards', session.shards);
	useResourceStore.getState().addResource('fury', decimal(session.furyReduction).neg());
	useStatsStore.getState().recordPomodoro(session.seconds);
	useProductionStore.getState().updateUnlockState({ pomodoroMinutes: useProductionStore.getState().unlockState.pomodoroMinutes + session.seconds / 60 });
};

/** Starting a focus session immediately applies the currently unlocked Heart charge. */
const fillCrimsonHeartForPomodoro = () => {
	const levels = useProductionStore.getState().levels;
	const activation = levels['crimson-activation'] ? 1 : 0;
	const awakening = levels['crimson-pomodoro-awakening'] ?? 0;
	useCrimsonHeartStore.getState().setCharge(Math.min(100, awakening * 100 || activation));
};

export const usePomodoroStore = create<PomodoroStoreState>()(
	persist(
		(set, get) => ({
			...initialState(),
			startCountdown: minutes => {
				if (!Number.isFinite(minutes) || minutes <= 0 || get().status !== 'idle') return false;
				const seconds = Math.round(minutes * 60);
				set({ status: 'countdown-active', isPaused: false, secondsRemaining: seconds, elapsedSeconds: 0, activeDurationSeconds: seconds });
				fillCrimsonHeartForPomodoro();
				return true;
			},
			startCountUp: () => {
				if (get().status !== 'idle') return false;
				set({ status: 'count-up', isPaused: false, secondsRemaining: 0, elapsedSeconds: 0 });
				fillCrimsonHeartForPomodoro();
				return true;
			},
			pause: () => set(state => (state.status === 'idle' ? state : { isPaused: true })),
			resume: () => set(state => (state.status === 'idle' ? state : { isPaused: false })),
			tick: (seconds = 1) => {
				const state = get();
				if (state.status === 'idle' || state.isPaused || seconds <= 0) return undefined;
				if (state.status === 'countdown-active' || state.status === 'countdown-break') {
					const remaining = Math.max(0, state.secondsRemaining - seconds);
					set({ secondsRemaining: remaining, elapsedSeconds: state.elapsedSeconds + seconds });
					if (remaining > 0) return undefined;
					return get().endSession(state.status === 'countdown-active');
				}
				set({ elapsedSeconds: state.elapsedSeconds + seconds });
				return undefined;
			},
			endSession: (completed = false) => {
				const state = get();
				if (state.status === 'idle') return undefined;
				const isFocusSession = state.status === 'countdown-active' || state.status === 'count-up' || state.status === 'crimson-heart';
				const session = rewardForSession(state.elapsedSeconds, completed && isFocusSession);
				applySessionReward(session);
				set(current => ({
					...initialState(),
					pinnedGoalIds: current.pinnedGoalIds,
					activeBoostIds: current.activeBoostIds,
					shortBreakSeconds: current.shortBreakSeconds,
					longBreakSeconds: current.longBreakSeconds,
					completedSessionCount: current.completedSessionCount + (session.completed ? 1 : 0),
					pomodoroHabitStreak: session.completed ? current.pomodoroHabitStreak + 1 : current.pomodoroHabitStreak,
					lastCompletedSessionSeconds: session.completed ? session.seconds : current.lastCompletedSessionSeconds,
				}));
				return session;
			},
			startBreak: kind => {
				const state = get();
				if (state.status !== 'idle') return false;
				const seconds = kind === 'short' ? state.shortBreakSeconds : state.longBreakSeconds;
				set({ status: 'countdown-break', isPaused: false, secondsRemaining: seconds, elapsedSeconds: 0, activeDurationSeconds: seconds });
				return true;
			},
			adjustTime: seconds =>
				set(state => {
					if (state.status === 'idle' || !Number.isFinite(seconds)) return state;
					return { secondsRemaining: Math.max(0, state.secondsRemaining + Math.round(seconds)), activeDurationSeconds: Math.max(1, state.activeDurationSeconds + Math.round(seconds)) };
				}),
			setBreakDurations: (shortMinutes, longMinutes) => {
				if (shortMinutes <= 0 || longMinutes <= shortMinutes) return false;
				set({ shortBreakSeconds: Math.round(shortMinutes * 60), longBreakSeconds: Math.round(longMinutes * 60) });
				return true;
			},
			pinGoal: goalId => set(state => (state.pinnedGoalIds.includes(goalId) ? state : { pinnedGoalIds: [...state.pinnedGoalIds, goalId] })),
			unpinGoal: goalId => set(state => ({ pinnedGoalIds: state.pinnedGoalIds.filter(id => id !== goalId) })),
			setActiveBoosts: boostIds => set({ activeBoostIds: boostIds.filter(id => POMODORO_BOOSTS.some(boost => boost.id === id)) }),
			reset: () => set(initialState()),
		}),
		{ name: 'dragonfocus:pomodoro', storage: createJSONStorage(() => AsyncStorage) },
	),
);

export const createPomodoroSlice: ProductivitySlice<'pomodoro'> = () => ({ pomodoro: usePomodoroStore });
