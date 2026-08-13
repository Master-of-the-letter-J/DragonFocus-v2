import type { ActiveSpell, AppActivity, GameMode } from '@/types/world.types';
import { decimal, decimalMax, type DecimalSource } from '@/utils/decimal';

export const calculateSpellMultiplier = (spells: readonly ActiveSpell[], resource: string) => spells.reduce((multiplier, spell) => multiplier.times(spell.effects.filter(effect => effect.resource === resource).reduce((effectMultiplier, effect) => effectMultiplier * effect.multiplier, 1)), decimal(1));

/** Integrates expiring spell multipliers without stepping through offline seconds. */
export const calculateTimedSpellMultiplier = (spells: readonly ActiveSpell[], resource: string, seconds: number) => {
	const duration = Math.max(0, seconds);
	if (!duration) return decimal(1);
	const relevant = spells.filter(spell => spell.remainingSeconds > 0 && spell.effects.some(effect => effect.resource === resource));
	if (!relevant.length) return decimal(1);

	const boundaries = [...new Set([0, duration, ...relevant.map(spell => Math.min(duration, spell.remainingSeconds))])].sort((left, right) => left - right);
	const weightedSeconds = boundaries.slice(1).reduce((total, boundary, index) => {
		const start = boundaries[index];
		const active = relevant.filter(spell => spell.remainingSeconds > start);
		return total.plus(calculateSpellMultiplier(active, resource).times(boundary - start));
	}, decimal(0));
	return weightedSeconds.div(duration);
};

export const calculateCrimsonHeartMultiplier = (charge: number, isBlocked: boolean, titanomachyMultiplier = 1) => (isBlocked ? decimal(0) : decimal(Math.max(0, charge)).times(titanomachyMultiplier));

/** Average charge over a linear ramp, including time spent at the target. */
export const calculateAverageCrimsonHeartCharge = (start: number, end: number, seconds: number, ratePerSecond: number) => {
	const duration = Math.max(0, seconds);
	if (!duration || start === end || ratePerSecond <= 0) return end;
	const rampSeconds = Math.min(duration, Math.abs(end - start) / ratePerSecond);
	return (((start + end) / 2) * rampSeconds + end * (duration - rampSeconds)) / duration;
};

export const calculateTitanomachyMultiplier = (isActive: boolean, ageDays: number, additivePerAge: number) => (isActive ? 1 + Math.max(0, ageDays) * additivePerAge : 1);

/** Iapetus turns Chaos Energy into a whole-number Great Sacrifice multiplier. */
export const calculateGreatSacrificeMultiplier = (iapetusLevel: number, chaosEnergy: DecimalSource) => {
	const chaosLog = decimalMax(chaosEnergy, 1).log10();
	return Math.max(1, Math.floor(Math.min(2, 1 + Math.max(0, iapetusLevel) * 0.05 * chaosLog)));
};

export const calculateFuryChange = (baseRate: number, gameModeMultiplier: number, seconds: number, extraGoalPressure: number, titanomachyMultiplier: number) =>
	decimal(baseRate + (Math.max(0, extraGoalPressure) * 0.05) / 3600)
		.times(gameModeMultiplier)
		.times(titanomachyMultiplier)
		.times(Math.max(0, seconds));

export const calculateShieldAbsorption = (furyIncrease: DecimalSource, shields: number) => decimal(furyIncrease).max(0).min(Math.max(0, shields));

export const isFuryPaused = (mode: GameMode) => mode === 'invincible' || mode === 'lock-in';

export const activityTargetHeart: Record<AppActivity, number> = {
	pomodoro: 100,
	'pomodoro-break': 50,
	'off-app': 10,
	'allowed-app': 5,
	idle: 1,
	'blocked-app': 0,
};
