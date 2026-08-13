import { initialOfflineProgressState, type OfflineProgress, type OfflineProgressSlice } from './offline-progress.types';

const WEEK_SECONDS = 7 * 86_400;

const calculateOfflineProgress = (offAppSeconds: number, allowedAppSeconds: number, blockedAppSeconds: number, rewardSpellCount = 0): OfflineProgress => ({
	offAppSeconds: Math.max(0, offAppSeconds),
	allowedAppSeconds: Math.max(0, allowedAppSeconds),
	blockedAppSeconds: Math.max(0, blockedAppSeconds),
	totalSeconds: Math.max(0, offAppSeconds) + Math.max(0, allowedAppSeconds) + Math.max(0, blockedAppSeconds),
	rewardSpellCount,
});

/** Weekly spell rewards are summed algebraically, so any offline duration stays O(1). */
const rewardSpellsForWeeks = (startingWeek: number, completedWeeks: number) => {
	if (completedWeeks <= 0) return 0;
	const firstWeekBonus = startingWeek === 0 ? 2 : 0;
	const secondWeekBonus = startingWeek <= 1 && startingWeek + completedWeeks > 1 ? 1 : 0;
	return completedWeeks + firstWeekBonus + secondWeekBonus;
};

export const createOfflineSessionSlice: OfflineProgressSlice<'setAppBlockingMode' | 'setBlockedApps' | 'setOfflineBoosts' | 'markBackgrounded' | 'recordUsage' | 'consumeProgress' | 'reset'> = (set, get) => ({
	setAppBlockingMode: (mode, hardMode = false) => {
		if (hardMode && mode === 'disabled') return false;
		set({ appBlockingMode: mode });
		return true;
	},
	setBlockedApps: apps => set({ blockedApps: [...new Set(apps.map(app => app.trim()).filter(Boolean))] }),
	setOfflineBoosts: boostIds => set({ activeBoostIds: [...new Set(boostIds)] }),
	markBackgrounded: (timestamp = new Date()) => set({ lastBackgroundAt: timestamp.toISOString() }),
	recordUsage: (kind, seconds) => {
		if (!Number.isFinite(seconds) || seconds <= 0) return;
		set(state =>
			kind === 'allowed' ? { allowedAppSeconds: state.allowedAppSeconds + seconds }
			: kind === 'blocked' ? { blockedAppSeconds: state.blockedAppSeconds + seconds }
			: { offAppSeconds: state.offAppSeconds + seconds },
		);
	},
	consumeProgress: () => {
		const state = get();
		const backgroundSeconds = state.lastBackgroundAt ? Math.max(0, (Date.now() - Date.parse(state.lastBackgroundAt)) / 1_000) : 0;
		const offAppSeconds = state.offAppSeconds + backgroundSeconds;
		const rewardSeconds = state.offlineRewardSeconds + offAppSeconds + state.allowedAppSeconds;
		const newlyCompletedWeeks = Math.floor(rewardSeconds / WEEK_SECONDS);
		const progress = calculateOfflineProgress(offAppSeconds, state.allowedAppSeconds, state.blockedAppSeconds, rewardSpellsForWeeks(state.offlineRewardWeeks, newlyCompletedWeeks));
		set({
			allowedAppSeconds: 0,
			blockedAppSeconds: 0,
			offAppSeconds: 0,
			lastBackgroundAt: undefined,
			offlineRewardSeconds: rewardSeconds % WEEK_SECONDS,
			offlineRewardWeeks: state.offlineRewardWeeks + newlyCompletedWeeks,
		});
		return progress;
	},
	reset: () => set(initialOfflineProgressState()),
});
