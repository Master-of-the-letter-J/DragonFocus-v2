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
	lastNonLockInMode: GameMode;
	gameModeEndsAt?: string;
	gameModeTimerNuclear: boolean;
	gameModeReturnMode: GameMode;
	nexusSettings: NexusSettings;
	setActivity: (activity: AppActivity) => void;
	setGameMode: (mode: GameMode) => void;
	startGameModeTimer: (days: number, nuclear?: boolean) => boolean;
	stopGameModeTimer: () => boolean;
	processGameModeTimer: (now?: Date) => boolean;
	setNexusSetting: (setting: NexusSettingKey, enabled: boolean) => void;
	reset: () => void;
}

const initialState = () => ({
	activity: 'idle' as AppActivity,
	gameMode: 'easy' as GameMode,
	lastNonLockInMode: 'easy' as GameMode,
	gameModeEndsAt: undefined as string | undefined,
	gameModeTimerNuclear: false,
	gameModeReturnMode: 'medium' as GameMode,
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
				setSlice(state => ({ gameMode, lastNonLockInMode: gameMode === 'lock-in' ? state.lastNonLockInMode : gameMode }));
			},
			startGameModeTimer: (days, nuclear = false) => {
				if (!Number.isFinite(days) || days <= 0) return false;
				const durationDays = nuclear ? Math.min(7, days) : Math.min(365, days);
				const state = getSlice();
				const returnMode = state.lastNonLockInMode === 'hard-plus' ? 'hard-plus' : 'medium';
				setSlice({ gameModeEndsAt: new Date(Date.now() + durationDays * 86_400_000).toISOString(), gameModeTimerNuclear: nuclear, gameModeReturnMode: returnMode });
				return true;
			},
			stopGameModeTimer: () => {
				const state = getSlice();
				if (!state.gameModeEndsAt || (state.gameModeTimerNuclear && getRoot().resourceStore.dragon.isAlive)) return false;
				setSlice({ gameModeEndsAt: undefined, gameModeTimerNuclear: false });
				return true;
			},
			processGameModeTimer: (now = new Date()) => {
				const state = getSlice();
				if (!state.gameModeEndsAt || Date.parse(state.gameModeEndsAt) > now.getTime()) return false;
				setSlice({ gameMode: state.gameModeReturnMode, lastNonLockInMode: state.gameModeReturnMode, gameModeEndsAt: undefined, gameModeTimerNuclear: false });
				return true;
			},
			setNexusSetting: (setting, enabled) => setSlice(state => ({ nexusSettings: { ...state.nexusSettings, [setting]: enabled } })),
			reset: () => setSlice(initialState()),
		},
	};
};
