import { MILESTONES } from '@/data/world-data/milestones';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDestructionSlice, type DestructionStoreState } from './createDestructionSlice';
import { createDragonSlice, type DragonStoreState } from './createDragonSlice';
import { createPopulationSlice, hydratePopulationState, serializePopulationState, type PopulationStoreState } from './createPopulationSlice';
import { createResourceSlice, hydrateResourceState, serializeResourceState, type ResourceStoreState } from './createResourceSlice';
import { createWorldOptionsSlice, type WorldOptionsStoreState } from './createWorldOptionsSlice';

export interface WorldStoreState {
	resourceStore: ResourceStoreState;
	populationStore: PopulationStoreState;
	destructionStore: DestructionStoreState;
	dragonStore: DragonStoreState;
	optionsStore: WorldOptionsStoreState;
	claimedMilestones: number[];
	claimMilestone: (milestone: number) => boolean;
	reset: () => void;
}

type WorldCoreState = Pick<WorldStoreState, 'claimedMilestones' | 'claimMilestone' | 'reset'>;
export type WorldSlice<Keys extends keyof WorldStoreState> = StateCreator<WorldStoreState, [], [], Pick<WorldStoreState, Keys>>;

const initialWorldState = () => ({ claimedMilestones: [0] as number[] });

const createWorldCoreSlice: StateCreator<WorldStoreState, [], [], WorldCoreState> = (set, get) => ({
	...initialWorldState(),
	claimMilestone: milestoneId => {
		const milestone = MILESTONES.find(candidate => candidate.id === milestoneId);
		if (!milestone || get().claimedMilestones.includes(milestoneId) || get().resourceStore.totalAllTime.energy.lt(milestone.energy)) return false;
		get().resourceStore.addResource('shards', milestone.shards);
		set(state => ({ claimedMilestones: [...state.claimedMilestones, milestoneId] }));
		return true;
	},
	reset: () => {
		get().resourceStore.reset();
		get().populationStore.reset();
		get().destructionStore.reset();
		get().dragonStore.reset();
		get().optionsStore.reset();
		set(initialWorldState());
	},
});

/** World is now only the world-domain composition point; progression lives online. */
export const useWorldStore = create<WorldStoreState>()(
	persist(
		(...store) => ({
			...createWorldCoreSlice(...store),
			...createResourceSlice(...store),
			...createPopulationSlice(...store),
			...createDestructionSlice(...store),
			...createDragonSlice(...store),
			...createWorldOptionsSlice(...store),
		}),
		{
			name: 'dragonfocus:world',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({
				claimedMilestones: state.claimedMilestones,
				resourceStore: serializeResourceState(state.resourceStore),
				populationStore: serializePopulationState(state.populationStore),
				destructionStore: state.destructionStore,
				dragonStore: state.dragonStore,
				optionsStore: state.optionsStore,
			}),
			merge: (persisted, current) => {
				const stored = persisted as Partial<WorldStoreState>;
				return {
					...current,
					claimedMilestones: Array.isArray(stored.claimedMilestones) ? [...new Set(stored.claimedMilestones.filter(Number.isFinite))] : current.claimedMilestones,
					resourceStore: hydrateResourceState(stored.resourceStore, current.resourceStore),
					populationStore: hydratePopulationState(stored.populationStore, current.populationStore),
					destructionStore: { ...current.destructionStore, ...stored.destructionStore },
					dragonStore: { ...current.dragonStore, ...stored.dragonStore },
					optionsStore: { ...current.optionsStore, ...stored.optionsStore },
				};
			},
		},
	),
);
