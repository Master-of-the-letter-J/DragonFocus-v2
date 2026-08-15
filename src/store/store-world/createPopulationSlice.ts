import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { progressPopulation } from '@/data/calculations/formula-game';
import type { DragonFuryBand } from '@/types/world.types';
import { decimal, deserializeDecimal, serializeDecimal, type DecimalSource } from '@/utils/decimal';
import { scopeNestedSlice } from '../nested-slice';
import type { WorldSlice, WorldStoreState } from './_useWorldStore';

export interface HostileProgressionOptions {
	ticks: number;
	furyBand: DragonFuryBand;
	populationMultiplier: DecimalSource;
	zombieLevel?: number;
	cyborgLevel?: number;
	zombieIncinerationEffect?: number;
	cyborgIncinerationEffect?: number;
}

export interface PopulationStoreState {
	zombies: ReturnType<typeof decimal>;
	cyborgs: ReturnType<typeof decimal>;
	addZombies: (amount: DecimalSource) => void;
	addCyborgs: (amount: DecimalSource) => void;
	progressHostiles: (options: HostileProgressionOptions) => ReturnType<typeof decimal>;
	resetForTranscension: () => void;
	reset: () => void;
}

/** Population combat is isolated here; the resource store remains canonical for humans. */
export const createPopulationSlice: WorldSlice<'populationStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<WorldStoreState, 'populationStore', PopulationStoreState>('populationStore', set, get);

	return {
		populationStore: {
			zombies: decimal(0),
			cyborgs: decimal(0),
			addZombies: amount => setSlice(state => ({ zombies: decimal(0).max(state.zombies.plus(amount)) })),
			addCyborgs: amount => setSlice(state => ({ cyborgs: decimal(0).max(state.cyborgs.plus(amount)) })),
			progressHostiles: ({ ticks, furyBand, populationMultiplier, zombieLevel = 1, cyborgLevel = 1, zombieIncinerationEffect = 0, cyborgIncinerationEffect = 0 }) => {
				const state = getSlice();
				const humans = getRoot().resourceStore.resources.population;
				const zombieBaseScale = WORLD_CONSTANTS.population.zombieGrowth[furyBand];
				const zombieDecline = (furyBand === 'calm' || furyBand === 'normal') && state.zombies.gt(humans) ? WORLD_CONSTANTS.population.zombieOverpopulationDecline : 0;
				const extinctionDecline = humans.lte(0) ? WORLD_CONSTANTS.population.zombieExtinctionDecline : 0;
				const nextZombies = progressPopulation({
					initial: state.zombies,
					ticks,
					multiplier: populationMultiplier,
					level: zombieLevel,
					hostile: true,
					growthScale: zombieBaseScale - zombieDecline - extinctionDecline - Math.max(0, zombieIncinerationEffect),
				});

				const cyborgBaseScale = WORLD_CONSTANTS.population.cyborgGrowth[furyBand];
				const nextCyborgs = progressPopulation({
					initial: state.cyborgs,
					ticks,
					multiplier: populationMultiplier,
					level: cyborgLevel,
					hostile: true,
					growthScale: cyborgBaseScale - Math.max(0, cyborgIncinerationEffect),
				});

				const zombieCasualties = decimal(0).max(nextZombies.minus(state.zombies));
				// Trapezoidal integration keeps cyborg predation O(1) for long offline spans.
				const cyborgCasualties = state.cyborgs.plus(nextCyborgs).div(2).times(Math.max(0, ticks));
				setSlice({ zombies: nextZombies, cyborgs: nextCyborgs });
				return zombieCasualties.plus(cyborgCasualties);
			},
			resetForTranscension: () => setSlice({ zombies: decimal(0), cyborgs: decimal(0) }),
			reset: () => setSlice({ zombies: decimal(0), cyborgs: decimal(0) }),
		},
	};
};

export const serializePopulationState = (state: PopulationStoreState) => ({ zombies: serializeDecimal(state.zombies), cyborgs: serializeDecimal(state.cyborgs) });

export const hydratePopulationState = (persisted: unknown, current: PopulationStoreState): PopulationStoreState => {
	const stored = persisted as { zombies?: string; cyborgs?: string } | undefined;
	return { ...current, zombies: deserializeDecimal(stored?.zombies), cyborgs: deserializeDecimal(stored?.cyborgs) };
};
