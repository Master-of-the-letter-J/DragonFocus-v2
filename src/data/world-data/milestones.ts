import { decimal, type DecimalSource } from '@/utils/decimal';

export interface MilestoneDefinition {
	id: number;
	energy: string;
	shards: number;
}

const earlyThresholds: readonly [number, DecimalSource][] = [
	[0, 0],
	[0.25, 50],
	[0.5, 100],
	[0.75, 250],
	[1, '1e3'],
	[2, '1e4'],
	[3, '1e5'],
	[4, '1e6'],
	[5, '1e8'],
	[6, '1e10'],
	[7, '1e12'],
	[8, '1e15'],
	[9, '1e18'],
	[10, '1e21'],
];

/** Human-readable names for the fractional opening milestones. */
export const milestoneLabel = (milestone: number) =>
	milestone === 0.25 ? '1/4'
	: milestone === 0.5 ? '1/2'
	: milestone === 0.75 ? '3/4'
	: `${milestone}`;

/**
 * Post-M10 pacing deliberately changes by era: x100 through M20, x1000
 * through M35, then x10,000. This removes the old blanket x1000 curve and
 * lines the major unlocks up with the three late amplifier phases.
 */
const exponentForLateMilestone = (milestone: number) => {
	if (milestone <= 20) return 21 + (milestone - 10) * 2;
	if (milestone <= 35) return 41 + (milestone - 20) * 3;
	return 86 + (milestone - 35) * 4;
};

const shardReward = (milestone: number) => {
	if (milestone === 10) return 128;
	if (milestone === 20 || milestone === 30) return 256;
	return milestone > 10 ? 32 : Math.min(64, 2 ** Math.floor(milestone));
};

export const MILESTONES: readonly MilestoneDefinition[] = [
	...earlyThresholds.map(([id, energy]) => ({ id, energy: decimal(energy).toString(), shards: id < 1 ? 5 : shardReward(id) })),
	...Array.from({ length: 40 }, (_, index) => {
		const id = index + 11;
		return { id, energy: `1e${exponentForLateMilestone(id)}`, shards: shardReward(id) };
	}),
];

export const milestoneForEnergy = (totalEnergy: DecimalSource) => {
	const energy = decimal(totalEnergy);
	return [...MILESTONES].reverse().find(milestone => energy.gte(milestone.energy))?.id ?? 0;
};
