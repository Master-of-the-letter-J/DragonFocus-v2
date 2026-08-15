import { useProductionStore } from '../store-production/_useProductionStore';
import { scopeNestedSlice } from '../nested-slice';
import type { WorldSlice, WorldStoreState } from './_useWorldStore';

export interface DestructionStoreState {
	lastCause?: 'dragon-death' | 'armageddon';
	lastDestroyed: number;
	totalDestroyed: number;
	applyDragonMassDestruction: (dragonAgeDays: number) => number;
	applyArmageddonDestruction: (armageddonLevel: number) => number;
	repairProducer: (producerId: string, quantity?: number) => boolean;
	reset: () => void;
}

/** Coordinates discrete destruction events; normal dragon attacks affect population only. */
export const createDestructionSlice: WorldSlice<'destructionStore'> = (set, get) => {
	const { setSlice } = scopeNestedSlice<WorldStoreState, 'destructionStore', DestructionStoreState>('destructionStore', set, get);

	return {
		destructionStore: {
			lastCause: undefined,
			lastDestroyed: 0,
			totalDestroyed: 0,
			applyDragonMassDestruction: dragonAgeDays => {
				const destroyed = useProductionStore.getState().producerStore.applyDragonMassDestruction(dragonAgeDays);
				setSlice(state => ({ lastCause: 'dragon-death', lastDestroyed: destroyed, totalDestroyed: state.totalDestroyed + destroyed }));
				return destroyed;
			},
			applyArmageddonDestruction: armageddonLevel => {
				const destroyed = useProductionStore.getState().producerStore.applyArmageddonDestruction(armageddonLevel);
				setSlice(state => ({ lastCause: 'armageddon', lastDestroyed: destroyed, totalDestroyed: state.totalDestroyed + destroyed }));
				return destroyed;
			},
			repairProducer: (producerId, quantity) => useProductionStore.getState().producerStore.repair(producerId, quantity),
			reset: () => setSlice({ lastCause: undefined, lastDestroyed: 0, totalDestroyed: 0 }),
		},
	};
};
