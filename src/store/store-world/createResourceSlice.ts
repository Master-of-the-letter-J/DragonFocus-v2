/** Spendable-resource compatibility export for the world store folder. */
import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { RESOURCE_IDS, type PersistedResourceAmounts, type ResourceAmounts, type ResourceId, type SpendableResourceId } from '@/types/resources.types';
import type { DragonState } from '@/types/world.types';
import { decimal, deserializeDecimal, serializeDecimal, type DecimalSource } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const resourceIds: readonly ResourceId[] = RESOURCE_IDS;

export const createResourceAmounts = (initial: Partial<Record<ResourceId, DecimalSource>> = {}): ResourceAmounts => Object.fromEntries(resourceIds.map(id => [id, decimal(initial[id] ?? 0)])) as ResourceAmounts;

const serializeAmounts = (amounts: ResourceAmounts): PersistedResourceAmounts => Object.fromEntries(resourceIds.map(id => [id, serializeDecimal(amounts[id])])) as PersistedResourceAmounts;
const hydrateAmounts = (amounts: Partial<PersistedResourceAmounts> | undefined, initial: ResourceAmounts) => Object.fromEntries(resourceIds.map(id => [id, deserializeDecimal(amounts?.[id], initial[id])])) as ResourceAmounts;
const migrateMicroQuarks = (amounts: (Partial<PersistedResourceAmounts> & { nanoQuarks?: string }) | undefined) => (amounts ? { ...amounts, microQuarks: amounts.microQuarks ?? amounts.nanoQuarks } : amounts);

export interface ResourceStoreState {
	resources: ResourceAmounts;
	totalThisArmageddon: ResourceAmounts;
	totalThisTranscension: ResourceAmounts;
	totalAllTime: ResourceAmounts;
	generatedThisTranscension: ResourceAmounts;
	dragon: DragonState;
	populationDead: ReturnType<typeof decimal>;
	addResource: (resource: ResourceId, amount: DecimalSource, generated?: boolean) => void;
	spendResource: (resource: SpendableResourceId, amount: DecimalSource) => boolean;
	setResource: (resource: ResourceId, amount: DecimalSource) => void;
	getNonGeneratedThisTranscension: (resource: ResourceId) => ReturnType<typeof decimal>;
	setDragon: (changes: Partial<DragonState>) => void;
	addPopulation: (alive: DecimalSource, dead?: DecimalSource) => void;
	resetForArmageddon: () => void;
	resetForTranscension: (preservePopulation?: boolean) => void;
	reset: () => void;
}

const initialState = () => ({
	resources: createResourceAmounts({ population: WORLD_CONSTANTS.initialPopulation, shards: 5 }),
	totalThisArmageddon: createResourceAmounts({ population: WORLD_CONSTANTS.initialPopulation, shards: 5 }),
	totalThisTranscension: createResourceAmounts({ population: WORLD_CONSTANTS.initialPopulation, shards: 5 }),
	totalAllTime: createResourceAmounts({ population: WORLD_CONSTANTS.initialPopulation, shards: 5 }),
	generatedThisTranscension: createResourceAmounts(),
	dragon: {
		name: WORLD_CONSTANTS.dragon.defaultName,
		stage: 'egg' as const,
		ageDays: 0,
		fury: decimal(0),
		furyThreshold: decimal(WORLD_CONSTANTS.dragon.baseFuryThreshold),
		maxFury: decimal(WORLD_CONSTANTS.dragon.baseFuryThreshold * WORLD_CONSTANTS.dragon.furyDeathMultiplier),
		isAlive: true,
	},
	populationDead: decimal(0),
});

