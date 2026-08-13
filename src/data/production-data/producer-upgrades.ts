import { PRODUCERS } from './producers';
import type { UpgradeDefinition } from '@/types/production.types';

type UpgradeInfo = {
	tier: number;
	coreName: string;
	specialName: string;
};

const upgradeInfo: Record<string, UpgradeInfo> = {
	'solar-panel': { tier: 0, coreName: 'Photovoltaic Array Enhancement', specialName: 'Check-In Resonance' },
	'lunar-panel': { tier: 0, coreName: 'Selenite Refractor Grid', specialName: 'Check-Out Synchronicity' },
	'wind-turbine': { tier: 0, coreName: 'Aerodynamic Rotor Design', specialName: 'Flow State Momentum' },
	'crimson-thermal-plant': { tier: 1, coreName: 'Magma Core Injection', specialName: 'Thermal Streak Catalyst' },
	'hydro-dam': { tier: 1, coreName: 'Pressurized Spillway Flow', specialName: 'Milestone Surge Conduit' },
	'bio-reactor': { tier: 1, coreName: 'Enzymatic Catalyst Matrix', specialName: 'Logarithmic Population Scaling' },
	'energy-donation-center': { tier: 1, coreName: 'Altruistic Grid Distribution', specialName: 'Fury Siphon Optimization' },
	'dark-nuclear-power-plant': { tier: 2, coreName: 'Subatomic Containment Shield', specialName: 'Dark Matter Fission Core' },
	'lightning-rod': { tier: 3, coreName: 'Superconducting Ion Array', specialName: 'Storm Focus Capacitor' },
	'time-machine': { tier: 4, coreName: 'Temporal Chrono-Stabilizer', specialName: 'Tachyon Loop Accelerator' },
	'plasma-accelerator': { tier: 5, coreName: 'Magnetic Confinement Ring', specialName: 'Ionized Plasma Overcharge' },
	'void-cortex': { tier: 6, coreName: 'Singularity Lens Array', specialName: 'Entropy Inversion Matrix' },
	'deity-powered-fuser': { tier: 7, coreName: 'Divine Channeling Conduit', specialName: 'Pantheon Resonance Field' },
};

const coreCosts = [
	{ energy: '100', darkEnergy: '10' },
	{ energy: '10000', darkEnergy: '100' },
	{ energy: '1000000', darkEnergy: '1000' },
	{ energy: '100000000', darkEnergy: '10000' },
	{ energy: '10000000000', darkEnergy: '100000' },
	{ energy: '1000000000000', darkEnergy: '1000000' },
	{ energy: '100000000000000', darkEnergy: '10000000' },
	{ energy: '10000000000000000', darkEnergy: '100000000' },
] as const;

const specialCosts = ['5', '50', '500', '5000', '50000', '500000', '5000000', '50000000'] as const;

const requirementFor = (producerId: string, tier: number, amount: number) => ({ metric: 'owned-producer' as const, itemId: producerId, amount: tier === 0 ? 1 : amount });

const coreUpgrade = (producerId: string, producerName: string, info: UpgradeInfo): UpgradeDefinition => {
	const cost = coreCosts[info.tier];
	return {
		id: `${producerId}-core-upgrade`,
		name: info.coreName,
		kind: 'producer-upgrade',
		description: `Multiplies ${producerName} production by 1.25 and durability by 1.1 per level.`,
		costs: [{ resource: 'darkEnergy', base: cost.darkEnergy, growthFactor: 1.1 }],
		activationCosts: [{ resource: 'energy', base: cost.energy, growthFactor: 1.5 }],
		oneTimeUntilTranscension: ['darkEnergy'],
		unlocks: [{ metric: 'milestone', amount: 2 }, requirementFor(producerId, info.tier, 25)],
		persistsOnArmageddon: false,
		persistsOnTranscension: false,
		effect: `${producerId}-core-upgrade`,
		value: 1.25,
	};
};

const specialUpgrade = (producerId: string, producerName: string, info: UpgradeInfo, specialEffectPerLevel: number): UpgradeDefinition => ({
	id: `${producerId}-special-upgrade`,
	name: info.specialName,
	kind: 'producer-upgrade',
	description: `Adds ${specialEffectPerLevel} to ${producerName}'s statistic effect per level.`,
	costs: [{ resource: 'darkEnergy', base: specialCosts[info.tier], growthFactor: 1.2 }],
	unlocks: [{ metric: 'milestone', amount: 2 }, requirementFor(producerId, info.tier, 100)],
	persistsOnArmageddon: true,
	persistsOnTranscension: false,
	effect: `${producerId}-special-upgrade`,
	value: specialEffectPerLevel,
});

export const PRODUCER_UPGRADES: UpgradeDefinition[] = PRODUCERS.flatMap(producer => {
	const info = upgradeInfo[producer.id];
	return [coreUpgrade(producer.id, producer.name, info), specialUpgrade(producer.id, producer.name, info, producer.upgrades.specialEffectPerLevel)];
});
