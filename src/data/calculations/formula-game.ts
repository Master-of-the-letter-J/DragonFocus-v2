import { WORLD_CONSTANTS } from '@/constants/world.constants';
import type { DragonFuryBand } from '@/types/world.types';
import { decimal, decimalMax, decimalMin, type DecimalSource } from '@/utils/decimal';

export interface PopulationProgressionOptions {
	initial: DecimalSource;
	ticks: number;
	multiplier: DecimalSource;
	growthScale?: number;
	level?: number;
	hostile?: boolean;
}

/** Returns the clamped per-tick rate from the Pt. 3.5 population curve. */
export const populationGrowthRate = (population: DecimalSource, multiplier: DecimalSource, level = 1, hostile = false) => {
	const rules = WORLD_CONSTANTS.population;
	const effectiveMultiplier = decimalMax(multiplier, 0).times(hostile ? Math.max(0, level) / 2 : 1);
	if (effectiveMultiplier.lte(0)) return decimal(0);

	const ceiling = decimal(rules.softCeiling).times(effectiveMultiplier);
	const ratio = decimalMax(population, 0).div(ceiling).pow(rules.damping);
	const raw = decimal(rules.maximumGrowthRate).minus(decimal(rules.maximumGrowthRate - rules.minimumGrowthRate).times(ratio));
	return decimalMin(rules.maximumGrowthRate, decimalMax(rules.minimumGrowthRate, raw));
};

/**
 * O(1) generalized-logistic progression. The clamp above the soft ceiling is
 * handled as an exponential tail, so multi-day offline grants do not loop per
 * tick and still match the live curve at the boundary.
 */
export const progressPopulation = ({ initial, ticks, multiplier, growthScale = 1, level = 1, hostile = false }: PopulationProgressionOptions) => {
	const start = decimalMax(initial, 0);
	const safeTicks = Math.max(0, ticks);
	if (start.eq(0) || safeTicks === 0 || growthScale === 0) return start;

	const rules = WORLD_CONSTANTS.population;
	const effectiveMultiplier = decimalMax(multiplier, 0).times(hostile ? Math.max(0, level) / 2 : 1);
	if (effectiveMultiplier.lte(0)) return start;

	const ceiling = decimal(rules.softCeiling).times(effectiveMultiplier);
	const scaledTicks = safeTicks * growthScale;
	if (start.gte(ceiling)) {
		return decimalMax(0, start.times(decimal(Math.E).pow(rules.minimumGrowthRate * scaledTicks)));
	}

	const a = rules.damping;
	const rMax = rules.maximumGrowthRate;
	const delta = rMax - rules.minimumGrowthRate;
	const y0 = start.pow(a);
	const ceilingY = ceiling.pow(a);
	const carryingY = ceilingY.times(rMax / delta);
	const b = carryingY.div(y0).minus(1);
	const lambda = a * rMax;
	const evolvedY = carryingY.div(decimal(1).plus(b.times(decimal(Math.E).pow(-lambda * scaledTicks))));
	const evolved = decimalMax(evolvedY, 0).pow(1 / a);

	if (growthScale <= 0 || evolved.lte(ceiling)) return evolved;

	const boundaryRatio = carryingY.div(ceilingY).minus(1).div(b).toNumber();
	const ticksToCeiling = -Math.log(Math.max(Number.MIN_VALUE, boundaryRatio)) / (lambda * growthScale);
	return ceiling.times(decimal(Math.E).pow(rules.minimumGrowthRate * growthScale * Math.max(0, safeTicks - ticksToCeiling)));
};

export const naturalPopulationScale = (furyBand: DragonFuryBand, demeterLevel: number, anankeActive: boolean) => {
	if (anankeActive) return 1;
	const rules = WORLD_CONSTANTS.population;
	const decline =
		furyBand === 'angry' ? rules.angryDecline
		: furyBand === 'critical' || furyBand === 'supernova' ? rules.criticalDecline
		: rules.normalDecline;
	return 1 - Math.max(0, decline - (demeterLevel > 0 ? 0.25 : 0));
};

/** Normal Plasma is the sole Armageddon prestige-power source. */
export const armageddonPower = (plasma: DecimalSource) => decimalMax(plasma, 1).pow(1 / 3);
