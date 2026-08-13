import { PRODUCTION_BY_ID } from '@/data/production-data';
import { useProductionStore } from '../store-production/_useProductionStore';
import type { PrestigeSlice } from './prestige.types';

export const createDeitySlice: PrestigeSlice<'unlockDeity' | 'unlockTitan' | 'setTitanomachyActive' | 'setTartarusActive'> = (set, get) => ({
	unlockDeity: itemId => PRODUCTION_BY_ID[itemId]?.kind === 'deity' && useProductionStore.getState().purchase(itemId),
	unlockTitan: itemId => PRODUCTION_BY_ID[itemId]?.kind === 'titan' && useProductionStore.getState().purchase(itemId),
	setTitanomachyActive: active => {
		const production = useProductionStore.getState();
		const permitted = production.isEffectActive('chaos-awakened') && !get().tartarusActive && (production.levels.zeus ?? 0) > 0 && (production.levels.kronos ?? 0) > 0;
		if (active && !permitted) return false;
		set({ titanomachyActive: active });
		return true;
	},
	setTartarusActive: active => {
		const production = useProductionStore.getState();
		if (active && ((production.levels.kronos ?? 0) <= 0 || !production.isEffectActive('tartarus-unlocked'))) return false;
		set({ tartarusActive: active, titanomachyActive: active ? false : get().titanomachyActive });
		return true;
	},
});
