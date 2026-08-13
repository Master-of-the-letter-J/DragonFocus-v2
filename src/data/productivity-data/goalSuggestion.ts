import type { GoalCategory, GoalType } from '@/types/goals.types';

export interface GoalSuggestion {
	id: string;
	title: string;
	type: GoalType;
	category: GoalCategory;
}

export const GOAL_SUGGESTIONS: GoalSuggestion[] = [
	{ id: 'placeholder-task', title: 'Choose one meaningful next task', type: 'task', category: 'other' },
	{ id: 'placeholder-habit', title: 'Choose one sustainable daily habit', type: 'habit', category: 'personal' },
];
