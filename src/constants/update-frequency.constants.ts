export const PROGRESS_UPDATE_FREQUENCIES = [1, 2, 5, 10, 20, 50, 100, 1_000] as const;

export type ProgressUpdateFrequency = (typeof PROGRESS_UPDATE_FREQUENCIES)[number];

export const DEFAULT_PROGRESS_UPDATE_FREQUENCY: ProgressUpdateFrequency = 10;

export const isProgressUpdateFrequency = (value: number): value is ProgressUpdateFrequency =>
	PROGRESS_UPDATE_FREQUENCIES.some(frequency => frequency === value);
