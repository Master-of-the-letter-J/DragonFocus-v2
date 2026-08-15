import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { calculateGreatSacrificeMultiplier, calculateSpellMultiplier } from '@/data/calculations/formula-resources';
import type { GoalMultiplierArchetype } from '@/types/goal-multiplier.types';
import { decimal, decimalMax, decimalMin } from '@/utils/decimal';
import { useProductionSpecialStore } from '../store-production-special/_useProductionSpecialStore';
import { getDeityLevels, useProductionStore } from '../store-production/_useProductionStore';
import { useStatsStore } from '../useStatsStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { initialPrestigeState, type ApocalypseType, type PrestigeSlice } from './prestige.types';

export const createArmageddonSlice: PrestigeSlice<'setSelectedApocalypse' | 'unlockApocalypse' | 'upgradeApocalypse' | 'respecApocalypseUpgrades' | 'commitArmageddon' | 'recordArmageddon' | 'recordApocalypse'> = (set, get) => ({
	setSelectedApocalypse: selectedApocalypse => {
		if (get().completedApocalypses.includes(selectedApocalypse)) set({ selectedApocalypse });
	},
	unlockApocalypse: type => {
		const state = get();
		if (state.completedApocalypses.includes(type)) return false;

		const requiredArchetypes: Partial<Record<ApocalypseType, readonly GoalMultiplierArchetype[]>> = {
			freeze: ['personal', 'scholar'],
			wrath: ['personal', 'athlete'],
			reincarnation: ['fellowship', 'scholar'],
			invasion: ['fellowship', 'entrepreneur'],
			roulette: ['entrepreneur', 'balanced'],
		};
		const goalLevels = useProductionStore.getState().goalMultiplierStore.levels;
		if (!(requiredArchetypes[type] ?? []).every(archetype => goalLevels[archetype] >= 1)) return false;

		const cost = decimal(100).times(decimal(100).pow(state.completedApocalypses.length));
		if (!useWorldStore.getState().resourceStore.spendResource('plasma', cost)) return false;
		set(current => ({
			completedApocalypses: [...current.completedApocalypses, type],
			apocalypseLevels: { ...current.apocalypseLevels, [type]: 0 },
		}));
		return true;
	},
	upgradeApocalypse: type => {
		const state = get();
		if (!state.completedApocalypses.includes(type)) return false;

		const level = state.apocalypseLevels[type] ?? 0;
		const darkPlasmaCost = type === 'sacrifice' ? decimal(5).times(decimal(5).pow(level)) : decimal(25).times(decimal(25).pow(level));
		const resources = useWorldStore.getState().resourceStore;
		if (type !== 'sacrifice' && resources.totalAllTime.plasma.lt(decimal(10_000).times(decimal(100).pow(level)))) return false;
		if (resources.resources.darkPlasma.lt(darkPlasmaCost)) return false;

		resources.spendResource('darkPlasma', darkPlasmaCost);
		set(current => ({ apocalypseLevels: { ...current.apocalypseLevels, [type]: level + 1 } }));
		return true;
	},
	respecApocalypseUpgrades: () => {
		const state = get();
		const resources = useWorldStore.getState().resourceStore;
		if (resources.resources.anomaly.lt(5) || resources.resources.quarks.lt(5)) return false;
		const refund = (Object.entries(state.apocalypseLevels) as [ApocalypseType, number][]).reduce((total, [type, levels]) => {
			const base = type === 'sacrifice' ? decimal(5) : decimal(25);
			const growth = type === 'sacrifice' ? decimal(5) : decimal(25);
			return total.plus(levels > 0 ? base.times(growth.pow(levels).minus(1)).div(growth.minus(1)) : 0);
		}, decimal(0));
		resources.addResource('darkPlasma', refund);
		resources.spendResource('quarks', 5);
		set({ apocalypseLevels: initialPrestigeState().apocalypseLevels });
		return true;
	},
	commitArmageddon: () => {
		const world = useWorldStore.getState();
		const resources = world.resourceStore;
		if (resources.totalThisTranscension.darkEnergy.lt(WORLD_CONSTANTS.armageddonDarkEnergyBase)) return false;

		const production = useProductionStore.getState();
		const deityLevels = getDeityLevels(production.levels);
		const apocalypse = get().selectedApocalypse;
		const enabled = get().completedApocalypses;
		const baseLevel = Math.max(1, get().apocalypseLevels.sacrifice ?? 0);
		const spellMultiplier = calculateSpellMultiplier(useProductionSpecialStore.getState().spells.activeSpells, 'armageddon');
		const level = baseLevel * calculateGreatSacrificeMultiplier(deityLevels.iapetus ?? 0, resources.resources.chaosEnergy);
		const populationAvailable = decimalMax(resources.resources.population, 0);
		const basePlasma = resources.totalThisArmageddon.energy
			.pow(1 / 3)
			.times(decimal(2).pow(level))
			.times(decimal(2).pow(deityLevels.hades ?? 0))
			.times(spellMultiplier);
		const goalStore = production.goalMultiplierStore;
		const pairs: Partial<Record<ApocalypseType, readonly GoalMultiplierArchetype[]>> = {
			freeze: ['personal', 'scholar'],
			wrath: ['personal', 'athlete'],
			reincarnation: ['fellowship', 'scholar'],
			invasion: ['fellowship', 'entrepreneur'],
			roulette: ['entrepreneur', 'balanced'],
		};
		const combinedMultiplier = enabled.reduce((product, type) => {
			if (type === 'sacrifice') return product;
			const goalProduct = (pairs[type] ?? []).reduce((value, archetype) => value * goalStore.getDarkEnergyMultiplier(archetype), 1);
			const effect = decimal(Math.max(1, goalProduct))
				.pow(1 / 3)
				.times(decimal(2).pow(get().apocalypseLevels[type] ?? 0));
			return product.times(effect);
		}, decimal(1));
		const actual = decimalMin(populationAvailable, basePlasma.times(combinedMultiplier)).max(0);
		resources.addResource('plasma', actual);

		const lossFraction =
			apocalypse === 'shadow' || apocalypse === 'wrath' ? 1 - Math.pow(0.25, level)
			: apocalypse === 'freeze' ? 1 - Math.pow(0.5, level * level)
			: apocalypse === 'sacrifice' ? 1 - Math.pow(0.5, level)
			: 1;
		const casualties = decimalMin(populationAvailable, apocalypse === 'reincarnation' || apocalypse === 'invasion' ? actual : populationAvailable.times(lossFraction));
		resources.addPopulation(casualties.neg(), casualties);
		if (enabled.includes('reincarnation')) world.populationStore.addZombies(casualties);
		if (enabled.includes('invasion')) world.populationStore.addCyborgs(casualties);

		world.destructionStore.applyArmageddonDestruction(level);
		resources.resetForArmageddon();
		production.resetForArmageddon();
		production.setEffect('freeze-apocalypse', enabled.includes('freeze'));
		production.setEffect('wrath-apocalypse', enabled.includes('wrath'));
		production.setEffect('reincarnation-apocalypse', enabled.includes('reincarnation'));
		production.setEffect('invasion-apocalypse', enabled.includes('invasion'));
		production.setEffect('roulette-apocalypse', enabled.includes('roulette'));

		useStatsStore.getState().recordPrestige('armageddon');
		set(state => ({
			armageddonCount: state.armageddonCount + 1,
			armageddonStartedAt: new Date().toISOString(),
			completedApocalypses: [...new Set([...state.completedApocalypses, apocalypse])],
		}));
		return true;
	},
	recordArmageddon: () => set(state => ({ armageddonCount: state.armageddonCount + 1 })),
	recordApocalypse: type => set(state => ({ completedApocalypses: [...new Set([...state.completedApocalypses, type])] })),
});
