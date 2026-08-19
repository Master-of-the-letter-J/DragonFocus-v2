import type { AmplifierDefinition } from '@/types/production.types';

type AmplifierInput = [id: string, name: string, amplification: string, cost: string, growth: number, phase: 1 | 2 | 3 | 4];

export const AMPLIFIER_UNLOCK_LEVEL = 5;

const amplifier = ([id, name, amplification, cost, growth, phase]: AmplifierInput): AmplifierDefinition => ({
	id,
	name,
	kind: 'amplifier',
	description: `Adds ${amplification} to the Energy amplifier multiplier. Every ${AMPLIFIER_UNLOCK_LEVEL} purchases unlocks the next amplifier permanently.`,
	costs: [{ resource: 'energy', base: cost, growthFactor: growth }],
	unlocks: [{ metric: 'milestone', amount: 1 }],
	persistsOnArmageddon: false,
	persistsOnTranscension: false,
	amplification,
	phase,
});

const amplifierData: AmplifierInput[] = [
	['amplifier', 'Amplifier', '0.1', '25', 1.12, 1],
	['large-amplifier', 'Large Amplifier', '0.8', '250', 1.12, 1],
	['mega-amplifier', 'Mega Amplifier', '5', '2500', 1.12, 1],
	['massive-mega-amplifier', 'Massive Mega Amplifier', '25', '25000', 1.12, 1],
	['titanic-amplifier', 'Titanic Amplifier', '150', '250000', 1.12, 1],
	['colossal-amplifier', 'Colossal Amplifier', '1000', '2500000', 1.12, 1],
	['impossible-amplifier', 'Impossible Amplifier', '7500', '25000000', 1.12, 1],
	['gargantuan-amplifier', 'Gargantuan Amplifier', '60000', '250000000', 1.12, 1],
	['eternal-amplifier', 'Ethearnal Amplifier', '500000', '2500000000', 1.12, 1],

	['infinity-amplifier', 'Infinity Amplifier', '5e7', '5e11', 1.15, 2],
	['mega-infinity-amplifier', 'Mega Infinity Amplifier', '5e9', '7.5e13', 1.15, 2],
	['titanic-infinity-amplifier', 'Titanic Infinity Amplifier', '7.5e11', '1e16', 1.15, 2],
	['impossible-infinity-amplifier', 'Impossible Infinity Amplifier', '1.5e14', '2e18', 1.15, 2],
	['eternal-infinity-amplifier', 'Ethearnal Infinity Amplifier', '3.5e16', '4e20', 1.15, 2],
	['ultra-infinity-amplifier', 'Ultra Infinity Amplifier', '1.2e19', '1e23', 1.15, 2],
	['ultra-mega-infinity-amplifier', 'Ultra Mega Infinity Amplifier', '6.5e21', '7.5e25', 1.15, 2],
	['useless-infinity-amplifier', 'Useless Infinity Amplifier', '0.001', '5e46', 1.1, 2],
	['ultra-ultimate-infinity-amplifier', 'Ultra Ultimate Infinity Amplifier', '4e24', '5e52', 1.15, 2],

	['cosmic-amplifier', 'Cosmic Amplifier', '1e26', '5e62', 1.2, 3],
	['cosmic-mega-amplifier', 'Cosmic Mega Amplifier', '1e36', '5e80', 1.2, 3],
	['cosmic-impossible-amplifier', 'Cosmic Impossible Amplifier', '1e46', '5e98', 1.2, 3],
	['titan-mantle-amplifier', 'Titan Mantle Amplifier', '1e56', '5e116', 1.2, 3],
	['titan-core-amplifier', 'Titan Core Amplifier', '1e66', '5e134', 1.25, 3],
	['titan-overlord-amplifier', 'Titan Overlord Amplifier', '1e76', '5e152', 1.25, 3],
	['near-infinity-breaker', 'Near Infinity Breaker', '1e86', '5e170', 1.25, 3],
	['infinity-breaker', 'Infinity Breaker', '1e96', '5e188', 1.25, 3],

	['literal-black-hole-amplifier', 'Literal Black Hole Amplifier', '1e115', '5e220', 1.3, 4],
	['signaling-of-the-void-amplifier', 'Signaling of the Void Amplifier', '1e145', '5e264', 1.3, 4],
	['awakening-of-the-void-amplifier', 'Awakening of the Void Amplifier', '1e175', '5e308', 1.3, 4],
	['genesis-of-the-void-amplifier', 'Genesis of the Void Amplifier', '1e205', '5e352', 1.35, 4],
	['heart-of-the-void-amplifier', 'Heart of the Void Amplifier', '1e235', '5e396', 1.35, 4],
	['all-consuming-void-singularity', 'All-Consuming Void Singularity', '1e265', '5e440', 1.35, 4],
];

export const AMPLIFIERS = amplifierData.map(amplifier);
export const AMPLIFIERS_BY_ID = Object.fromEntries(AMPLIFIERS.map(item => [item.id, item]));
