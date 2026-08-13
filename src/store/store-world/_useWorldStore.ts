import { MILESTONES } from '@/data/world-data/milestones';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDestructionSlice, useDestructionStore } from './createDestructionSlice';
import { createDragonSlice, useDragonStore } from './createDragonSlice';
import { createPopulationSlice, usePopulationStore } from './createPopulationSlice';
import { createResourceSlice, useResourceStore } from './createResourceSlice';
import { createWorldOptionsSlice, useWorldOptionsStore } from './createWorldOptionsSlice';

export interface WorldStoreState {
	resourceStore: typeof useResourceStore;
	populationStore: typeof usePopulationStore;
	destructionStore: typeof useDestructionStore;
	dragonStore: typeof useDragonStore;
	optionsStore: typeof useWorldOptionsStore;
	claimedMilestones: number[];
	claimMilestone: (milestone: number) => boolean;
	reset: () => void;
}

type WorldCoreState = Pick<WorldStoreState, 'claimedMilestones' | 'claimMilestone' | 'reset'>;

const initialWorldState = () => ({ claimedMilestones: [0] as number[] });

const createWorldCoreSlice: StateCreator<WorldStoreState, [], [], WorldCoreState> = (set, get) => ({
	...initialWorldState(),
	claimMilestone: milestoneId => {
		const milestone = MILESTONES.find(candidate => candidate.id === milestoneId);
		if (!milestone || get().claimedMilestones.includes(milestoneId) || useResourceStore.getState().totalAllTime.energy.lt(milestone.energy)) return false;
		useResourceStore.getState().addResource('shards', milestone.shards);
		set(state => ({ claimedMilestones: [...state.claimedMilestones, milestoneId] }));
		return true;
	},
	reset: () => {
		useResourceStore.getState().reset();
		usePopulationStore.getState().reset();
		useDestructionStore.getState().reset();
		useDragonStore.getState().reset();
		useWorldOptionsStore.getState().reset();
		set(initialWorldState());
	},
});

/** World is now only the world-domain composition point; progression lives online. */
export const useWorldStore = create<WorldStoreState>()(
	persist(
		(...store) => ({
			...createWorldCoreSlice(...store),
			...createResourceSlice(),
			...createPopulationSlice(),
			...createDestructionSlice(),
			...createDragonSlice(),
			...createWorldOptionsSlice(),
		}),
		{
			name: 'dragonfocus:world',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({ claimedMilestones: state.claimedMilestones }),
			merge: (persisted, current) => {
				const stored = persisted as { claimedMilestones?: number[] };
				return {
					...current,
					claimedMilestones: Array.isArray(stored.claimedMilestones) ? [...new Set(stored.claimedMilestones.filter(Number.isFinite))] : current.claimedMilestones,
				};
			},
		},
	),
);
