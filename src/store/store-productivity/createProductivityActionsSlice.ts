import type { ProductivitySlice } from './_useProductivityStore';
import { useGoalStore } from './createGoalSlice';
import { usePomodoroStore } from './createPomodoroSlice';
import { useSurveyStore } from './createSurveySlice';

export const createProductivityActionsSlice: ProductivitySlice<'resetProductivity'> = () => ({
	resetProductivity: () => {
		useGoalStore.getState().reset();
		useSurveyStore.getState().reset();
		usePomodoroStore.getState().reset();
	},
});
