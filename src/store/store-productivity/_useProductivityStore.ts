import { create, type StateCreator } from 'zustand';
import { createGoalSlice, useGoalStore } from './createGoalSlice';
import { createPomodoroSlice, usePomodoroStore } from './createPomodoroSlice';
import { createProductivityActionsSlice } from './createProductivityActionsSlice';
import { createSurveySlice, useSurveyStore } from './createSurveySlice';

export interface ProductivityStoreState {
	goals: typeof useGoalStore;
	pomodoro: typeof usePomodoroStore;
	surveys: typeof useSurveyStore;
	resetProductivity: () => void;
}

export type ProductivitySlice<Keys extends keyof ProductivityStoreState> = StateCreator<ProductivityStoreState, [], [], Pick<ProductivityStoreState, Keys>>;

/** Combined productivity entry point composed from feature-owned slice creators. */
export const useProductivityStore = create<ProductivityStoreState>()((...store) => ({
	...createGoalSlice(...store),
	...createPomodoroSlice(...store),
	...createSurveySlice(...store),
	...createProductivityActionsSlice(...store),
}));
