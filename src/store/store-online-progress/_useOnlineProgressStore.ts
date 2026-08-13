import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createEnergyOnlineSlice } from './createEnergyOnlineSlice';
import { createOnlineTickSlice } from './createOnlineTickSlice';
import { createPopulationOnlineSlice } from './createPopulationOnlineSlice';
import { initialOnlineProgressState, type OnlineProgressStoreState } from './online-progress.types';

export type { OnlineProgressStoreState } from './online-progress.types';

/** Canonical progression engine for live ticks and closed-form offline intervals. */
export const useOnlineProgressStore = create<OnlineProgressStoreState>()(
	persist(
		(...store) => ({
			...initialOnlineProgressState(),
			...createEnergyOnlineSlice(...store),
			...createPopulationOnlineSlice(...store),
			...createOnlineTickSlice(...store),
		}),
		{
			name: 'dragonfocus:online-progress',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({ lastTickAt: state.lastTickAt }),
		},
	),
);
