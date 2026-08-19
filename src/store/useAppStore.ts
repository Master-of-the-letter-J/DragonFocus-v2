import type { NumberFormatStyle } from '@/utils/number-abbreviation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProductionStore } from './store-production/_useProductionStore';
import { useProductivityStore } from './store-productivity/_useProductivityStore';
import { useWorldStore } from './store-world/_useWorldStore';
import { usePrestigeStore } from './store-prestige/_usePrestigeStore';
import { useProductionSpecialStore } from './store-production-special/_useProductionSpecialStore';
import { useOfflineProgressStore } from './store-offline-progress/_useOfflineProgressStore';
import { useOnlineProgressStore } from './store-online-progress/_useOnlineProgressStore';
import { useStatsStore } from './useStatsStore';
import { usePremiumStore } from './store-premium/_usePremiumStore';
import { useDevelopmentStore } from './store-development/_useDevelopmentStore';
import { DEFAULT_PROGRESS_UPDATE_FREQUENCY, isProgressUpdateFrequency, type ProgressUpdateFrequency } from '@/constants/update-frequency.constants';

/**
 * A single discoverability point for each domain-level Zustand store.
 */
export const appStoreSlices = {
	world: useWorldStore,
	prestige: usePrestigeStore,
	production: useProductionStore,
	productionSpecial: useProductionSpecialStore,
	productivity: useProductivityStore,
	offline: useOfflineProgressStore,
	online: useOnlineProgressStore,
	stats: useStatsStore,
	premium: usePremiumStore,
} as const;

export type AppStoreSlices = typeof appStoreSlices;

export interface AppStoreState {
	version: 5;
	hasEntered: boolean;
	startedAt?: string;
	theme: 'system' | 'light' | 'dark';
	autoHarvest: boolean;
	soundEffectsVolume: number;
	musicVolume: number;
	brightness: number;
	progressUpdateFrequencyHz: ProgressUpdateFrequency;
	requireDailyCheckIn: boolean;
	requireDailyCheckOut: boolean;
	reverseItemLayout: boolean;
	secondaryPanelLayout: 'horizontal' | 'vertical';
	showNewsBar: boolean;
	backgroundStyle: 'nexus' | 'ember' | 'void';
	dragonCosmetic: 'classic' | 'ember' | 'astral';
	weatherEffects: { rain: boolean; tremors: boolean; brightness: boolean };
	noSpritesMode: boolean;
	numberFormat: NumberFormatStyle;
	lastOpenedAt: string;
	seenGovernmentLogIds: string[];
	pageUnlockNoticesInitialized: boolean;
	seenPageUnlockNoticeIds: string[];
	slices: AppStoreSlices;
	setTheme: (theme: AppStoreState['theme']) => void;
	setAutoHarvest: (enabled: boolean) => void;
	setSoundEffectsVolume: (volume: number) => void;
	setMusicVolume: (volume: number) => void;
	setBrightness: (brightness: number) => void;
	setProgressUpdateFrequency: (frequency: ProgressUpdateFrequency) => void;
	setRequireDailyCheckIn: (required: boolean) => void;
	setRequireDailyCheckOut: (required: boolean) => void;
	setReverseItemLayout: (reversed: boolean) => void;
	setSecondaryPanelLayout: (layout: AppStoreState['secondaryPanelLayout']) => void;
	setShowNewsBar: (enabled: boolean) => void;
	setBackgroundStyle: (background: AppStoreState['backgroundStyle']) => void;
	setDragonCosmetic: (cosmetic: AppStoreState['dragonCosmetic']) => void;
	setWeatherEffect: (effect: keyof AppStoreState['weatherEffects'], enabled: boolean) => void;
	setNoSpritesMode: (enabled: boolean) => void;
	setNumberFormat: (format: NumberFormatStyle) => void;
	markOpened: () => void;
	dismissGovernmentLog: (id: string) => void;
	initializePageUnlockNotices: (unlockedIds: readonly string[]) => void;
	dismissPageUnlockNotice: (id: string) => void;
	startGame: () => void;
	resetEverything: () => Promise<void>;
}

