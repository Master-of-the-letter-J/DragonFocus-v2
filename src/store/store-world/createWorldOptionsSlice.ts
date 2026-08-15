import type { AppActivity, GameMode, NexusSettingKey, NexusSettings } from '@/types/world.types';
import { useProductionStore } from '../store-production/_useProductionStore';
import { scopeNestedSlice } from '../nested-slice';
import type { WorldSlice, WorldStoreState } from './_useWorldStore';

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
export const createWorldOptionsSlice: WorldSlice<'optionsStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<WorldStoreState, 'optionsStore', WorldOptionsStoreState>('optionsStore', set, get);

	return {
		optionsStore: {
			...initialState(),
			setActivity: activity => setSlice({ activity }),
			setGameMode: gameMode => {
				const milestoneRequired: Record<GameMode, number> = { easy: 0, invincible: 1, medium: 2, 'lock-in': 2, hard: 3, 'hard-plus': 3 };
				if (useProductionStore.getState().unlockState.milestone < milestoneRequired[gameMode]) return;
				if (getSlice().gameMode === 'hard-plus' && getRoot().resourceStore.dragon.isAlive && gameMode !== 'hard-plus' && gameMode !== 'lock-in') return;
				setSlice({ gameMode });
			},
			setNexusSetting: (setting, enabled) => setSlice(state => ({ nexusSettings: { ...state.nexusSettings, [setting]: enabled } })),
			reset: () => setSlice(initialState()),
		},
	};
};
