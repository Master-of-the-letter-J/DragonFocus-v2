import { AMPLIFIERS } from '@/data/production-data';
import type { AmplifierDefinition } from '@/types/production.types';
import { create, type StateCreator } from 'zustand';
import { useProductionStore } from './_useProductionStore';

export interface AmplifierStoreState {
	amplifiers: readonly AmplifierDefinition[];
	buy: (amplifierId: string, quantity?: number) => boolean;
	sell: (amplifierId: string, quantity?: number) => boolean;
}

/** Amplifier state delegates canonical ownership to the production core. */
const createAmplifierStoreSlice: StateCreator<AmplifierStoreState> = () => ({
	amplifiers: AMPLIFIERS,
	buy: (amplifierId, quantity = 1) => (AMPLIFIERS.some(amplifier => amplifier.id === amplifierId) ? useProductionStore.getState().purchase(amplifierId, quantity) : false),
	sell: (amplifierId, quantity = 1) => (AMPLIFIERS.some(amplifier => amplifier.id === amplifierId) ? useProductionStore.getState().sell(amplifierId, quantity) : false),
});

export const useAmplifierStore = create<AmplifierStoreState>()(createAmplifierStoreSlice);

/** Registers the amplifier hook in the combined production store. */
export const createAmplifierSlice = () => ({ amplifierStore: useAmplifierStore });
