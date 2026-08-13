import { ARMAGEDDON_MONUMENTS, PRODUCTION_BY_ID, TRANSCENSION_MONUMENTS } from '@/data/production-data';
import { calculateExponentialGrowth } from '@/data/calculations/formula-production';
import type { ProductionItemBase, ResourceGrowth } from '@/types/production.types';
import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ProductionSpecialSlice } from './_useProductionSpecialStore';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useResourceStore } from '../store-world/createResourceSlice';
import { useProductionStore } from '../store-production/_useProductionStore';

export const FUELABLE_MONUMENT_IDS = ['eros', 'ananke', 'aether', 'chronos'] as const;
export type FuelableMonumentId = (typeof FUELABLE_MONUMENT_IDS)[number];

type FuelableMonumentConfig = {
	effectId: 'eros-monument' | 'ananke-monument' | 'aether-monument' | 'chronos-monument';
	fuelToken: 'quarks' | 'shards';
};

const fuelableMonuments: Record<FuelableMonumentId, FuelableMonumentConfig> = {
	eros: { effectId: 'eros-monument', fuelToken: 'quarks' },
	ananke: { effectId: 'ananke-monument', fuelToken: 'shards' },
	aether: { effectId: 'aether-monument', fuelToken: 'quarks' },
	chronos: { effectId: 'chronos-monument', fuelToken: 'quarks' },
};

const DEFAULT_FUEL_MINUTES = 30;
const SECONDS_PER_MINUTE = 60;
const BASE_CAPACITY_MINUTES = 30;
const monumentUpgradeGrowth = { base: 200_000, growthFactor: 2 } as const;

const initialFuelSeconds = (): Record<FuelableMonumentId, number> => ({ eros: 0, ananke: 0, aether: 0, chronos: 0 });
const initialUpgradeLevels = (): Record<FuelableMonumentId, number> => ({ eros: 1, ananke: 1, aether: 1, chronos: 1 });

const isMonument = (item: ProductionItemBase | undefined) => item?.kind === 'armageddon-monument' || item?.kind === 'transcension-monument';

/**
 * Owns both monument catalogues and the upgradeable fuel bars on the four
 * Primordial monuments. Purchasing the monument itself remains a production
 * transaction; this slice handles only its runtime behavior.
 */
export interface MonumentsStoreState {
	armageddonMonuments: readonly ProductionItemBase[];
	transcensionMonuments: readonly ProductionItemBase[];
	fuelSeconds: Record<FuelableMonumentId, number>;
	upgradeLevels: Record<FuelableMonumentId, number>;
	purchaseMonument: (itemId: string) => boolean;
	getFuelCapacitySeconds: (monument: FuelableMonumentId) => number;
	getFuelCost: (monument: FuelableMonumentId, minutes?: number) => ReturnType<typeof decimal>;
	fuelMonument: (monument: FuelableMonumentId, minutes?: number) => boolean;
	upgradeMonument: (monument: FuelableMonumentId) => boolean;
	tickMonuments: (seconds: number) => void;
	isMonumentActive: (monument: FuelableMonumentId) => boolean;
	resetFuelBars: () => void;
	respecMonumentUpgrades: () => boolean;
	resetForTranscension: () => void;
	reset: () => void;
}

const isUnlocked = (monument: FuelableMonumentId) => useProductionStore.getState().isEffectActive(fuelableMonuments[monument].effectId);

const upgradeCost = (): ResourceGrowth => ({ resource: 'plasma', ...monumentUpgradeGrowth });

const fuelCost = (level: number, minutes: number) =>
	decimal(1.5)
		.pow(Math.max(1, level))
		.times(minutes * SECONDS_PER_MINUTE);

