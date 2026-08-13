import type { NumberFormatStyle } from '@/utils/number-abbreviation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProductionStore } from './store-production/_useProductionStore';
import { useProductivityStore } from './store-productivity/_useProductivityStore';
import { useWorldStore } from './store-world/_useWorldStore';
import { usePrestigeStore } from './store-prestige/_usePrestigeStore';
import { useProductionSpecial } from './store-production-special/_useProductionSpecialStore';
import { useOffline } from './store-offline-progress/_useOfflineProgressStore';
import { useOnlineProgressStore } from './store-online-progress/_useOnlineProgressStore';
import { useStatsStore } from './useStatsStore';
import { usePremiumStore } from './store-premium/_usePremiumStore';

/**
 * A single discoverability point for every game slice. Each member remains its
 * own Zustand store so updates stay scoped to the feature that changed.
 */
export const appStoreSlices = {
	world: useWorldStore,
	prestige: usePrestigeStore,
	production: useProductionStore,
	productionSpecial: useProductionSpecial,
	productivity: useProductivityStore,
	offline: useOffline,
	online: useOnlineProgressStore,
	stats: useStatsStore,
	premium: usePremiumStore,
} as const;

export type AppStoreSlices = typeof appStoreSlices;

export interface AppStoreState {
	version: 4;
	hasEntered: boolean;
	startedAt?: string;
	theme: 'system' | 'light' | 'dark';
	autoHarvest: boolean;
	soundEffectsVolume: number;
	musicVolume: number;
	brightness: number;
	requireDailyCheckIn: boolean;
	reverseItemLayout: boolean;
	numberFormat: NumberFormatStyle;
	lastOpenedAt: string;
	slices: AppStoreSlices;
	setTheme: (theme: AppStoreState['theme']) => void;
	setAutoHarvest: (enabled: boolean) => void;
	setSoundEffectsVolume: (volume: number) => void;
	setMusicVolume: (volume: number) => void;
	setBrightness: (brightness: number) => void;
	setRequireDailyCheckIn: (required: boolean) => void;
	setReverseItemLayout: (reversed: boolean) => void;
	setNumberFormat: (format: NumberFormatStyle) => void;
	markOpened: () => void;
	startGame: () => void;
	resetEverything: () => Promise<void>;
}

const storageKeys = [
	'dragonfocus:app',
	'dragonfocus:resources',
	'dragonfocus:production',
	'dragonfocus:monuments',
	'dragonfocus:goal-multipliers',
	'dragonfocus:goals',
	'dragonfocus:surveys',
	'dragonfocus:pomodoro',
	'dragonfocus:offline',
	'dragonfocus:online-progress',
	'dragonfocus:world',
	'dragonfocus:world-options',
	'dragonfocus:world-state',
	'dragonfocus:dragon',
	'dragonfocus:prestige',
	'dragonfocus:crimson-heart',
	'dragonfocus:convertor',
	'dragonfocus:spells',
	'dragonfocus:black-market',
	'dragonfocus:population',
	'dragonfocus:stats',
	'dragonfocus:premium',
];

type AppSlice<Keys extends keyof AppStoreState> = StateCreator<AppStoreState, [], [], Pick<AppStoreState, Keys>>;

const createAppPreferencesSlice: AppSlice<
	| 'version'
	| 'hasEntered'
	| 'startedAt'
	| 'theme'
	| 'autoHarvest'
	| 'soundEffectsVolume'
	| 'musicVolume'
	| 'brightness'
	| 'requireDailyCheckIn'
	| 'reverseItemLayout'
	| 'numberFormat'
	| 'lastOpenedAt'
	| 'slices'
	| 'setTheme'
	| 'setAutoHarvest'
	| 'setSoundEffectsVolume'
	| 'setMusicVolume'
	| 'setBrightness'
	| 'setRequireDailyCheckIn'
	| 'setReverseItemLayout'
	| 'setNumberFormat'
	| 'markOpened'
	| 'startGame'
> = set => ({
	version: 4,
	hasEntered: false,
	startedAt: undefined,
	theme: 'system',
	autoHarvest: false,
	soundEffectsVolume: 0.8,
	musicVolume: 0.5,
	brightness: 1,
	requireDailyCheckIn: true,
	reverseItemLayout: false,
	numberFormat: 'short',
	lastOpenedAt: new Date().toISOString(),
	slices: appStoreSlices,
	setTheme: theme => set({ theme }),
	setAutoHarvest: autoHarvest => set({ autoHarvest }),
	setSoundEffectsVolume: soundEffectsVolume => set({ soundEffectsVolume: Math.max(0, Math.min(1, soundEffectsVolume)) }),
	setMusicVolume: musicVolume => set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
	setBrightness: brightness => set({ brightness: Math.max(0.5, Math.min(1.2, brightness)) }),
	setRequireDailyCheckIn: requireDailyCheckIn => set({ requireDailyCheckIn }),
	setReverseItemLayout: reverseItemLayout => set({ reverseItemLayout }),
	setNumberFormat: numberFormat => set({ numberFormat }),
	markOpened: () => set({ lastOpenedAt: new Date().toISOString() }),
	startGame: () => {
		const now = new Date().toISOString();
		if (!useWorldStore.getState().dragonStore.getState().dragonSpawned) {
			useWorldStore.getState().dragonStore.getState().spawnDragon();
		}
		set(state => ({ hasEntered: true, startedAt: state.startedAt ?? now, lastOpenedAt: now }));
	},
});

const createAppResetSlice: AppSlice<'resetEverything'> = set => ({
	resetEverything: async () => {
		useProductivityStore.getState().resetProductivity();
		useProductionStore.getState().reset();
		useProductionSpecial.getState().resetProductionSpecial();
		useWorldStore.getState().reset();
		usePrestigeStore.getState().reset();
		useOffline.getState().reset();
		useOnlineProgressStore.getState().reset();
		useStatsStore.getState().reset();
		usePremiumStore.getState().reset();
		await AsyncStorage.multiRemove(storageKeys);
		set({ version: 4, hasEntered: false, startedAt: undefined, theme: 'system', autoHarvest: false, soundEffectsVolume: 0.8, musicVolume: 0.5, brightness: 1, requireDailyCheckIn: true, reverseItemLayout: false, numberFormat: 'short', lastOpenedAt: new Date().toISOString() });
	},
});

export const useAppStore = create<AppStoreState>()(
	persist(
		(...store) => ({
			...createAppPreferencesSlice(...store),
			...createAppResetSlice(...store),
		}),
		{ name: 'dragonfocus:app', storage: createJSONStorage(() => AsyncStorage) },
	),
);
