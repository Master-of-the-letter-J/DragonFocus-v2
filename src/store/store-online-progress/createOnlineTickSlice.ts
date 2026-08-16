import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { armageddonPower, naturalPopulationScale } from '@/data/calculations/formula-game';
import { calculateAverageCrimsonHeartCharge, calculateFuryChange, calculateShieldAbsorption, calculateTimedSpellMultiplier, calculateTitanomachyMultiplier } from '@/data/calculations/formula-resources';
import { SPECIAL_GENERATORS } from '@/data/production-data';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import type { ActiveSpell, AppActivity, Spell } from '@/types/world.types';
import { decimal, decimalMax, decimalMin } from '@/utils/decimal';
import { useOfflineProgressStore } from '../store-offline-progress/_useOfflineProgressStore';
import { usePrestigeStore } from '../store-prestige/_usePrestigeStore';
import { getDeityLevels, useProductionStore } from '../store-production/_useProductionStore';
import { useProductionSpecialStore } from '../store-production-special/_useProductionSpecialStore';
import { useProductivityStore } from '../store-productivity/_useProductivityStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useStatsStore } from '../useStatsStore';
import { activeStreakCount, onlineLog10, pomodoroMultiplier } from './online-progress.formulas';
import { dragonStageForAge, furyBandFor } from './createPopulationOnlineSlice';
import { initialOnlineProgressState, type OnlineProgressSlice } from './online-progress.types';

const furyRates: Record<AppActivity, number> = {
	pomodoro: -1 / 60,
	'pomodoro-break': -0.5 / 60,
	'off-app': 0.5 / 3600,
	'allowed-app': 1 / 3600,
	idle: 1 / 3600,
	'blocked-app': 5 / 3600,
};

const offlineSpell = (index: number): Spell => {
	const rewards = [
		{ resource: 'energy' as const, spellType: 'snack-energy' as const, name: 'Ember Biscuit', multiplier: 1.25 },
		{ resource: 'darkEnergy' as const, spellType: 'snack-dark-energy' as const, name: 'Void Truffle', multiplier: 1.25 },
		{ resource: 'plasma' as const, spellType: 'snack-plasma' as const, name: 'Plasma Nectar', multiplier: 1.25 },
		{ resource: 'chaosEnergy' as const, spellType: 'snack-chaos' as const, name: 'Chaos Cocoa', multiplier: 1.25 },
	];
	const reward = rewards[index % rewards.length];
	return {
		id: `offline-spell-${Date.now()}-${index}`,
		name: reward.name,
		spellType: reward.spellType,
		size: 1,
		durationSeconds: 60 * 60,
		effects: [{ resource: reward.resource, multiplier: reward.multiplier }],
	};
};

const triggerDragonDeath = (reason: 'fury' | 'population') => {
	const world = useWorldStore.getState();
	const resources = world.resourceStore;
	const diedAt = new Date().toISOString();
	const casualties = resources.resources.population.times(WORLD_CONSTANTS.dragon.supernovaPopulationLoss);
	resources.addPopulation(casualties.neg(), casualties);
	world.destructionStore.applyDragonMassDestruction(resources.dragon.ageDays);
	resources.setDragon({ isAlive: false, deathReason: reason, lastDeathAt: diedAt });
	usePrestigeStore.getState().setTitanomachyActive(false);
	useStatsStore.getState().recordDragonDeath({ name: resources.dragon.name, ageDays: resources.dragon.ageDays, diedAt, respawnAt: 'Manual revival required' });
};

