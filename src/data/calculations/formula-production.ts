import { decimal } from '@/utils/decimal';
import type { ExponentialGrowth } from '@/types/production.types';

export interface MilestoneGrowthConfig {
	start?: number;
	repeatEvery: number;
	multiplier: number;
	repeatMaxTimes?: number;
}

/** Calculates a single exponential value: base times growthFactor^amount. */
export const calculateExponentialGrowth = (growth: ExponentialGrowth, amount: number) => decimal(growth.base).times(decimal(growth.growthFactor).pow(Math.max(0, Math.floor(amount))));

/** Combines milestone effects without duplicating threshold arithmetic in stores. */
export const calculateMilestoneGrowth = (amount: number, milestones: readonly MilestoneGrowthConfig[]) =>
	milestones.reduce((total, milestone) => {
		const start = milestone.start ?? 0;
		// Reaching the threshold grants the first bonus; later bonuses repeat at the
		// configured interval. A 100 / 25 milestone applies at 100, 125, 150, etc.
		const repeats = amount < start ? 0 : Math.floor((amount - start) / milestone.repeatEvery) + 1;
		const cappedRepeats = milestone.repeatMaxTimes === undefined ? repeats : Math.min(repeats, milestone.repeatMaxTimes);
		return total.times(calculateExponentialGrowth({ base: 1, growthFactor: milestone.multiplier }, cappedRepeats));
	}, decimal(1));

/** Adds the consecutive growth costs required to buy multiple levels at once. */
export const calculateGeometricCost = (growth: ExponentialGrowth, owned: number, quantity: number) => {
	const safeQuantity = Math.max(1, Math.floor(quantity));
	if (growth.growthMode === 'linear') {
		const firstLevel = Math.max(0, Math.floor(owned));
		return decimal(growth.base).times(safeQuantity).times(firstLevel + (safeQuantity - 1) / 2);
	}
	const growthFactor = decimal(growth.growthFactor);
	if (growthFactor.eq(1)) return decimal(growth.base).times(safeQuantity);

	return calculateExponentialGrowth(growth, owned).times(growthFactor.pow(safeQuantity).minus(1)).div(growthFactor.minus(1));
};
