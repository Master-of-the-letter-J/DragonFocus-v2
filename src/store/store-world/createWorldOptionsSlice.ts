import type { AppActivity, GameMode, NexusSettingKey, NexusSettings } from '@/types/world.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useResourceStore } from './createResourceSlice';

const initialNexusSettings = (): NexusSettings => ({
	showFury: true,
	showAge: true,
	showSurveyPreviews: true,
	showGoalPreviews: true,
	showPomodoroPreview: true,
	showDragonQuotes: true,
	showSpawnNarrative: true,
});

export interface WorldOptionsStoreState {
	activity: AppActivity;
	gameMode: GameMode;
	nexusSettings: NexusSettings;
	setActivity: (activity: AppActivity) => void;
	setGameMode: (mode: GameMode) => void;
	setNexusSetting: (setting: NexusSettingKey, enabled: boolean) => void;
	reset: () => void;
}

const initialState = () => ({
	activity: 'idle' as AppActivity,
	gameMode: 'easy' as GameMode,
	nexusSettings: initialNexusSettings(),
});

/** User-controlled world settings are isolated from volatile simulation state. */
const createWorldOptionsStoreSlice: StateCreator<WorldOptionsStoreState> = (set, get) => ({
	...initialState(),
	setActivity: activity => set({ activity }),
	setGameMode: gameMode => {
		const milestoneRequired: Record<GameMode, number> = { easy: 0, invincible: 1, medium: 2, 'lock-in': 2, hard: 3, 'hard-plus': 3 };
		if (useProductionStore.getState().unlockState.milestone < milestoneRequired[gameMode]) return;
		if (get().gameMode === 'hard-plus' && useResourceStore.getState().dragon.isAlive && gameMode !== 'hard-plus' && gameMode !== 'lock-in') return;
		set({ gameMode });
	},
	setNexusSetting: (setting, enabled) => set(state => ({ nexusSettings: { ...state.nexusSettings, [setting]: enabled } })),
	reset: () => set(initialState()),
});

export const useWorldOptionsStore = create<WorldOptionsStoreState>()(persist((...store) => ({ ...createWorldOptionsStoreSlice(...store) }), { name: 'dragonfocus:world-options', storage: createJSONStorage(() => AsyncStorage) }));

/** Registers user-controlled options in the combined world store. */
export const createWorldOptionsSlice = () => ({ optionsStore: useWorldOptionsStore });
