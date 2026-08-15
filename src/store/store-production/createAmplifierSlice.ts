import { AMPLIFIERS } from '@/data/production-data';
import type { AmplifierDefinition } from '@/types/production.types';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSlice, ProductionStoreState } from './_useProductionStore';

export interface AmplifierStoreState {
	amplifiers: readonly AmplifierDefinition[];
	unlockedIds: string[];
	buy: (amplifierId: string, quantity?: number) => boolean;
	sell: (amplifierId: string, quantity?: number) => boolean;
	isUnlocked: (amplifierId: string) => boolean;
	recordPurchase: (amplifierId: string, nextLevel: number) => void;
	reset: () => void;
}

const initialState = () => ({
	amplifiers: AMPLIFIERS,
	unlockedIds: [AMPLIFIERS[0].id],
});

/** Owns the amplifier catalogue, tier unlocks, and purchases. */
export const createAmplifierSlice: ProductionSlice<'amplifierStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionStoreState, 'amplifierStore', AmplifierStoreState>('amplifierStore', set, get);

	return {
		amplifierStore: {
			...initialState(),
			buy: (amplifierId, quantity = 1) => (AMPLIFIERS.some(amplifier => amplifier.id === amplifierId) ? getRoot().purchase(amplifierId, quantity) : false),
			sell: (amplifierId, quantity = 1) => (AMPLIFIERS.some(amplifier => amplifier.id === amplifierId) ? getRoot().sell(amplifierId, quantity) : false),
			isUnlocked: amplifierId => getSlice().unlockedIds.includes(amplifierId),
			recordPurchase: (amplifierId, nextLevel) => {
				const amplifierIndex = AMPLIFIERS.findIndex(amplifier => amplifier.id === amplifierId);
				const nextAmplifierId = amplifierIndex >= 0 && nextLevel >= 5 ? AMPLIFIERS[amplifierIndex + 1]?.id : undefined;
				if (nextAmplifierId && !getSlice().unlockedIds.includes(nextAmplifierId)) setSlice(state => ({ unlockedIds: [...state.unlockedIds, nextAmplifierId] }));
			},
			reset: () => setSlice(initialState()),
		},
	};
};
