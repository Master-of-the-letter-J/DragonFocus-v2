import { calculateGeometricCost } from '@/data/calculations/formula-production';
import { PRODUCERS_BY_ID, PRODUCTION_ITEMS } from '@/data/production-data';
import type { ProductionEffectId, ProductionItem } from '@/types/production.types';
import type { SpendableResourceId } from '@/types/resources.types';
import { scopeNestedSlice } from '../nested-slice';
import { useProductionSpecialStore } from '../store-production-special/_useProductionSpecialStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import type { ProductionSlice, ProductionStoreState } from './_useProductionStore';
import { getEvolutionSerumCost, getQuantumGrowthCost } from './createProducerSlice';

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
		useWorldStore.getState().resourceStore.addResource(cost.resource, refund);
	}
};

const itemsMatching = (predicate: (item: ProductionItem) => boolean, production: ProductionStoreState) => {
	return PRODUCTION_ITEMS.filter(item => predicate(item) && ((production.levels[item.id] ?? 0) > 0 || (production.paidCostLevels[item.id] ?? 0) > 0));
};

const refundAndClear = (items: readonly ProductionItem[], resources: readonly SpendableResourceId[], production: ProductionStoreState) => {
	if (!items.length) return false;
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

export const createRespecSlice: ProductionSlice<'respecStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionStoreState, 'respecStore', RespecStoreState>('respecStore', set, get);

	return {
		respecStore: {
			...initialState(),
			canRespec: power => {
		const production = getRoot();
		return production.isEffectActive('titan-pantheon') && production.isEffectActive(RESPEC_EFFECTS[power]) && useWorldStore.getState().resourceStore.resources.quarks.gte(QUARK_RESPEC_COST);
	},
	performRespec: power => {
		if (!getSlice().canRespec(power)) return false;

		const production = getRoot();
		let completed = false;
		switch (power) {
			case 'dark-energy':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'producer' || (item.kind === 'energy-upgrade' && item.costs.some(cost => cost.resource === 'darkEnergy')), production),
					['darkEnergy', 'plasma'],
					production,
				);
				break;
			case 'producers':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'producer' || item.kind === 'producer-upgrade', production),
					['energy', 'darkEnergy'],
					production,
				);
				break;
			case 'amplifiers':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'amplifier', production),
					['energy', 'plasma'],
					production,
				);
				if (completed) production.forgingStore.clearGilds('amplifier');
				break;
			case 'goal-multipliers': {
				const upgrades = production.goalMultiplierStore;
				const upgradeRefund = upgrades.respecUpgrades();
				const legacyItems = itemsMatching(item => item.kind === 'goal-multiplier', production);
				const refundedLegacyItems = refundAndClear(legacyItems, ['darkEnergy', 'plasma'], production);
				completed = !upgradeRefund.eq(0) || refundedLegacyItems;
				if (!upgradeRefund.eq(0)) useWorldStore.getState().resourceStore.addResource('darkEnergy', upgradeRefund);
				break;
			}
			case 'boost-upgrades':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'pomodoro-boost', production),
					['darkEnergy', 'plasma'],
					production,
				);
				break;
			case 'primordial-monuments':
				completed = FUELABLE_MONUMENTS_HAVE_PROGRESS();
				if (completed) useProductionSpecialStore.getState().monuments.respecMonumentUpgrades();
				break;
			case 'pantheons':
				completed = refundAndClear(
					itemsMatching(item => item.kind === 'deity' || item.kind === 'titan', production),
					['anomaly'],
					production,
				);
				if (completed) {
					production.forgingStore.clearForgedTargets('deity');
					production.forgingStore.clearForgedTargets('titan');
				}
				break;
			case 'chaos-growths': {
				const progress = production.producerStore.progress;
				const resources = useWorldStore.getState().resourceStore;
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
					production.producerStore.resetGrowthsAndEvolutions();
				}
				break;
			}
			case 'cyclopes-forge':
				completed = refundAndClear(
					itemsMatching(item => item.id === 'olympian-cyclopes-forge' || item.id === 'titan-cyclopes-forge', production),
					['anomaly'],
					production,
				);
				if (completed) {
					production.forgingStore.clearForgedTargets('deity');
					production.forgingStore.clearForgedTargets('titan');
				}
				break;
		}

		if (!completed) return false;
		useWorldStore.getState().resourceStore.spendResource('quarks', QUARK_RESPEC_COST);
		setSlice({ lastRespecAt: new Date().toISOString(), lastRespecPower: power });
		return true;
	},
	reset: () => setSlice(initialState()),
		},
	};
};

const FUELABLE_MONUMENTS_HAVE_PROGRESS = () => {
	const monuments = useProductionSpecialStore.getState().monuments;
	return Object.values(monuments.fuelSeconds).some(seconds => seconds > 0) || Object.values(monuments.upgradeLevels).some(level => level > 1);
};
