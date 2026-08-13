import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createEnergyOfflineSlice } from './createEnergyOfflineSlice';
import { createOfflineSessionSlice } from './createOfflineSessionSlice';
import { createPopulationOfflineSlice } from './createPopulationOfflineSlice';
import { initialOfflineProgressState, type OfflineProgressStoreState } from './offline-progress.types';

export type { AppBlockingMode, OfflineProgress, OfflineProgressStoreState, OfflineProgressSegment } from './offline-progress.types';

export const useOffline = create<OfflineProgressStoreState>()(
	persist(
		(...store) => ({
			...initialOfflineProgressState(),
			...createOfflineSessionSlice(...store),
			...createEnergyOfflineSlice(...store),
			...createPopulationOfflineSlice(...store),
		}),
		{ name: 'dragonfocus:offline', storage: createJSONStorage(() => AsyncStorage) },
	),
);
