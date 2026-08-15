import { calculateMilestoneGrowth } from '@/data/calculations/formula-production';
import { AMPLIFIERS, PRODUCERS } from '@/data/production-data';
import { decimal, decimalMax } from '@/utils/decimal';
import { getDeityLevels, useProductionStore } from '../store-production/_useProductionStore';
import { useProductivityStore } from '../store-productivity/_useProductivityStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useStatsStore } from '../useStatsStore';
import { usePrestigeStore } from '../store-prestige/_usePrestigeStore';
import { activeStreakCount, onlineLog10 } from './online-progress.formulas';
import type { OnlineProgressSlice } from './online-progress.types';

const pantheonMemberCount = (levels: Record<string, number>) => Object.values(getDeityLevels(levels)).filter(level => level > 0).length;

const producerStatistic = (producerId: string, levels: Record<string, number>, completedGoals: number, pomodoroSeconds: number) => {
	const resources = useWorldStore.getState().resourceStore.resources;
	const { surveys, pomodoro } = useProductivityStore.getState();
	switch (producerId) {
		case 'solar-panel':
			return decimal(surveys.checkInStreak);
		case 'lunar-panel':
			return decimal(surveys.checkOutStreak);
		case 'wind-turbine':
			return decimal(pomodoro.pomodoroHabitStreak);
		case 'crimson-thermal-plant':
			return decimal(activeStreakCount());
		case 'hydro-dam':
			return decimal(completedGoals);
		case 'bio-reactor':
			return decimal(Math.max(0, decimalMax(resources.population, 1).div(1_000_000_000).log10()));
		case 'energy-donation-center':
			return decimalMax(useWorldStore.getState().resourceStore.dragon.furyThreshold.minus(resources.fury), 0);
		case 'dark-nuclear-power-plant':
			return resources.darkEnergy;
		case 'lightning-rod':
			return decimal(pomodoro.elapsedSeconds);
		case 'time-machine':
			return decimal(pomodoroSeconds);
		case 'plasma-accelerator':
			return resources.plasma;
		case 'void-cortex':
			return decimalMax(useStatsStore.getState().bestResources.energy, 1).div(decimalMax(resources.energy, 1)).max(1).sqrt().min(1_000_000);
		case 'deity-powered-fuser':
			return decimal(2).pow(pantheonMemberCount(levels));
		default:
			return decimal(0);
	}
};

const metamorphosisSpecialMultiplier = (producerId: string, statistic: ReturnType<typeof decimal>) => {
	switch (producerId) {
		case 'solar-panel':
		case 'lunar-panel':
			return decimal(1).plus(statistic.div(100));
		case 'wind-turbine':
			return decimal(1).plus(statistic.pow(2).div(100));
		case 'crimson-thermal-plant':
			return decimal(1).plus(statistic.times(0.5));
		case 'hydro-dam':
			return decimal(1).plus(statistic.times(0.1));
		case 'bio-reactor':
			return decimal(1).plus(statistic.div(100));
		case 'energy-donation-center':
			return decimal(1).plus(statistic.div(10));
		case 'dark-nuclear-power-plant':
			return decimal(1).plus(statistic.times(0.00002));
		case 'lightning-rod':
			return decimal(1).plus(statistic);
		case 'time-machine':
			return decimal(1).plus(statistic.times(0.004));
		case 'plasma-accelerator':
			return decimal(1).plus(statistic.times(0.0001));
		case 'void-cortex':
		case 'deity-powered-fuser':
			return statistic;
		default:
			return decimal(1);
	}
};

