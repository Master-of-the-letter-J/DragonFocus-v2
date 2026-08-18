import type { StateCreator } from 'zustand';
import type { DevelopmentStoreState } from './_useDevelopmentStore';

export interface TemporaryCheatsState {
	enabled: boolean;
	crimsonHeartOnAppPercent?: number;
	setEnabled: (enabled: boolean) => void;
	setCrimsonHeartOnAppPercent: (percent: number) => void;
	reset: () => void;
}

export type DevelopmentSlice<Key extends keyof DevelopmentStoreState> = StateCreator<DevelopmentStoreState, [], [], Pick<DevelopmentStoreState, Key>>;

const initialState = () => ({ enabled: false, crimsonHeartOnAppPercent: undefined as number | undefined });

/** Ephemeral development overrides. Nothing in this slice is persisted. */
export const createTemporaryCheatsSlice: DevelopmentSlice<'temporaryCheats'> = set => ({
	temporaryCheats: {
		...initialState(),
		setEnabled: enabled => set(state => ({ temporaryCheats: { ...state.temporaryCheats, enabled } })),
		setCrimsonHeartOnAppPercent: percent => set(state => ({ temporaryCheats: { ...state.temporaryCheats, crimsonHeartOnAppPercent: Number.isFinite(percent) ? Math.max(0, percent) : undefined } })),
		reset: () => set(state => ({ temporaryCheats: { ...state.temporaryCheats, ...initialState() } })),
	},
});
