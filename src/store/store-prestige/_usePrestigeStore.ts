import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createArmageddonSlice } from './createArmageddonSlice';
import { createDeitySlice } from './createDeitySlice';
import { createPrestigeCoreSlice } from './createPrestigeCoreSlice';
import { createPrestigeUnlockSlice } from './createPrestigeUnlockSlice';
import { createTrascensionSlice } from './createTrascensionSlice';
import { initialPrestigeState, type ApocalypseType, type PrestigeStoreState } from './prestige.types';

export type { ApocalypseType, PrestigeStoreState } from './prestige.types';

/** Persists and composes the focused prestige slices. */
export const usePrestigeStore = create<PrestigeStoreState>()(
	persist(
		(...store) => ({
			...initialPrestigeState(),
			...createArmageddonSlice(...store),
			...createTrascensionSlice(...store),
			...createPrestigeUnlockSlice(...store),
			...createDeitySlice(...store),
			...createPrestigeCoreSlice(...store),
		}),
		{
			name: 'dragonfocus:prestige',
			storage: createJSONStorage(() => AsyncStorage),
			merge: (persisted, current) => {
				const stored = persisted as Omit<Partial<PrestigeStoreState>, 'selectedApocalypse'> & { selectedApocalypse?: ApocalypseType | 'standard' };
				return {
					...current,
					...stored,
					selectedApocalypse: stored.selectedApocalypse === 'standard' ? 'sacrifice' : (stored.selectedApocalypse ?? current.selectedApocalypse),
					completedApocalypses: [...new Set(['sacrifice' as ApocalypseType, ...(stored.completedApocalypses ?? [])])],
					apocalypseLevels: {
						...current.apocalypseLevels,
						...(stored.apocalypseLevels ?? {}),
						sacrifice: Math.max(1, stored.apocalypseLevels?.sacrifice ?? current.apocalypseLevels.sacrifice),
					},
				};
			},
		},
	),
);