export const createEnergyOnlineSlice: OnlineProgressSlice<'calculateProducerEnergy' | 'calculateAmplification' | 'calculateOtherEnergyMultipliers'> = () => ({
	calculateProducerEnergy: (seconds, heartMultiplier, activity) => {
		const production = useProductionStore.getState();
		const pantheonLevels = getDeityLevels(production.levels);
		const stats = useStatsStore.getState();
		return PRODUCERS.reduce((total, producer) => {
			const owned = production.levels[producer.id] ?? 0;
			if (!owned) return total;
			const progress = production.producerStore.progress[producer.id] ?? { durability: producer.baseDurability * 100, quantumGrowths: 0, evolutions: 0, metamorphosed: false };
			const statistic = producerStatistic(producer.id, production.levels, stats.totalGoalsCompleted, stats.pomodoroSeconds);
			const coreUpgradeLevel = production.levels[`${producer.id}-core-upgrade`] ?? 0;
			const specialUpgradeLevel = production.levels[`${producer.id}-special-upgrade`] ?? 0;
			const specialStrength = (producer.statisticMultiplier ?? 0) + producer.upgrades.specialEffectPerLevel * specialUpgradeLevel;
			const special = statistic.times(specialStrength);
			const base = producer.id === 'void-cortex' || producer.id === 'deity-powered-fuser' ? decimal(producer.baseProduction).times(statistic) : decimal(producer.baseProduction).plus(special);
			const quantityMultiplier = calculateMilestoneGrowth(owned, [
				{ start: 25, repeatEvery: 25, multiplier: 2 },
				{ start: 500, repeatEvery: 500, multiplier: 10 },
			]);
			return total.plus(
				base
					.times(owned)
					.times(quantityMultiplier)
					.times(decimal(producer.upgrades.productionMultiplier).pow(coreUpgradeLevel))
					.times(decimal(producer.quantumGrowth.productionMultiplier).pow(progress.quantumGrowths))
					.times(decimal(progress.metamorphosed ? producer.evolution.metamorphosedProductionMultiplier : producer.evolution.productionMultiplier).pow(progress.evolutions))
					.times(progress.metamorphosed ? decimal(producer.metamorphosis.productionMultiplier).times(metamorphosisSpecialMultiplier(producer.id, statistic)) : 1)
					.times(seconds / producer.tickInterval)
					.times(heartMultiplier)
					.times(
						producer.id === 'solar-panel' && (pantheonLevels.apollo ?? 0) > 0 ? 2
						: producer.id === 'lunar-panel' && (pantheonLevels.artemis ?? 0) > 0 ? 2
						: producer.id === 'wind-turbine' && activity === 'pomodoro' ? 2
						: producer.id === 'lightning-rod' && (pantheonLevels.zeus ?? 0) > 0 ? 2
						: 1,
					),
			);
		}, decimal(0));
	},
	calculateAmplification: () => {
		const production = useProductionStore.getState();
		const amplifierEfficiency = decimal(1.5).pow(production.levels['amplifier-efficiency'] ?? 0);
		return AMPLIFIERS.reduce((total, amplifier) => {
			const owned = production.levels[amplifier.id] ?? 0;
			if (!owned) return total;
			const milestoneMultiplier = calculateMilestoneGrowth(owned, [
				{ start: 100, repeatEvery: 25, multiplier: 4 },
				{ start: 500, repeatEvery: 500, multiplier: 100 },
			]);
			return total.plus(decimal(amplifier.amplification).times(owned).times(milestoneMultiplier).times(production.forgingStore.getGildMultiplier(amplifier.id, 'amplifier')).times(amplifierEfficiency));
		}, decimal(1));
	},
	calculateOtherEnergyMultipliers: () => {
		const production = useProductionStore.getState();
		const resources = useWorldStore.getState().resourceStore;
		const levels = production.levels;
		const pantheonLevels = getDeityLevels(levels);
		const armageddonSeconds = Math.max(0, (Date.now() - Date.parse(usePrestigeStore.getState().armageddonStartedAt)) / 1_000);
		const kronos = usePrestigeStore.getState().tartarusActive ? 0 : (pantheonLevels.kronos ?? 0);
		const zeusBase = kronos ? 2.5 : 10;
		const prometheus = (pantheonLevels.prometheus ?? 0) > 0 ? Math.min(5, 1 + 0.2 * onlineLog10(decimalMax(resources.resources.chaosEnergy, 1))) : 1;
		const populationLog = Math.max(0, onlineLog10(decimalMax(resources.resources.population, 1)) / 9);
		const demeterFactor = Math.max(1, populationLog * Math.max(1, pantheonLevels.demeter ?? 0));
		const populationEfficiencyBase = decimal(1).plus(populationLog * 0.1 * (levels['population-efficiency'] ?? 0) * demeterFactor);
		return decimal(1)
			.plus(resources.resources.shards.times(0.01 * (levels['crimson-efficiency'] ?? 0)).times(decimal(1.5).pow(pantheonLevels.athena ?? 0)))
			.times(resources.resources.energy.lt(resources.resources.population) ? populationEfficiencyBase.pow(2) : populationEfficiencyBase)
			.times(decimal(1).plus(resources.totalThisTranscension.plasma.times(0.001 * (levels['plasma-efficiency'] ?? 0))))
			.times(decimal(1).plus(resources.totalAllTime.darkPlasma.times(0.005 * (levels['anomaly-efficiency'] ?? 0))))
			.times(decimal(1).plus((levels['age-efficiency'] ?? 0) * resources.dragon.ageDays * 0.01))
			.times(decimal(1).plus(armageddonSeconds * 0.0005 * (levels['dark-glitch'] ?? 0)))
			.times(decimal(1).plus(resources.resources.chaosEnergy.times(0.001)))
			.times(production.isEffectActive('gaia-awakened') ? 5 : 1)
			.times(decimal(zeusBase * prometheus).pow(pantheonLevels.zeus ?? 0))
			.times(activeStreakCount() > 0 ? decimal(1.1).pow(pantheonLevels.dionysus ?? 0) : 1);
	},
});
