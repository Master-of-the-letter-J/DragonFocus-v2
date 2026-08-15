import type { ProductivitySlice } from './_useProductivityStore';

export const createProductivityActionsSlice: ProductivitySlice<'resetProductivity'> = (_set, get) => ({
	resetProductivity: () => {
		get().goals.reset();
		get().surveys.reset();
		get().pomodoro.reset();
	},
});
