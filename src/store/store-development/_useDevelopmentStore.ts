import { create } from 'zustand';
import { createTemporaryCheatsSlice, type TemporaryCheatsState } from './createTemporaryCheatsSlice';

export interface DevelopmentStoreState {
	temporaryCheats: TemporaryCheatsState;
}

/** Non-persisted developer tooling. This store returns to defaults on reload. */
export const useDevelopmentStore = create<DevelopmentStoreState>()((...store) => ({
	...createTemporaryCheatsSlice(...store),
}));