const storageKeys = [
	'dragonfocus:app',
	'dragonfocus:resources',
	'dragonfocus:production',
	'dragonfocus:production-special',
	'dragonfocus:productivity',
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
	| 'progressUpdateFrequencyHz'
	| 'requireDailyCheckIn'
	| 'requireDailyCheckOut'
	| 'reverseItemLayout'
	| 'secondaryPanelLayout'
	| 'showNewsBar'
	| 'backgroundStyle'
	| 'dragonCosmetic'
	| 'weatherEffects'
	| 'noSpritesMode'
	| 'numberFormat'
	| 'lastOpenedAt'
	| 'seenGovernmentLogIds'
	| 'pageUnlockNoticesInitialized'
	| 'seenPageUnlockNoticeIds'
	| 'slices'
	| 'setTheme'
	| 'setAutoHarvest'
	| 'setSoundEffectsVolume'
	| 'setMusicVolume'
	| 'setBrightness'
	| 'setProgressUpdateFrequency'
	| 'setRequireDailyCheckIn'
	| 'setRequireDailyCheckOut'
	| 'setReverseItemLayout'
	| 'setSecondaryPanelLayout'
	| 'setShowNewsBar'
	| 'setBackgroundStyle'
	| 'setDragonCosmetic'
	| 'setWeatherEffect'
	| 'setNoSpritesMode'
	| 'setNumberFormat'
	| 'markOpened'
	| 'dismissGovernmentLog'
	| 'initializePageUnlockNotices'
	| 'dismissPageUnlockNotice'
	| 'startGame'
> = set => ({
	version: 5,
	hasEntered: false,
	startedAt: undefined,
	theme: 'system',
	autoHarvest: false,
	soundEffectsVolume: 0.8,
	musicVolume: 0.5,
	brightness: 1,
	progressUpdateFrequencyHz: DEFAULT_PROGRESS_UPDATE_FREQUENCY,
	requireDailyCheckIn: true,
	requireDailyCheckOut: false,
	reverseItemLayout: false,
	secondaryPanelLayout: 'horizontal',
	showNewsBar: true,
	backgroundStyle: 'nexus',
	dragonCosmetic: 'classic',
	weatherEffects: { rain: false, tremors: false, brightness: false },
	noSpritesMode: false,
	numberFormat: 'expanded-short',
	lastOpenedAt: new Date().toISOString(),
	seenGovernmentLogIds: [],
	pageUnlockNoticesInitialized: false,
	seenPageUnlockNoticeIds: [],
	slices: appStoreSlices,
	setTheme: theme => set({ theme }),
	setAutoHarvest: autoHarvest => set({ autoHarvest }),
	setSoundEffectsVolume: soundEffectsVolume => set({ soundEffectsVolume: Math.max(0, Math.min(1, soundEffectsVolume)) }),
	setMusicVolume: musicVolume => set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
	setBrightness: brightness => set({ brightness: Math.max(0.5, Math.min(1.2, brightness)) }),
	setProgressUpdateFrequency: progressUpdateFrequencyHz => {
		if (isProgressUpdateFrequency(progressUpdateFrequencyHz)) set({ progressUpdateFrequencyHz });
	},
	setRequireDailyCheckIn: requireDailyCheckIn => set({ requireDailyCheckIn }),
	setRequireDailyCheckOut: requireDailyCheckOut => set({ requireDailyCheckOut }),
	setReverseItemLayout: reverseItemLayout => set({ reverseItemLayout }),
	setSecondaryPanelLayout: secondaryPanelLayout => set({ secondaryPanelLayout }),
	setShowNewsBar: showNewsBar => set({ showNewsBar }),
	setBackgroundStyle: backgroundStyle => set({ backgroundStyle }),
	setDragonCosmetic: dragonCosmetic => set({ dragonCosmetic }),
	setWeatherEffect: (effect, enabled) => set(state => ({ weatherEffects: { ...state.weatherEffects, [effect]: enabled } })),
	setNoSpritesMode: noSpritesMode => set({ noSpritesMode }),
	setNumberFormat: numberFormat => set({ numberFormat }),
	markOpened: () => set({ lastOpenedAt: new Date().toISOString() }),
	dismissGovernmentLog: id => set(state => ({ seenGovernmentLogIds: [...new Set([...state.seenGovernmentLogIds, id])] })),
	initializePageUnlockNotices: unlockedIds => set(state => state.pageUnlockNoticesInitialized ? state : ({ pageUnlockNoticesInitialized: true, seenPageUnlockNoticeIds: [...new Set(unlockedIds)] })),
	dismissPageUnlockNotice: id => set(state => ({ seenPageUnlockNoticeIds: [...new Set([...state.seenPageUnlockNoticeIds, id])] })),
	startGame: () => {
		const now = new Date().toISOString();
		set(state => ({ hasEntered: true, startedAt: state.startedAt ?? now, lastOpenedAt: now }));
	},
});

const createAppResetSlice: AppSlice<'resetEverything'> = set => ({
	resetEverything: async () => {
		useProductivityStore.getState().resetProductivity();
		useProductionStore.getState().reset();
		useProductionSpecialStore.getState().resetProductionSpecial();
		useWorldStore.getState().reset();
		usePrestigeStore.getState().reset();
		useOfflineProgressStore.getState().reset();
		useOnlineProgressStore.getState().reset();
		useStatsStore.getState().reset();
		usePremiumStore.getState().reset();
		useDevelopmentStore.getState().temporaryCheats.reset();
		await AsyncStorage.multiRemove(storageKeys);
		set({ version: 5, hasEntered: false, startedAt: undefined, theme: 'system', autoHarvest: false, soundEffectsVolume: 0.8, musicVolume: 0.5, brightness: 1, progressUpdateFrequencyHz: DEFAULT_PROGRESS_UPDATE_FREQUENCY, requireDailyCheckIn: true, requireDailyCheckOut: false, reverseItemLayout: false, secondaryPanelLayout: 'horizontal', showNewsBar: true, backgroundStyle: 'nexus', dragonCosmetic: 'classic', weatherEffects: { rain: false, tremors: false, brightness: false }, noSpritesMode: false, numberFormat: 'expanded-short', lastOpenedAt: new Date().toISOString(), seenGovernmentLogIds: [], pageUnlockNoticesInitialized: false, seenPageUnlockNoticeIds: [] });
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