export const useResourceStore = create<ResourceStoreState>()(
	persist(
		(set, get) => ({
			...initialState(),
			addResource: (resource, amount, generated = false) => {
				const gain = decimal(amount);
				if (gain.eq(0)) return;
				set(state => {
					const nextResources = { ...state.resources, [resource]: state.resources[resource].plus(gain) };
					const nextDragon = resource === 'fury' ? { ...state.dragon, fury: nextResources.fury } : state.dragon;
					return {
						resources: nextResources,
						dragon: nextDragon,
						totalThisArmageddon: { ...state.totalThisArmageddon, [resource]: state.totalThisArmageddon[resource].plus(gain) },
						totalThisTranscension: { ...state.totalThisTranscension, [resource]: state.totalThisTranscension[resource].plus(gain) },
						totalAllTime: { ...state.totalAllTime, [resource]: state.totalAllTime[resource].plus(gain) },
						generatedThisTranscension: generated ? { ...state.generatedThisTranscension, [resource]: state.generatedThisTranscension[resource].plus(gain) } : state.generatedThisTranscension,
					};
				});
			},
			spendResource: (resource, amount) => {
				const cost = decimal(amount);
				if (cost.lt(0) || get().resources[resource].lt(cost)) return false;
				set(state => ({ resources: { ...state.resources, [resource]: state.resources[resource].minus(cost) } }));
				return true;
			},
			setResource: (resource, amount) =>
				set(state => {
					const resources = { ...state.resources, [resource]: decimal(amount) };
					return { resources, dragon: resource === 'fury' ? { ...state.dragon, fury: resources.fury } : state.dragon };
				}),
			getNonGeneratedThisTranscension: resource => decimal(0).max(get().totalThisTranscension[resource].minus(get().generatedThisTranscension[resource])),
			setDragon: changes =>
				set(state => {
					const dragon = { ...state.dragon, ...changes };
					return { dragon, resources: { ...state.resources, fury: dragon.fury } };
				}),
			addPopulation: (alive, dead = 0) =>
				set(state => ({
					resources: { ...state.resources, population: decimal(0).max(state.resources.population.plus(alive)) },
					populationDead: state.populationDead.plus(dead),
				})),
			resetForArmageddon: () =>
				set(state => ({
					resources: { ...state.resources, energy: decimal(0), fury: decimal(0) },
					totalThisArmageddon: createResourceAmounts({ population: state.resources.population }),
					dragon: { ...state.dragon, fury: decimal(0) },
				})),
			resetForTranscension: (preservePopulation = false) =>
				set(state => {
					const population = preservePopulation ? state.resources.population : decimal(WORLD_CONSTANTS.initialPopulation);
					return {
						resources: {
							...state.resources,
							energy: decimal(0),
							darkEnergy: decimal(0),
							plasma: decimal(0),
							// Dark Plasma is permanent Transcension currency.
							darkPlasma: state.resources.darkPlasma,
							chaosEnergy: state.resources.chaosEnergy,
							quarks: state.resources.quarks,
							microQuarks: state.resources.microQuarks,
							fury: decimal(0),
							population,
						},
						totalThisArmageddon: createResourceAmounts({ population }),
						totalThisTranscension: createResourceAmounts({ population }),
						generatedThisTranscension: createResourceAmounts(),
						dragon: { ...state.dragon, fury: decimal(0) },
						populationDead: preservePopulation ? state.populationDead : decimal(0),
					};
				}),
			reset: () => set(initialState()),
		}),
		{
			name: 'dragonfocus:resources',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({
				resources: serializeAmounts(state.resources),
				totalThisArmageddon: serializeAmounts(state.totalThisArmageddon),
				totalThisTranscension: serializeAmounts(state.totalThisTranscension),
				totalAllTime: serializeAmounts(state.totalAllTime),
				generatedThisTranscension: serializeAmounts(state.generatedThisTranscension),
				populationDead: serializeDecimal(state.populationDead),
				dragon: { ...state.dragon, fury: serializeDecimal(state.dragon.fury), furyThreshold: serializeDecimal(state.dragon.furyThreshold), maxFury: serializeDecimal(state.dragon.maxFury) },
			}),
			merge: (persisted, current) => {
				const stored = persisted as Partial<Record<'resources' | 'totalThisArmageddon' | 'totalThisTranscension' | 'totalAllTime' | 'generatedThisTranscension', PersistedResourceAmounts>> & { dragon?: Partial<DragonState> & { fury?: string; furyThreshold?: string; maxFury?: string }; populationDead?: string };
				return {
					...current,
					resources: hydrateAmounts(migrateMicroQuarks(stored.resources), current.resources),
					totalThisArmageddon: hydrateAmounts(migrateMicroQuarks(stored.totalThisArmageddon), current.totalThisArmageddon),
					totalThisTranscension: hydrateAmounts(migrateMicroQuarks(stored.totalThisTranscension), current.totalThisTranscension),
					totalAllTime: hydrateAmounts(migrateMicroQuarks(stored.totalAllTime), current.totalAllTime),
					generatedThisTranscension: hydrateAmounts(migrateMicroQuarks(stored.generatedThisTranscension), current.generatedThisTranscension),
					populationDead: deserializeDecimal(stored.populationDead, current.populationDead),
					dragon: stored.dragon ? { ...current.dragon, ...stored.dragon, fury: deserializeDecimal(stored.dragon.fury, current.dragon.fury), furyThreshold: deserializeDecimal(stored.dragon.furyThreshold, current.dragon.furyThreshold), maxFury: deserializeDecimal(stored.dragon.maxFury, current.dragon.maxFury) } : current.dragon,
				};
			},
		},
	),
);

/** Registers the canonical resource hook in the combined world store. */
export const createResourceSlice = () => ({ resourceStore: useResourceStore });
