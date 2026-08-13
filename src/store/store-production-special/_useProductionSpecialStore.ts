import { create, type StateCreator } from 'zustand';
import { createConvertorSlice, useConvertorStore } from './createConvertorSlice';
import { createBlackMarketSlice, useBlackMarketStore } from './createBlackMarketSlice';
import { createCrimsonHeartSlice, useCrimsonHeartStore } from './createCrimsonHeartSlice';
import { createIncineratorSlice, useIncineratorStore } from './createIncineratorSlice';
import { createMonumentsSlice, useMonumentsStore } from './createMonumentsSlice';
import { createProductionSpecialActionsSlice } from './createProductionSpecialActionsSlice';
import { createSpellsSlice, useSpellsStore } from './createSpellsSlice';

export interface ProductionSpecialStoreState {
	convertor: typeof useConvertorStore;
	blackMarket: typeof useBlackMarketStore;
	crimsonHeart: typeof useCrimsonHeartStore;
	incinerator: typeof useIncineratorStore;
	spells: typeof useSpellsStore;
	monuments: typeof useMonumentsStore;
	resetProductionSpecial: () => void;
}

export type ProductionSpecialSlice<Key extends keyof ProductionSpecialStoreState> = StateCreator<ProductionSpecialStoreState, [], [], Pick<ProductionSpecialStoreState, Key>>;

/** Combined entry point for convertors, the Heart, spells, and fuelable monuments. */
export const useProductionSpecial = create<ProductionSpecialStoreState>()((...store) => ({
	...createConvertorSlice(...store),
	...createBlackMarketSlice(...store),
	...createCrimsonHeartSlice(...store),
	...createIncineratorSlice(...store),
	...createSpellsSlice(...store),
	...createMonumentsSlice(...store),
	...createProductionSpecialActionsSlice(...store),
}));
