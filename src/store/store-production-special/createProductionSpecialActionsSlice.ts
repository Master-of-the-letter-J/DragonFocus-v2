import { useConvertorStore } from './createConvertorSlice';
import { useCrimsonHeartStore } from './createCrimsonHeartSlice';
import { useIncineratorStore } from './createIncineratorSlice';
import { useMonumentsStore } from './createMonumentsSlice';
import { useSpellsStore } from './createSpellsSlice';
import type { ProductionSpecialSlice } from './_useProductionSpecialStore';

export const createProductionSpecialActionsSlice: ProductionSpecialSlice<'resetProductionSpecial'> = () => ({
	resetProductionSpecial: () => {
		useConvertorStore.getState().reset();
		useCrimsonHeartStore.getState().reset();
		useIncineratorStore.getState().reset();
		useSpellsStore.getState().reset();
		useMonumentsStore.getState().reset();
	},
});
