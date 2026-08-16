import { FUN_FACTS } from '@/data/productivity-data/funFact';
import { GOAL_SUGGESTIONS, type GoalSuggestion } from '@/data/productivity-data/goalSuggestion';
import { QUOTES } from '@/data/productivity-data/quotes';
import type { GoalType } from '@/types/goals.types';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useStatsStore } from '../useStatsStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductivitySlice } from './_useProductivityStore';

export type SurveyKind = 'check-in' | 'check-out';
type QuoteTopic = 'focus' | 'habits' | 'growth' | 'rest';
type Suggestion = GoalSuggestion;

const moodFuryReduction = (mood: string) => {
	const high = new Set(['excited', 'surprised', 'shocked', 'enraged', 'disgusted', 'great']);
	const medium = new Set(['fulfilled', 'calm', 'content', 'uneasy', 'confused', 'anxious', 'good', 'okay']);
	return (
		high.has(mood) ? 5
		: medium.has(mood) ? 3
		: 1
	);
};

const select = <T>(items: readonly T[], count = 1) => [...items].sort(() => Math.random() - 0.5).slice(0, Math.max(1, count));
const surveyAdvice = ['Name the next action before making the plan.', 'Choose a task small enough to start now.'];

export interface SurveyResponse {
	mood?: string;
	goalsAdded: number;
	goalsHarvested: number;
	completedAt: string;
}

export interface SurveySession {
	id: string;
	date: string;
	checkIn?: SurveyResponse;
	checkOut?: SurveyResponse;
}

export interface SurveyStoreState {
	checkInCompleted: boolean;
	checkOutCompleted: boolean;
	checkOutAvailable: boolean;
	checkInStreak: number;
	checkOutStreak: number;
	activeSession: SurveySession;
	archived: SurveySession[];
	completeCheckIn: (response?: Partial<SurveyResponse>) => void;
	completeCheckOut: (response?: Partial<SurveyResponse>, allowWithoutCheckIn?: boolean) => boolean;
	resetDaily: () => void;
	getSuggestions: (type: GoalType, count?: number) => Suggestion[];
	getAdvice: (count?: number) => string[];
	getQuote: (topic?: QuoteTopic, count?: number) => (typeof QUOTES)[number][];
	getFunFact: (count?: number) => string[];
	setGoalsAdded: (count: number) => void;
	setGoalsHarvested: (count: number) => void;
	reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const newSession = (): SurveySession => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: today() });

const initialState = () => ({
	checkInCompleted: false,
	checkOutCompleted: false,
	checkOutAvailable: false,
	checkInStreak: 0,
	checkOutStreak: 0,
	activeSession: newSession(),
	archived: [] as SurveySession[],
});

export const createSurveySlice: ProductivitySlice<'surveys'> = (set, get) => {
	const { setSlice, getSlice } = scopeNestedSlice<import('./_useProductivityStore').ProductivityStoreState, 'surveys', SurveyStoreState>('surveys', set, get);

	return {
		surveys: {
			...initialState(),
			completeCheckIn: response => {
				if (getSlice().checkInCompleted) return;
				const completedAt = new Date().toISOString();
				const mood = response?.mood;
				if (mood) useWorldStore.getState().resourceStore.addResource('fury', -moodFuryReduction(mood));
				useProductionStore.getState().updateUnlockState({ checkInCompleted: true });
				useStatsStore.getState().recordSurvey('check-in');
				setSlice(state => ({
					checkInCompleted: true,
					checkOutAvailable: true,
					checkInStreak: state.checkInStreak + 1,
					activeSession: { ...state.activeSession, checkIn: { mood, goalsAdded: response?.goalsAdded ?? state.activeSession.checkIn?.goalsAdded ?? 0, goalsHarvested: 0, completedAt } },
				}));
			},
			completeCheckOut: (response, allowWithoutCheckIn = false) => {
				if ((!getSlice().checkOutAvailable && !allowWithoutCheckIn) || getSlice().checkOutCompleted) return false;
				const completedAt = new Date().toISOString();
				const mood = response?.mood;
				if (mood) useWorldStore.getState().resourceStore.addResource('fury', -moodFuryReduction(mood));
				useProductionStore.getState().updateUnlockState({ checkOutCompleted: true });
				useStatsStore.getState().recordSurvey('check-out');
				setSlice(state => {
					const completedSession: SurveySession = {
						...state.activeSession,
						checkOut: { mood, goalsAdded: 0, goalsHarvested: response?.goalsHarvested ?? state.activeSession.checkOut?.goalsHarvested ?? 0, completedAt },
					};
					return {
						checkOutCompleted: true,
						checkOutAvailable: false,
						checkOutStreak: state.checkOutStreak + 1,
						activeSession: completedSession,
						archived: [completedSession, ...state.archived],
					};
				});
				return true;
			},
			// A streak advances only when its matching survey was completed that day.
			resetDaily: () =>
				setSlice(state => ({
					...initialState(),
					checkInStreak: state.checkInCompleted ? state.checkInStreak : 0,
					checkOutStreak: state.checkOutCompleted ? state.checkOutStreak : 0,
					archived: state.archived,
				})),
			getSuggestions: (type, count = 1) =>
				select(
					GOAL_SUGGESTIONS.filter(suggestion => suggestion.type === type),
					count,
				),
			getAdvice: (count = 1) => select(surveyAdvice, count),
			getQuote: (_topic, count = 1) => select(QUOTES, count),
			getFunFact: (count = 1) => select(FUN_FACTS, count),
			setGoalsAdded: count => setSlice(state => ({ activeSession: { ...state.activeSession, checkIn: { mood: state.activeSession.checkIn?.mood, goalsAdded: Math.max(0, count), goalsHarvested: 0, completedAt: state.activeSession.checkIn?.completedAt ?? new Date().toISOString() } } })),
			setGoalsHarvested: count => setSlice(state => ({ activeSession: { ...state.activeSession, checkOut: { mood: state.activeSession.checkOut?.mood, goalsAdded: 0, goalsHarvested: Math.max(0, count), completedAt: state.activeSession.checkOut?.completedAt ?? new Date().toISOString() } } })),
			reset: () => setSlice(initialState()),
		},
	};
};
