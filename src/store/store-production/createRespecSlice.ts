import { calculateGeometricCost } from '@/data/calculations/formula-production';
import { PRODUCERS_BY_ID, PRODUCTION_ITEMS } from '@/data/production-data';
import type { ProductionEffectId, ProductionItem } from '@/types/production.types';
import type { SpendableResourceId } from '@/types/resources.types';
import { create, type StateCreator } from 'zustand';
import { useResourceStore } from '../store-world/createResourceSlice';
import { getEvolutionSerumCost, getQuantumGrowthCost, useProductionStore } from './_useProductionStore';
import { useGoalMultiplierStore } from './createGoalMultiplierSlice';
import { useMonumentsStore } from '../store-production-special/createMonumentsSlice';

export type RespecPowerId = 'dark-energy' | 'producers' | 'amplifiers' | 'goal-multipliers' | 'boost-upgrades' | 'primordial-monuments' | 'pantheons' | 'chaos-growths' | 'cyclopes-forge';

const RESPEC_EFFECTS: Record<RespecPowerId, ProductionEffectId> = {
	'dark-energy': 'dark-energy-respec',
	producers: 'producer-respec',
	amplifiers: 'amplifier-respec',
	'goal-multipliers': 'goal-multiplier-respec',
	'boost-upgrades': 'boost-respec',
	'primordial-monuments': 'primordial-monument-respec',
	pantheons: 'pantheon-respec',
	'chaos-growths': 'chaos-respec',
	'cyclopes-forge': 'forge-respec',
};

const QUARK_RESPEC_COST = 5;

const fullRefund = (item: ProductionItem, level: number, paidLevel: number, resources: readonly SpendableResourceId[]) => {
	for (const cost of item.costs) {
		if (!resources.includes(cost.resource)) continue;
		const refundedLevels = item.oneTimeUntilTranscension?.includes(cost.resource) ? Math.max(level, paidLevel) : level;
		const refund = calculateGeometricCost(cost, 0, refundedLevels);
		useResourceStore.getState().addResource(cost.resource, refund);
	}
};

const itemsMatching = (predicate: (item: ProductionItem) => boolean) => {
	const production = useProductionStore.getState();
	return PRODUCTION_ITEMS.filter(item => predicate(item) && ((production.levels[item.id] ?? 0) > 0 || (production.paidCostLevels[item.id] ?? 0) > 0));
};

const refundAndClear = (items: readonly ProductionItem[], resources: readonly SpendableResourceId[]) => {
	if (!items.length) return false;
	const production = useProductionStore.getState();
	for (const item of items) fullRefund(item, production.levels[item.id] ?? 0, production.paidCostLevels[item.id] ?? 0, resources);
	production.clearItems(items.map(item => item.id));
	return true;
};

/** Respec powers are permanent unlocks; each completed respec spends five Quarks. */
export interface RespecStoreState {
	lastRespecAt?: string;
	lastRespecPower?: RespecPowerId;
	canRespec: (power: RespecPowerId) => boolean;
	performRespec: (power: RespecPowerId) => boolean;
	reset: () => void;
}

const initialState = () => ({ lastRespecAt: undefined as string | undefined, lastRespecPower: undefined as RespecPowerId | undefined });

const createRespecStoreSlice: StateCreator<RespecStoreState> = (set, get) => ({
	...initialState(),
	canRespec: power => {
		const production = useProductionStore.getState();
		return production.isEffectActive('titan-pantheon') && production.isEffectActive(RESPEC_EFFECTS[power]) && useResourceStore.getState().resources.quarks.gte(QUARK_RESPEC_COST);
	},
	performRespec: power => {
		if (!get().canRespec(power)) return false;

		const production = useProductionStore.getState();
		let completed = false;
		switch (power) {
			case 'dark-energy':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'producer' || (item.kind === 'energy-upgrade' && item.costs.some(cost => cost.resource === 'darkEnergy'))),
					['darkEnergy', 'plasma'],
				);
				break;
			case 'producers':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'producer' || item.kind === 'producer-upgrade'),
					['energy', 'darkEnergy'],
				);
				break;
			case 'amplifiers':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'amplifier'),
					['energy', 'plasma'],
				);
				if (completed) production.clearGilds('amplifier');
				break;
			case 'goal-multipliers': {
				const upgrades = useGoalMultiplierStore.getState();
				const upgradeRefund = upgrades.respecUpgrades();
				const legacyItems = itemsMatching(item => item.kind === 'goal-multiplier');
				const refundedLegacyItems = refundAndClear(legacyItems, ['darkEnergy', 'plasma']);
				completed = !upgradeRefund.eq(0) || refundedLegacyItems;
				if (!upgradeRefund.eq(0)) useResourceStore.getState().addResource('darkEnergy', upgradeRefund);
				production.clearGilds('goal');
				break;
			}
			case 'boost-upgrades':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'pomodoro-boost'),
					['darkEnergy', 'plasma'],
				);
				break;
			case 'primordial-monuments':
				completed = FUELABLE_MONUMENTS_HAVE_PROGRESS();
				if (completed) useMonumentsStore.getState().respecMonumentUpgrades();
				break;
			case 'pantheons':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'deity' || item.kind === 'titan'),
					['anomaly'],
				);
				if (completed) {
					production.clearForgedTargets('deity');
					production.clearForgedTargets('titan');
				}
				break;
			case 'chaos-growths': {
				const progress = production.producerProgress;
				const resources = useResourceStore.getState();
				completed = Object.values(progress).some(entry => entry.quantumGrowths > 0 || entry.evolutions > 0);
				if (completed) {
					// Replay every growth and serum cost before charging the respec fee.
					for (const [id, entry] of Object.entries(progress)) {
						const producer = PRODUCERS_BY_ID[id];
						if (!producer) continue;

						for (let growth = 0; growth < entry.quantumGrowths; growth += 1) {
							const cost = getQuantumGrowthCost(producer, growth);
							resources.addResource(cost.plasmaResource, cost.plasma);
							resources.addResource(cost.quarkResource, cost.quarks);
						}
						for (let evolution = 1; evolution <= entry.evolutions; evolution += 1) {
							const serum = getEvolutionSerumCost(producer, evolution);
							resources.addResource('darkPlasma', serum.darkPlasma);
							resources.addResource('quarks', serum.quarks);
						}
					}
					production.resetGrowthsAndEvolutions();
				}
				break;
			}
			case 'cyclopes-forge':
				completed = refundAndClear(
					itemsMatching(item => item.id === 'olympian-cyclopes-forge' || item.id === 'titan-cyclopes-forge'),
					['anomaly'],
				);
				if (completed) {
					production.clearForgedTargets('deity');
					production.clearForgedTargets('titan');
				}
				break;
		}

		if (!completed) return false;
		useResourceStore.getState().spendResource('quarks', QUARK_RESPEC_COST);
		set({ lastRespecAt: new Date().toISOString(), lastRespecPower: power });
		return true;
	},
	reset: () => set(initialState()),
});

export const useRespecStore = create<RespecStoreState>()(createRespecStoreSlice);

/** Registers respec powers in the combined production store. */
export const createRespecSlice = () => ({ respecStore: useRespecStore });

const FUELABLE_MONUMENTS_HAVE_PROGRESS = () => {
	const monuments = useMonumentsStore.getState();
	return Object.values(monuments.fuelSeconds).some(seconds => seconds > 0) || Object.values(monuments.upgradeLevels).some(level => level > 1);
};