/** Coordinates one closed-form online or offline progression interval. */
export const createOnlineTickSlice: OnlineProgressSlice<'tickWorld' | 'giveOfflineProgress' | 'reset'> = (set, get) => ({
	tickWorld: (seconds = 1) => {
		if (!Number.isFinite(seconds) || seconds <= 0) return;
		const world = useWorldStore.getState();
		const options = world.optionsStore;
		const mode = options.gameMode;
		const resources = world.resourceStore;
		const dragon = world.dragonStore;
		const special = useProductionSpecialStore.getState();
		special.blackMarket.refreshRewardedShardAdStacks();
		const monuments = special.monuments;
		const production = useProductionStore.getState();
		const prestige = usePrestigeStore.getState();
		const productivity = useProductivityStore.getState();
		const pomodoro = productivity.pomodoro;
		const pomodoroBoundary =
			!pomodoro.isPaused && (pomodoro.status === 'countdown-active' || pomodoro.status === 'countdown-break') ? pomodoro.secondsRemaining : 0;
		const timedBoundaries = [...Object.values(monuments.fuelSeconds), special.incinerator.fuelSeconds, pomodoroBoundary].filter(boundary => boundary > 0 && boundary < seconds);
		if (timedBoundaries.length) {
			const boundary = Math.min(...timedBoundaries);
			get().tickWorld(boundary);
			get().tickWorld(seconds - boundary);
			return;
		}

		const activity: AppActivity =
			pomodoro.status === 'countdown-active' || pomodoro.status === 'count-up' ? 'pomodoro'
			: pomodoro.status === 'countdown-break' ? 'pomodoro-break'
			: options.activity;

		productivity.goals.processMidnight();
		const goals = productivity.goals;
		productivity.pomodoro.tick(seconds);
		const stats = useStatsStore.getState();

		production.updateUnlockState({
			milestone: milestoneForEnergy(resources.totalAllTime.energy),
			completedGoals: stats.totalGoalsCompleted,
			completedHabits: [...goals.completed, ...goals.archived].filter(goal => goal.type === 'habit').length,
			completedTasks: [...goals.completed, ...goals.archived].filter(goal => goal.type === 'task').length,
			pomodoroMinutes: stats.pomodoroSeconds / 60,
			pomodoroSessions: stats.pomodoroSessions,
			population: resources.resources.population.toString(),
			dragonAge: resources.dragon.ageDays,
			darkEnergyEarned: resources.totalAllTime.darkEnergy.toString(),
			plasmaEarned: resources.totalAllTime.plasma.toString(),
			armageddons: prestige.armageddonCount,
			transcensions: prestige.transcensionCount,
			checkInCompleted: stats.checkIns > 0,
			checkOutCompleted: stats.checkOuts > 0,
		});

		if (!dragon.dragonSpawned || !resources.dragon.isAlive) {
			special.spells.tickSpells(seconds);
			special.incinerator.tick(seconds);
			monuments.tickMonuments(seconds);
			return;
		}
		if (resources.resources.population.lte(0)) {
			triggerDragonDeath('population');
			dragon.clearReviveGrace();
			special.spells.tickSpells(seconds);
			special.incinerator.tick(seconds);
			monuments.tickMonuments(seconds);
			set({ lastTickAt: new Date().toISOString() });
			return;
		}

		const deityLevels = getDeityLevels(production.levels);
		const activeSpells: readonly ActiveSpell[] = special.spells.activeSpells;
		const titanomachy = prestige.titanomachyActive && production.isEffectActive('chaos-awakened') && !prestige.tartarusActive && deityLevels.zeus > 0 && deityLevels.kronos > 0;
		const titanomachyMultiplier = calculateTitanomachyMultiplier(titanomachy, resources.dragon.ageDays, WORLD_CONSTANTS.titanomachyProductionAdditivePerAge);
		const furyThreshold = decimal(WORLD_CONSTANTS.dragon.baseFuryThreshold)
			.plus((deityLevels.aphrodite ?? 0) * 25)
			.plus(onlineLog10(decimalMax(resources.resources.chaosEnergy, 1)) * (deityLevels.theia ?? 0) * 20);
		const maxFury = furyThreshold.times(WORLD_CONSTANTS.dragon.furyDeathMultiplier).times(WORLD_CONSTANTS.gameModes.maxFuryMultiplier[mode]);
		const heartAtStart = special.crimsonHeart.charge;
		const nextHeart = special.crimsonHeart.tick(activity, seconds);
		const averageHeart = calculateAverageCrimsonHeartCharge(heartAtStart, nextHeart, seconds, special.crimsonHeart.getChargeRate());
		const extraGoals = Math.max(0, goals.incompleteHabits.length - 10) + Math.max(0, goals.incompleteTasks.length - 10);
		const lateGoals = [...goals.incompleteHabits, ...goals.incompleteTasks].filter(goal => goal.dueAt && Date.parse(goal.dueAt) < Date.now()).length;
		const rawFuryDelta = calculateFuryChange(furyRates[activity], WORLD_CONSTANTS.gameModes.furyMultiplier[mode], seconds, extraGoals + lateGoals * 4, titanomachyMultiplier).times(Math.max(1, averageHeart));
		const calmSpellMultiplier = calculateTimedSpellMultiplier(activeSpells, 'furyReduction', seconds);
		const furyDelta =
			rawFuryDelta.lt(0) ?
				rawFuryDelta
					.times(production.isEffectActive('typhon-siphon') ? 2 : 1)
					.times(monuments.isMonumentActive('eros') ? 2 : 1)
					.times(pomodoroMultiplier(production.levels, activity, 'calm-dragon-boost'))
					.times(calmSpellMultiplier)
			:	rawFuryDelta.div(calmSpellMultiplier);
		const shieldAbsorption = calculateShieldAbsorption(furyDelta, dragon.angerShields);
		const furyAfterShields = resources.resources.fury.plus(furyDelta.minus(shieldAbsorption));
		const excessCalm = decimalMax(furyAfterShields.neg(), 0);
		const nextFury = decimalMin(decimalMax(furyAfterShields, 0), maxFury.plus(1));
		const shieldCap = Math.floor(furyThreshold.toNumber());
		const nextShields = Math.min(shieldCap, Math.max(0, dragon.angerShields - shieldAbsorption.toNumber() + excessCalm.times(WORLD_CONSTANTS.dragon.angerShieldGainFromExcessCalm).toNumber()));
		const furyBand = furyBandFor(nextFury, furyThreshold, maxFury);
		const productionBlocked = furyBand === 'angry' || furyBand === 'critical' || furyBand === 'supernova' || mode === 'lock-in' || activity === 'blocked-app';
		const heartMultiplier = productionBlocked ? 0 : averageHeart * titanomachyMultiplier;
		const producerOutput = get().calculateProducerEnergy(seconds, heartMultiplier, activity);
		const amplification = get().calculateAmplification();
		const goalMultiplier = decimal(production.goalMultiplierStore.getProductionMultiplier());
		const otherMultipliers = get()
			.calculateOtherEnergyMultipliers()
			.times(pomodoroMultiplier(production.levels, activity, 'energy-boost', 'dual-boost', 'trio-boost'))
			.times(monuments.isMonumentActive('aether') ? 2 * Math.pow(1.5, monuments.upgradeLevels.aether) : 1)
			.times(calculateTimedSpellMultiplier(activeSpells, 'energy', seconds));
		const energy = producerOutput.times(amplification).times(goalMultiplier).times(otherMultipliers);

		const darkGenerator = SPECIAL_GENERATORS.find(generator => generator.id === 'dark-generator')!;
		const plasmaGenerator = SPECIAL_GENERATORS.find(generator => generator.id === 'plasma-generator')!;
		const microQuarkGenerator = SPECIAL_GENERATORS.find(generator => generator.id === 'micro-quark-generator')!;
		const darkEnergy = resources
			.getNonGeneratedThisTranscension('darkEnergy')
			.times(((darkGenerator.percentPerLevel ?? 0) * (production.levels[darkGenerator.id] ?? 0) * seconds) / (darkGenerator.tickInterval ?? 100))
			.times(heartMultiplier)
			.times(goalMultiplier)
			.times(decimal(2).pow(deityLevels.poseidon ?? 0))
			.times(decimal(1).plus(resources.resources.chaosEnergy.sqrt().times(0.001 * (deityLevels.oceanus ?? 0))))
			.times(calculateTimedSpellMultiplier(activeSpells, 'darkEnergy', seconds));
		const plasma = resources
			.getNonGeneratedThisTranscension('plasma')
			.times(((plasmaGenerator.percentPerLevel ?? 0) * (production.levels[plasmaGenerator.id] ?? 0) * seconds) / (plasmaGenerator.tickInterval ?? 100))
			.times(heartMultiplier)
			.times(goalMultiplier)
			.times(decimal(2).pow(deityLevels.hades ?? 0))
			.times(decimal(1).plus(resources.resources.chaosEnergy.sqrt().times(0.001 * (deityLevels.hyperion ?? 0))))
			.times(calculateTimedSpellMultiplier(activeSpells, 'plasma', seconds));
		const microQuarks = decimal(microQuarkGenerator.flatPerLevel ?? 0)
			.times(production.levels[microQuarkGenerator.id] ?? 0)
			.times(seconds / (microQuarkGenerator.tickInterval ?? 100))
			.times(heartMultiplier)
			.times(goalMultiplier);
		const shardBoostActive = activity === 'pomodoro' || ((activity === 'off-app' || activity === 'allowed-app') && useOfflineProgressStore.getState().activeBoostIds.includes('shard-boost'));
		const shardBoost = shardBoostActive ? decimal(production.levels['shard-boost'] ?? 0).times(seconds / 3600) : decimal(0);
		const kronos = prestige.tartarusActive ? 0 : (deityLevels.kronos ?? 0);
		const goalMultipliers = production.goalMultiplierStore;
		const themisMultiplier = (deityLevels.themis ?? 0) > 0 ? decimal(production.forgingStore.gildedGoalArchetypes.reduce((product, archetype) => product * goalMultipliers.getDarkEnergyMultiplier(archetype), 1)).sqrt() : decimal(1);
		const chaosEnergy =
			kronos ?
				decimal(Math.max(0, onlineLog10(decimalMax(energy.div(seconds), 1))))
					.div(86_400)
					.times(decimal(4).pow(Math.max(0, kronos - 1)))
					.times(titanomachy ? decimal(titanomachyMultiplier).pow(deityLevels.atlas ?? 0) : 1)
					.times(1 + onlineLog10(decimalMax(resources.resources.chaosEnergy, 1)) * 0.01)
					.times((deityLevels.phoebe ?? 0) > 0 ? decimal(1).plus(resources.resources.shards.times(0.01)) : 1)
					.times((deityLevels.tethys ?? 0) > 0 && activeStreakCount() > 0 ? 4 : 1)
					.times(themisMultiplier)
					.times(seconds)
					.times(heartMultiplier)
					.times(pomodoroMultiplier(production.levels, activity, 'chaos-boost', 'chaos-gambit', 'trio-boost'))
					.times(calculateTimedSpellMultiplier(activeSpells, 'chaosEnergy', seconds))
			:	decimal(0);

		const prestigePower = armageddonPower(resources.totalThisTranscension.plasma);
		const populationMultiplier = decimal(10)
			.pow(deityLevels.hera ?? 0)
			.times(decimal(1).plus(resources.resources.chaosEnergy.times(0.01 * (deityLevels.rhea ?? 0))))
			.times(prestigePower);
		const reviveGraceActive = Boolean(dragon.reviveGraceUntil && Date.parse(dragon.reviveGraceUntil) > Date.now());
		const populationTicks = mode === 'lock-in' || activity === 'blocked-app' ? 0 : averageHeart * titanomachyMultiplier * (reviveGraceActive ? WORLD_CONSTANTS.dragon.revivePopulationMultiplier : 1) * pomodoroMultiplier(production.levels, activity, 'population-boost', 'trio-boost').toNumber() * seconds;
		const nextPopulation = get().calculatePopulationProgress({
			initial: resources.resources.population,
			ticks: populationTicks,
			multiplier: populationMultiplier,
			growthScale: naturalPopulationScale(furyBand, deityLevels.demeter ?? 0, monuments.isMonumentActive('ananke')),
		});
		const naturalPopulationDelta = nextPopulation.minus(resources.resources.population);
		const naturalDeaths = decimal(0).max(naturalPopulationDelta.neg());
		const hostileDeaths = world.populationStore.progressHostiles({
			ticks: populationTicks,
			furyBand,
			populationMultiplier,
			zombieLevel: Math.max(1, prestige.apocalypseLevels.reincarnation ?? 0),
			cyborgLevel: Math.max(1, prestige.apocalypseLevels.invasion ?? 0),
			zombieIncinerationEffect: special.incinerator.getZombieEffect(),
			cyborgIncinerationEffect: special.incinerator.getCyborgEffect(),
		});

		resources.setResource('fury', nextFury);
		resources.addResource('energy', energy);
		resources.addResource('darkEnergy', darkEnergy, true);
		resources.addResource('plasma', plasma, true);
		resources.addResource('microQuarks', microQuarks, true);
		resources.addResource('shards', shardBoost);
		resources.addResource('chaosEnergy', chaosEnergy);
		resources.addPopulation(naturalPopulationDelta, naturalDeaths);
		if (hostileDeaths.gt(0)) resources.addPopulation(hostileDeaths.neg(), hostileDeaths);

		const previousAge = resources.dragon.ageDays;
		const ageMultiplier = production.isEffectActive('fates-timer') || monuments.isMonumentActive('chronos') ? 2 : 1;
		const ageDays = previousAge + (seconds * ageMultiplier * pomodoroMultiplier(production.levels, activity, 'age-boost').toNumber()) / WORLD_CONSTANTS.secondsPerDay;
		const dragonDead = furyBand === 'supernova' || useWorldStore.getState().resourceStore.resources.population.lte(0);
		resources.setDragon({ ageDays, stage: dragonStageForAge(ageDays), furyThreshold, maxFury });
		if (dragonDead) {
			triggerDragonDeath(furyBand === 'supernova' ? 'fury' : 'population');
			resources.setResource('chaosEnergy', resources.resources.chaosEnergy.div(10));
		}

		special.spells.tickSpells(seconds);
		special.incinerator.tick(seconds);
		monuments.tickMonuments(seconds);
		stats.recordResources(useWorldStore.getState().resourceStore.resources);
		stats.refreshAchievements();
		if (!reviveGraceActive) dragon.clearReviveGrace();
		dragon.recordDragonAge(ageDays);
		dragon.setAngerShields(nextShields);
		if (!titanomachy || dragonDead) usePrestigeStore.getState().setTitanomachyActive(false);
		set({ lastTickAt: new Date().toISOString() });
	},
	giveOfflineProgress: () => {
		const offline = useOfflineProgressStore.getState();
		const progress = offline.consumeProgress();
		if (!progress.totalSeconds) return 0;
		if (progress.rewardSpellCount) {
			const spells = useProductionSpecialStore.getState().spells;
			const inventorySize = spells.spellInventory.length;
			for (let index = 0; index < progress.rewardSpellCount; index += 1) spells.addSpell(offlineSpell(inventorySize + index));
		}
		const options = useWorldStore.getState().optionsStore;
		const currentActivity = options.activity;
		for (const segment of offline.getEnergyOfflineSegments(progress)) {
			options.setActivity(segment.activity);
			get().tickWorld(segment.seconds);
		}
		options.setActivity(currentActivity);
		return progress.totalSeconds;
	},
	reset: () => set(initialOnlineProgressState()),
});
