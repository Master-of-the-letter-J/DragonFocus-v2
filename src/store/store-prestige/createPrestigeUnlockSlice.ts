import { PRODUCTION_BY_ID } from '@/data/production-data';
import { useProductionStore } from '../store-production/_useProductionStore';
import type { PrestigeSlice } from './prestige.types';

export const createPrestigeUnlockSlice: PrestigeSlice<'isMonumentUnlocked' | 'unlockMonument' | 'isProducerSpecialUnlocked' | 'unlockProducerSpecial'> = () => ({
	isMonumentUnlocked: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		return Boolean(item && (item.kind === 'armageddon-monument' || item.kind === 'transcension-monument') && (useProductionStore.getState().levels[itemId] ?? 0) > 0);
	},
	unlockMonument: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		return Boolean(item && (item.kind === 'armageddon-monument' || item.kind === 'transcension-monument') && useProductionStore.getState().purchase(itemId));
	},
	isProducerSpecialUnlocked: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		return Boolean(item && ['clicker', 'special-generator', 'energy-upgrade'].includes(item.kind) && (useProductionStore.getState().levels[itemId] ?? 0) > 0);
	},
	unlockProducerSpecial: itemId => {
		const item = PRODUCTION_BY_ID[itemId];
		return Boolean(item && ['clicker', 'special-generator', 'energy-upgrade'].includes(item.kind) && useProductionStore.getState().purchase(itemId));
	},
});
