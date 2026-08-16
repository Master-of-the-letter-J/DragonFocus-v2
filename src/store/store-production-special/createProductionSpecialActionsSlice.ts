import type { ProductionSpecialSlice } from './_useProductionSpecialStore';

export const createProductionSpecialActionsSlice: ProductionSpecialSlice<'resetProductionSpecial'> = (_set, get) => ({
	resetProductionSpecial: () => {
		get().convertor.reset();
		get().blackMarket.reset();
		get().crimsonHeart.reset();
		get().incinerator.reset();
		get().spells.reset();
		get().monuments.reset();
	},
});
