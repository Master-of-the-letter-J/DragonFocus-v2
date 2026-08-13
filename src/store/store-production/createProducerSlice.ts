import { PRODUCERS, PRODUCERS_BY_ID } from '@/data/production-data';
import type { ProducerDefinition } from '@/types/production.types';
import { create, type StateCreator } from 'zustand';
import { getProducerDisplayName, useProductionStore } from './_useProductionStore';

export interface ProducerStoreState {
	producers: readonly ProducerDefinition[];
	buy: (producerId: string, quantity?: number) => boolean;
	sell: (producerId: string, quantity?: number) => boolean;
	grow: (producerId: string) => boolean;
	evolve: (producerId: string) => boolean;
	metamorphose: (producerId: string) => boolean;
	getDisplayName: (producerId: string) => string | undefined;
}

/** Producer-focused state delegates canonical ownership to the production core. */
const createProducerStoreSlice: StateCreator<ProducerStoreState> = () => ({
	producers: PRODUCERS,
	buy: (producerId, quantity = 1) => (PRODUCERS_BY_ID[producerId] ? useProductionStore.getState().purchase(producerId, quantity) : false),
	sell: (producerId, quantity = 1) => (PRODUCERS_BY_ID[producerId] ? useProductionStore.getState().sell(producerId, quantity) : false),
	grow: producerId => useProductionStore.getState().growProducer(producerId),
	evolve: producerId => useProductionStore.getState().evolveProducer(producerId),
	metamorphose: producerId => useProductionStore.getState().metamorphoseProducer(producerId),
	getDisplayName: producerId => {
		const producer = PRODUCERS_BY_ID[producerId];
		if (!producer) return undefined;
		const progress = useProductionStore.getState().producerProgress[producerId] ?? { quantumGrowths: 0, evolutions: 0, metamorphosed: false };
		return getProducerDisplayName(producer, progress);
	},
});

export const useProducerStore = create<ProducerStoreState>()(createProducerStoreSlice);

/** Registers the producer hook in the combined production store. */
export const createProducerSlice = () => ({ producerStore: useProducerStore });
