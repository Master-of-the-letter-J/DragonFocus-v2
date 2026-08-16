import { scopeNestedSlice } from '../nested-slice';
import type { ProductivitySlice, ProductivityStoreState } from './_useProductivityStore';

export type SurveyQuestionId = 'mood' | 'goals' | 'advice' | 'journal';
export type QuotePosition = 'start' | 'end';

export const DEFAULT_GOAL_CATEGORIES = ['personal', 'mental', 'physical', 'career', 'relationships', 'contribution', 'financial', 'other'] as const;
export const DEFAULT_SURVEY_EMOTIONS = ['great', 'good', 'calm', 'content', 'okay', 'uneasy', 'anxious', 'tired'] as const;
export const DEFAULT_ADVICE_CATEGORIES = ['focus', 'habits', 'growth', 'rest'] as const;

export interface SurveyPreferencesStoreState {
	enabledQuestions: Record<SurveyQuestionId, boolean>;
	questionOrder: SurveyQuestionId[];
	customGoalCategories: string[];
	emotions: string[];
	adviceCategories: string[];
	quoteCount: 1 | 2 | 3;
	quotePosition: QuotePosition;
	setQuestionEnabled: (question: SurveyQuestionId, enabled: boolean) => void;
	moveQuestion: (question: SurveyQuestionId, delta: -1 | 1) => void;
	addGoalCategory: (category: string) => boolean;
	removeGoalCategory: (category: string) => void;
	addEmotion: (emotion: string) => boolean;
	removeEmotion: (emotion: string) => void;
	addAdviceCategory: (category: string) => boolean;
	removeAdviceCategory: (category: string) => void;
	setQuoteCount: (count: 1 | 2 | 3) => void;
	setQuotePosition: (position: QuotePosition) => void;
	reset: () => void;
}

const cleanOption = (value: string) => value.trim().replace(/\s+/g, ' ').slice(0, 32);
const addUnique = (items: string[], value: string) => {
	const cleaned = cleanOption(value);
	if (!cleaned || items.some(item => item.toLowerCase() === cleaned.toLowerCase())) return undefined;
	return [...items, cleaned];
};

const initialState = () => ({
	enabledQuestions: { mood: true, goals: true, advice: true, journal: true } satisfies Record<SurveyQuestionId, boolean>,
	questionOrder: ['mood', 'goals', 'advice', 'journal'] as SurveyQuestionId[],
	customGoalCategories: [] as string[],
	emotions: [...DEFAULT_SURVEY_EMOTIONS] as string[],
	adviceCategories: [...DEFAULT_ADVICE_CATEGORIES] as string[],
	quoteCount: 1 as 1 | 2 | 3,
	quotePosition: 'end' as QuotePosition,
});

/** Persisted customization for check-in/check-out content and goal taxonomy. */
export const createSurveyPreferencesSlice: ProductivitySlice<'surveyPreferences'> = (set, get) => {
	const { setSlice, getSlice } = scopeNestedSlice<ProductivityStoreState, 'surveyPreferences', SurveyPreferencesStoreState>('surveyPreferences', set, get);
	return {
		surveyPreferences: {
			...initialState(),
			setQuestionEnabled: (question, enabled) => setSlice(state => ({ enabledQuestions: { ...state.enabledQuestions, [question]: enabled } })),
			moveQuestion: (question, delta) => {
				const order = [...getSlice().questionOrder];
				const index = order.indexOf(question);
				const target = index + delta;
				if (index < 0 || target < 0 || target >= order.length) return;
				[order[index], order[target]] = [order[target], order[index]];
				setSlice({ questionOrder: order });
			},
			addGoalCategory: category => {
				const next = addUnique(getSlice().customGoalCategories, category);
				if (!next) return false;
				setSlice({ customGoalCategories: next });
				return true;
			},
			removeGoalCategory: category => setSlice(state => ({ customGoalCategories: state.customGoalCategories.filter(item => item !== category) })),
			addEmotion: emotion => {
				const next = addUnique(getSlice().emotions, emotion);
				if (!next) return false;
				setSlice({ emotions: next });
				return true;
			},
			removeEmotion: emotion => setSlice(state => ({ emotions: state.emotions.filter(item => item !== emotion) })),
			addAdviceCategory: category => {
				const next = addUnique(getSlice().adviceCategories, category);
				if (!next) return false;
				setSlice({ adviceCategories: next });
				return true;
			},
			removeAdviceCategory: category => setSlice(state => ({ adviceCategories: state.adviceCategories.filter(item => item !== category) })),
			setQuoteCount: quoteCount => setSlice({ quoteCount }),
			setQuotePosition: quotePosition => setSlice({ quotePosition }),
			reset: () => setSlice(initialState()),
		},
	};
};