export const useMonumentsStore = create<MonumentsStoreState>()(
	persist(
		(set, get) => ({
			armageddonMonuments: ARMAGEDDON_MONUMENTS,
			transcensionMonuments: TRANSCENSION_MONUMENTS,
			fuelSeconds: initialFuelSeconds(),
			upgradeLevels: initialUpgradeLevels(),
			purchaseMonument: itemId => {
				if (!isMonument(PRODUCTION_BY_ID[itemId])) return false;
				return useProductionStore.getState().purchase(itemId);
			},
			getFuelCapacitySeconds: monument => BASE_CAPACITY_MINUTES * SECONDS_PER_MINUTE * get().upgradeLevels[monument],
			getFuelCost: (monument, minutes = DEFAULT_FUEL_MINUTES) => fuelCost(get().upgradeLevels[monument], Math.max(1, Math.floor(minutes))),
			fuelMonument: (monument, minutes = DEFAULT_FUEL_MINUTES) => {
				if (!isUnlocked(monument)) return false;

				const state = get();
				const capacity = state.getFuelCapacitySeconds(monument);
				const remaining = capacity - state.fuelSeconds[monument];
				if (remaining <= SECONDS_PER_MINUTE) return false;

				const fundedMinutes = Math.min(Math.max(1, Math.floor(minutes)), Math.floor(remaining / SECONDS_PER_MINUTE));
				if (!fundedMinutes) return false;

				const config = fuelableMonuments[monument];
				const plasmaCost = fuelCost(state.upgradeLevels[monument], fundedMinutes);
				const resources = useResourceStore.getState();
				if (resources.resources[config.fuelToken].lt(1) || resources.resources.plasma.lt(plasmaCost)) return false;

				resources.spendResource(config.fuelToken, 1);
				resources.spendResource('plasma', plasmaCost);
				set(current => ({
					fuelSeconds: {
						...current.fuelSeconds,
						[monument]: Math.min(capacity, current.fuelSeconds[monument] + fundedMinutes * SECONDS_PER_MINUTE),
					},
				}));
				return true;
			},
			upgradeMonument: monument => {
				if (!isUnlocked(monument)) return false;
				const level = get().upgradeLevels[monument];
				const cost = upgradeCost();
				if (!useResourceStore.getState().spendResource(cost.resource, calculateExponentialGrowth(cost, Math.max(0, level - 1)))) return false;
				set(state => ({ upgradeLevels: { ...state.upgradeLevels, [monument]: state.upgradeLevels[monument] + 1 } }));
				return true;
			},
			tickMonuments: seconds => {
				if (!Number.isFinite(seconds) || seconds <= 0) return;
				set(state => ({
					fuelSeconds: Object.fromEntries(FUELABLE_MONUMENT_IDS.map(monument => [monument, Math.max(0, state.fuelSeconds[monument] - seconds)])) as Record<FuelableMonumentId, number>,
				}));
			},
			isMonumentActive: monument => get().fuelSeconds[monument] > 0,
			resetFuelBars: () => set({ fuelSeconds: initialFuelSeconds() }),
			respecMonumentUpgrades: () => {
				const state = get();
				const resources = useResourceStore.getState();
				for (const monument of FUELABLE_MONUMENT_IDS) {
					for (let level = 1; level < state.upgradeLevels[monument]; level += 1) {
						const cost = upgradeCost();
						resources.addResource(cost.resource, calculateExponentialGrowth(cost, level - 1));
					}
				}
				set({ fuelSeconds: initialFuelSeconds(), upgradeLevels: initialUpgradeLevels() });
				return true;
			},
			resetForTranscension: () => set({ fuelSeconds: initialFuelSeconds(), upgradeLevels: initialUpgradeLevels() }),
			reset: () => set({ fuelSeconds: initialFuelSeconds(), upgradeLevels: initialUpgradeLevels() }),
		}),
		{ name: 'dragonfocus:monuments', storage: createJSONStorage(() => AsyncStorage), partialize: state => ({ fuelSeconds: state.fuelSeconds, upgradeLevels: state.upgradeLevels }) },
	),
);

export const createMonumentsSlice: ProductionSpecialSlice<'monuments'> = () => ({ monuments: useMonumentsStore });
