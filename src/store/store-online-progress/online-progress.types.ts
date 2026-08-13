import type { PopulationProgressionOptions } from '@/data/calculations/formula-game';
import type { AppActivity, DragonFuryBand } from '@/types/world.types';
import type { decimal } from '@/utils/decimal';
import type { StateCreator } from 'zustand';

export interface OnlineProgressStoreState {
	lastTickAt?: string;
	getFuryBand: () => DragonFuryBand;
	calculateProducerEnergy: (seconds: number, heartMultiplier: number, activity: AppActivity) => ReturnType<typeof decimal>;
	calculateAmplification: () => ReturnType<typeof decimal>;
	calculateOtherEnergyMultipliers: () => ReturnType<typeof decimal>;
	calculatePopulationProgress: (options: PopulationProgressionOptions) => ReturnType<typeof decimal>;
	tickWorld: (seconds?: number) => void;
	giveOfflineProgress: () => number;
	reset: () => void;
}

export type OnlineProgressSlice<Keys extends keyof OnlineProgressStoreState> = StateCreator<OnlineProgressStoreState, [], [], Pick<OnlineProgressStoreState, Keys>>;

export const initialOnlineProgressState = () => ({ lastTickAt: undefined as string | undefined });
