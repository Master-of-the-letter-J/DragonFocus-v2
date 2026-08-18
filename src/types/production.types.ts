import type { ResourceId, SpendableResourceId } from './resources.types';
import type { DecimalSource } from '@/utils/decimal';

export type ProductionItemKind = 'producer' | 'amplifier' | 'clicker' | 'special-generator' | 'energy-upgrade' | 'producer-upgrade' | 'goal-multiplier' | 'pomodoro-boost' | 'armageddon-monument' | 'transcension-monument' | 'forge' | 'deity' | 'titan' | 'respec';

export type ProductionEffectId =
	| 'gaia-awakened'
	| 'uranus-awakened'
	| 'signal-chaos'
	| 'chaos-crucible'
	| 'chaos-forge'
	| 'typhon-siphon'
	| 'fates-timer'
	| 'olympian-pantheon'
	| 'titan-pantheon'
	| 'chaos-awakened'
	| 'chaos-unleashed'
	| 'nyx-realm'
	| 'cyclopes-forge'
	| 'tartarus-unlocked'
	| 'dark-energy-respec'
	| 'producer-respec'
	| 'amplifier-respec'
	| 'goal-multiplier-respec'
	| 'boost-respec'
	| 'primordial-monument-respec'
	| 'task-respec'
	| 'pomodoro-respec'
	| 'pantheon-respec'
	| 'chaos-respec'
	| 'forge-respec'
	| 'primordial-sanctuary'
	| 'eros-monument'
	| 'ananke-monument'
	| 'aether-monument'
	| 'chronos-monument'
	| 'primordial-converter'
	| 'freeze-apocalypse'
	| 'wrath-apocalypse'
	| 'reincarnation-apocalypse'
	| 'invasion-apocalypse'
	| 'roulette-apocalypse'
	| 'crimson-activation'
	| 'crimson-heart-boost'
	| 'crimson-off-phone-tempo'
	| 'crimson-pomodoro-tempo'
	| 'crimson-offline-awakening'
	| 'crimson-pomodoro-awakening';

export type UnlockMetric =
	| 'milestone'
	| 'check-in'
	| 'check-out'
	| 'pomodoro-minutes'
	| 'pomodoro-sessions'
	| 'completed-goals'
	| 'completed-habits'
	| 'completed-tasks'
	| 'population'
	| 'dragon-age'
	| 'dark-energy-earned'
	| 'plasma-earned'
	| 'resource-earned'
	| 'resource-amount'
	| 'owned-item'
	| 'owned-producer'
	| 'armageddons'
	| 'transcensions'
	| 'pantheon-members'
	| 'titan-equivalents'
	| 'effect';

export interface UnlockRequirement {
	metric: UnlockMetric;
	amount?: number;
	itemId?: string;
	effectId?: ProductionEffectId;
	resource?: ResourceId;
}

/** A reusable growth value: geometric by default, or linear when explicitly requested. */
export interface ExponentialGrowth {
	base: DecimalSource;
	growthFactor: DecimalSource;
	growthMode?: 'geometric' | 'linear';
}

/** An exponential value paid from one specific spendable resource. */
export interface ResourceGrowth extends ExponentialGrowth {
	resource: SpendableResourceId;
}

export type PurchaseCost = ResourceGrowth;

export interface ProductionItemBase {
	id: string;
	name: string;
	kind: ProductionItemKind;
	description: string;
	costs: PurchaseCost[];
	/** Paid only on the first purchase; the resulting unlock survives resets. */
	unlockCosts?: PurchaseCost[];
	/** Costs paid again after Armageddon to reactivate an already unlocked level. */
	activationCosts?: PurchaseCost[];
	/** Cost resources remembered per level until Transcension. */
	oneTimeUntilTranscension?: readonly SpendableResourceId[];
	unlocks?: UnlockRequirement[];
	maxLevel?: number;
	persistsOnArmageddon: boolean;
	persistsOnTranscension: boolean;
	effectId?: ProductionEffectId;
}

export type ProducerStatistic = 'check-in-streak' | 'check-out-streak' | 'pomodoro-habit-streak' | 'active-streaks' | 'completed-goals' | 'population-log' | 'fury-deficit' | 'unspent-dark-energy' | 'pomodoro-session-seconds' | 'pomodoro-seconds' | 'unspent-plasma' | 'best-energy-ratio' | 'pantheon-members';

export interface ProducerUpgradeSpec {
	productionMultiplier: number;
	durabilityMultiplier: number;
	specialEffectPerLevel: number;
}

export interface QuantumGrowthSpec {
	productionMultiplier: number;
	plasmaCost: ResourceGrowth;
	quarkCost: ResourceGrowth;
}

export interface EvolutionSpec {
	requiredGrowths: number;
	productionMultiplier: number;
	metamorphosedProductionMultiplier: number;
	darkPlasmaCost: ExponentialGrowth;
	quarkCostPerEvolution: number;
}

export interface MetamorphosisSpec {
	name: string;
	cost: ResourceGrowth;
	productionMultiplier: number;
	specialEffect: string;
}

export interface ProducerDefinition extends ProductionItemBase {
	kind: 'producer';
	baseProduction: string;
	tickInterval: number;
	baseDurability: number;
	statistic?: ProducerStatistic;
	statisticMultiplier?: number;
	pomodoroMultiplier?: number;
	upgrades: ProducerUpgradeSpec;
	quantumGrowth: QuantumGrowthSpec;
	evolution: EvolutionSpec;
	metamorphosis: MetamorphosisSpec;
}

export interface AmplifierDefinition extends ProductionItemBase {
	kind: 'amplifier';
	amplification: string;
	phase: 1 | 2 | 3 | 4;
}

export interface ClickerDefinition extends ProductionItemBase {
	kind: 'clicker';
	effect: 'energy' | 'energy-multiplier' | 'fury-reduction' | 'production-ticks' | 'population' | 'population-ticks';
	value: number;
}

export interface SpecialGeneratorDefinition extends ProductionItemBase {
	kind: 'special-generator';
	productionResource: SpendableResourceId;
	percentPerLevel?: number;
	flatPerLevel?: number;
	tickInterval?: number;
}

export interface UpgradeDefinition extends ProductionItemBase {
	kind: 'energy-upgrade' | 'producer-upgrade' | 'goal-multiplier' | 'pomodoro-boost';
	effect: string;
	value: number;
}

export interface ForgeDefinition extends ProductionItemBase {
	kind: 'forge';
	forgeTarget: 'amplifier' | 'goal' | 'deity' | 'titan';
}

export interface PantheonDefinition extends ProductionItemBase {
	kind: 'deity' | 'titan';
	effect: string;
	baseEffect: number;
}

export type ProductionItem = ProducerDefinition | AmplifierDefinition | ClickerDefinition | SpecialGeneratorDefinition | UpgradeDefinition | ForgeDefinition | PantheonDefinition | ProductionItemBase;

export interface ProductionUnlockState {
	milestone: number;
	completedGoals: number;
	completedHabits: number;
	completedTasks: number;
	pomodoroMinutes: number;
	population: string;
	dragonAge: number;
	darkEnergyEarned: string;
	plasmaEarned: string;
	pomodoroSessions: number;
	armageddons: number;
	transcensions: number;
	checkInCompleted: boolean;
	checkOutCompleted: boolean;
}
