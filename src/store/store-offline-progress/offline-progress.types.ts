import type { AppActivity } from '@/types/world.types';
import type { StateCreator } from 'zustand';

export type AppBlockingMode = 'disabled' | 'on-limit' | 'always-on-blocked-app';

export interface OfflineProgress {
	offAppSeconds: number;
	allowedAppSeconds: number;
	blockedAppSeconds: number;
	totalSeconds: number;
	rewardSpellCount: number;
}

export interface OfflineProgressSegment {
	activity: Extract<AppActivity, 'off-app' | 'allowed-app' | 'blocked-app'>;
	seconds: number;
}

export interface OfflineProgressStoreState {
	appBlockingMode: AppBlockingMode;
	blockedApps: string[];
	allowedAppSeconds: number;
	blockedAppSeconds: number;
	offAppSeconds: number;
	activeBoostIds: string[];
	unlockedOfflineBoostSlots: number;
	lastBackgroundAt?: string;
	offlineRewardSeconds: number;
	offlineRewardWeeks: number;
	setAppBlockingMode: (mode: AppBlockingMode, hardMode?: boolean) => boolean;
	setBlockedApps: (apps: string[]) => void;
	setOfflineBoosts: (boostIds: string[]) => void;
	purchaseOfflineBoostSlot: () => boolean;
	markBackgrounded: (timestamp?: Date) => void;
	recordUsage: (kind: 'allowed' | 'blocked' | 'off-app', seconds: number) => void;
	consumeProgress: () => OfflineProgress;
	getEnergyOfflineSegments: (progress: OfflineProgress) => readonly OfflineProgressSegment[];
	getPopulationOfflineSegments: (progress: OfflineProgress) => readonly OfflineProgressSegment[];
	reset: () => void;
}

export type OfflineProgressSlice<Keys extends keyof OfflineProgressStoreState> = StateCreator<OfflineProgressStoreState, [], [], Pick<OfflineProgressStoreState, Keys>>;

export const initialOfflineProgressState = () => ({
	appBlockingMode: 'disabled' as AppBlockingMode,
	blockedApps: [] as string[],
	allowedAppSeconds: 0,
	blockedAppSeconds: 0,
	offAppSeconds: 0,
	activeBoostIds: [] as string[],
	unlockedOfflineBoostSlots: 0,
	lastBackgroundAt: undefined as string | undefined,
	offlineRewardSeconds: 0,
	offlineRewardWeeks: 0,
});
