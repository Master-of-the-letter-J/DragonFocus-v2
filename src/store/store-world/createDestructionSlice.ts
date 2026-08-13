import { create, type StateCreator } from 'zustand';
import { useProductionStore } from '../store-production/_useProductionStore';

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
const createDestructionStoreSlice: StateCreator<DestructionStoreState> = set => ({
	lastCause: undefined,
	lastDestroyed: 0,
	totalDestroyed: 0,
	applyDragonMassDestruction: dragonAgeDays => {
		const destroyed = useProductionStore.getState().applyDragonMassDestruction(dragonAgeDays);
		set(state => ({ lastCause: 'dragon-death', lastDestroyed: destroyed, totalDestroyed: state.totalDestroyed + destroyed }));
		return destroyed;
	},
	applyArmageddonDestruction: armageddonLevel => {
		const destroyed = useProductionStore.getState().applyArmageddonDestruction(armageddonLevel);
		set(state => ({ lastCause: 'armageddon', lastDestroyed: destroyed, totalDestroyed: state.totalDestroyed + destroyed }));
		return destroyed;
	},
	repairProducer: (producerId, quantity) => useProductionStore.getState().repairProducer(producerId, quantity),
	reset: () => set({ lastCause: undefined, lastDestroyed: 0, totalDestroyed: 0 }),
});

export const useDestructionStore = create<DestructionStoreState>()(createDestructionStoreSlice);

/** Registers destruction events in the combined world store. */
export const createDestructionSlice = () => ({ destructionStore: useDestructionStore });
