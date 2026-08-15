import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mergePersistedNestedState } from '../nested-slice';
import { createConvertorSlice, type ConvertorStoreState } from './createConvertorSlice';
import { createBlackMarketSlice, type BlackMarketStoreState } from './createBlackMarketSlice';
import { createCrimsonHeartSlice, type CrimsonHeartStoreState } from './createCrimsonHeartSlice';
import { createIncineratorSlice, type IncineratorStoreState } from './createIncineratorSlice';
import { createMonumentsSlice, type MonumentsStoreState } from './createMonumentsSlice';
import { createProductionSpecialActionsSlice } from './createProductionSpecialActionsSlice';
import { createSpellsSlice, type SpellsStoreState } from './createSpellsSlice';

export interface ProductionSpecialStoreState {
	convertor: ConvertorStoreState;
	blackMarket: BlackMarketStoreState;
	crimsonHeart: CrimsonHeartStoreState;
	incinerator: IncineratorStoreState;
	spells: SpellsStoreState;
	monuments: MonumentsStoreState;
	resetProductionSpecial: () => void;
}

export type ProductionSpecialSlice<Key extends keyof ProductionSpecialStoreState> = StateCreator<ProductionSpecialStoreState, [], [], Pick<ProductionSpecialStoreState, Key>>;

/** Combined entry point for convertors, the Heart, spells, and fuelable monuments. */
export const useProductionSpecialStore = create<ProductionSpecialStoreState>()(
	persist(
		(...store) => ({
			...createConvertorSlice(...store),
			...createBlackMarketSlice(...store),
			...createCrimsonHeartSlice(...store),
			...createIncineratorSlice(...store),
			...createSpellsSlice(...store),
			...createMonumentsSlice(...store),
			...createProductionSpecialActionsSlice(...store),
		}),
		{
			name: 'dragonfocus:production-special',
			storage: createJSONStorage(() => AsyncStorage),
			merge: (persisted, current) => mergePersistedNestedState(persisted, current, ['convertor', 'blackMarket', 'crimsonHeart', 'incinerator', 'spells', 'monuments']),
		},
	),
);
