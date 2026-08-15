import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { decimal } from '@/utils/decimal';
import { useProductionSpecialStore } from '../store-production-special/_useProductionSpecialStore';
import { useProductionStore } from '../store-production/_useProductionStore';
import { PRODUCERS_BY_ID } from '@/data/production-data';
import { getQuantumGrowthCost } from '../store-production/createProducerSlice';
import { useStatsStore } from '../useStatsStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { initialPrestigeState, type PrestigeSlice } from './prestige.types';

export const createTrascensionSlice: PrestigeSlice<'commitTranscension' | 'recordTranscension'> = (set, get) => ({
	commitTranscension: () => {
		const world = useWorldStore.getState();
		const resources = world.resourceStore;
		if (resources.totalThisTranscension.darkEnergy.lt(WORLD_CONSTANTS.transcensionDarkEnergyBase)) return false;

		const quarkMultiplier = decimal(1).plus(resources.totalAllTime.quarks.times(0.01));
		const plasmaPotential = resources.totalAllTime.plasma
			.div(1_000)
			.pow(1 / 3)
			.times(quarkMultiplier);
		const anomalyGain = plasmaPotential.minus(get().anomaliesFromPlasma).max(0);
		const darkPlasmaGain = resources.totalThisTranscension.darkEnergy.max(0);
		if (anomalyGain.lte(0) && darkPlasmaGain.lte(0)) return false;

		resources.addResource('anomaly', anomalyGain);
		resources.addResource('darkPlasma', darkPlasmaGain);
		let quarkRefund = decimal(0);
		for (const [producerId, progress] of Object.entries(useProductionStore.getState().producerStore.progress)) {
			const producer = PRODUCERS_BY_ID[producerId];
			if (!producer) continue;
			for (let growth = 0; growth < progress.quantumGrowths; growth += 1) {
				const cost = getQuantumGrowthCost(producer, growth);
				quarkRefund = quarkRefund.plus(cost.quarks);
			}
		}
		resources.setResource('quarks', resources.resources.quarks.plus(quarkRefund));
		resources.resetForTranscension(useProductionStore.getState().isEffectActive('nyx-realm'));
		useProductionStore.getState().resetForTranscension();
		world.populationStore.resetForTranscension();
		const special = useProductionSpecialStore.getState();
		special.spells.clearActiveSpells();
		special.monuments.resetForTranscension();
		special.incinerator.resetForTranscension();
		get().setTitanomachyActive(false);
		get().setTartarusActive(false);
		special.crimsonHeart.setCharge(0);
		useStatsStore.getState().recordPrestige('transcension');
		get().recordTranscension(plasmaPotential.toString());
		return true;
	},
	recordTranscension: (plasmaAnomalies = '0') =>
		set(state => ({
			transcensionCount: state.transcensionCount + 1,
			armageddonCount: 0,
			apocalypseLevels: initialPrestigeState().apocalypseLevels,
			anomaliesFromPlasma: plasmaAnomalies,
		})),
});
