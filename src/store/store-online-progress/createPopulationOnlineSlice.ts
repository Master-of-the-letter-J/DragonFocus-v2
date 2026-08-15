import { progressPopulation } from '@/data/calculations/formula-game';
import type { DragonStage } from '@/types/world.types';
import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { useWorldStore } from '../store-world/_useWorldStore';
import type { decimal } from '@/utils/decimal';
import type { OnlineProgressSlice } from './online-progress.types';

export const dragonStageForAge = (ageDays: number): DragonStage => [...WORLD_CONSTANTS.dragonStages].reverse().find(stage => ageDays >= stage.minimumAgeDays)?.id ?? 'egg';

export const furyBandFor = (fury: ReturnType<typeof decimal>, threshold: ReturnType<typeof decimal>, max: ReturnType<typeof decimal>) =>
	fury.gt(max) ? 'supernova'
	: fury.eq(0) ? 'calm'
	: fury.lt(threshold) ? 'normal'
	: fury.lt(threshold.times(2)) ? 'angry'
	: 'critical';

export const createPopulationOnlineSlice: OnlineProgressSlice<'getFuryBand' | 'calculatePopulationProgress'> = () => ({
	getFuryBand: () => {
		const { fury, furyThreshold, maxFury } = useWorldStore.getState().resourceStore.dragon;
		return furyBandFor(fury, furyThreshold, maxFury);
	},
	calculatePopulationProgress: options => progressPopulation(options),
});
