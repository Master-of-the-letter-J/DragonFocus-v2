import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { armageddonPower, naturalPopulationScale } from '@/data/calculations/formula-game';
import { calculateTimedSpellMultiplier, calculateTitanomachyMultiplier } from '@/data/calculations/formula-resources';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { pomodoroMultiplier } from '@/store/store-online-progress/online-progress.formulas';
import { usePrestigeStore } from '@/store/store-prestige/_usePrestigeStore';
import { getDeityLevels, useProductionStore } from '@/store/store-production/_useProductionStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import type { AppActivity } from '@/types/world.types';
import { decimal } from '@/utils/decimal';

export interface ProgressionPreview {
	activity: AppActivity;
	heartTicksPerSecond: number;
	energyPerTick: ReturnType<typeof decimal>;
	populationPerTick: ReturnType<typeof decimal>;
	energyBlocked: boolean;
	populationBlocked: boolean;
}

export const currentAppActivity = (): AppActivity => {
	const pomodoro = useProductivityStore.getState().pomodoro;
	const options = useWorldStore.getState().optionsStore;
	return pomodoro.status === 'countdown-active' || pomodoro.status === 'count-up' ? 'pomodoro'
		: pomodoro.status === 'countdown-break' ? 'pomodoro-break'
		: options.activity;
};

/** Calculates one Heart tick using the same live modifiers as the progression engine. */
export const calculateProgressionPreview = (heartCharge: number): ProgressionPreview => {
	const world = useWorldStore.getState();
	const resources = world.resourceStore;
	const production = useProductionStore.getState();
	const special = useProductionSpecialStore.getState();
	const prestige = usePrestigeStore.getState();
	const activity = currentAppActivity();
	const deityLevels = getDeityLevels(production.levels);
	const online = useOnlineProgressStore.getState();
	const furyBand = online.getFuryBand();
	const titanomachyActive = prestige.titanomachyActive && production.isEffectActive('chaos-awakened') && !prestige.tartarusActive && deityLevels.zeus > 0 && deityLevels.kronos > 0;
	const titanomachyMultiplier = calculateTitanomachyMultiplier(titanomachyActive, resources.dragon.ageDays, WORLD_CONSTANTS.titanomachyProductionAdditivePerAge);
	const energyBlocked =
		!world.dragonStore.dragonSpawned || !resources.dragon.isAlive ||
		furyBand === 'angry' || furyBand === 'critical' || furyBand === 'supernova' ||
		world.optionsStore.gameMode === 'lock-in' || activity === 'blocked-app';
	const populationBlocked =
		!world.dragonStore.dragonSpawned || !resources.dragon.isAlive ||
		world.optionsStore.gameMode === 'lock-in' || activity === 'blocked-app';

	const energyPerTick = energyBlocked ? decimal(0) : online
		.calculateProducerEnergy(WORLD_CONSTANTS.resourceTickSeconds, 1, activity)
		.times(online.calculateAmplification())
		.times(production.goalMultiplierStore.getProductionMultiplier())
		.times(online.calculateOtherEnergyMultipliers())
		.times(pomodoroMultiplier(production.levels, activity, 'energy-boost', 'dual-boost', 'trio-boost'))
		.times(special.monuments.isMonumentActive('aether') ? 2 * Math.pow(1.5, special.monuments.upgradeLevels.aether) : 1)
		.times(calculateTimedSpellMultiplier(special.spells.activeSpells, 'energy', WORLD_CONSTANTS.resourceTickSeconds));

	const populationMultiplier = decimal(10)
		.pow(deityLevels.hera ?? 0)
		.times(decimal(1).plus(resources.resources.chaosEnergy.times(0.01 * (deityLevels.rhea ?? 0))))
		.times(armageddonPower(resources.totalThisTranscension.plasma));
	const reviveGraceActive = Boolean(world.dragonStore.reviveGraceUntil && Date.parse(world.dragonStore.reviveGraceUntil) > Date.now());
	const populationTickCount = titanomachyMultiplier
		* (reviveGraceActive ? WORLD_CONSTANTS.dragon.revivePopulationMultiplier : 1)
		* pomodoroMultiplier(production.levels, activity, 'population-boost', 'trio-boost').toNumber();
	const populationPerTick = populationBlocked ? decimal(0) : online.calculatePopulationProgress({
		initial: resources.resources.population,
		ticks: populationTickCount,
		multiplier: populationMultiplier,
		growthScale: naturalPopulationScale(furyBand, deityLevels.demeter ?? 0, special.monuments.isMonumentActive('ananke')),
	}).minus(resources.resources.population);

	return {
		activity,
		heartTicksPerSecond: Math.max(0, heartCharge),
		energyPerTick,
		populationPerTick,
		energyBlocked,
		populationBlocked,
	};
};
