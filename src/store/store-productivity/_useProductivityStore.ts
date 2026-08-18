import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mergePersistedNestedState } from '../nested-slice';
import { createGoalSlice, type GoalStoreState } from './createGoalSlice';
import { createPomodoroSlice, type PomodoroStoreState } from './createPomodoroSlice';
import { createProductivityActionsSlice } from './createProductivityActionsSlice';
import { createSurveySlice, type SurveyStoreState } from './createSurveySlice';
import { createSurveyPreferencesSlice, migrateSurveyPreferences, type SurveyPreferencesStoreState } from './createSurveyPreferencesSlice';

export interface ProductivityStoreState {
	goals: GoalStoreState;
	pomodoro: PomodoroStoreState;
	surveys: SurveyStoreState;
	surveyPreferences: SurveyPreferencesStoreState;
	resetProductivity: () => void;
}

export type ProductivitySlice<Keys extends keyof ProductivityStoreState> = StateCreator<ProductivityStoreState, [], [], Pick<ProductivityStoreState, Keys>>;

/** Combined productivity entry point composed from feature-owned slice creators. */
export const useProductivityStore = create<ProductivityStoreState>()(
	persist(
		(...store) => ({
			...createGoalSlice(...store),
			...createPomodoroSlice(...store),
			...createSurveySlice(...store),
			...createSurveyPreferencesSlice(...store),
			...createProductivityActionsSlice(...store),
		}),
		{
			name: 'dragonfocus:productivity',
			storage: createJSONStorage(() => AsyncStorage),
			merge: (persisted, current) => {
				const merged = mergePersistedNestedState(persisted, current, ['goals', 'pomodoro', 'surveys', 'surveyPreferences']);
				return { ...merged, surveyPreferences: migrateSurveyPreferences(merged.surveyPreferences) };
			},
		},
	),
);
