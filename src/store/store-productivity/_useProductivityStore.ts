import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mergePersistedNestedState } from '../nested-slice';
import { createGoalSlice, type GoalStoreState } from './createGoalSlice';
import { createPomodoroSlice, type PomodoroStoreState } from './createPomodoroSlice';
import { createProductivityActionsSlice } from './createProductivityActionsSlice';
import { createSurveySlice, type SurveyStoreState } from './createSurveySlice';

export interface ProductivityStoreState {
	goals: GoalStoreState;
	pomodoro: PomodoroStoreState;
	surveys: SurveyStoreState;
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
			...createProductivityActionsSlice(...store),
		}),
		{
			name: 'dragonfocus:productivity',
			storage: createJSONStorage(() => AsyncStorage),
			merge: (persisted, current) => mergePersistedNestedState(persisted, current, ['goals', 'pomodoro', 'surveys']),
		},
	),
);
