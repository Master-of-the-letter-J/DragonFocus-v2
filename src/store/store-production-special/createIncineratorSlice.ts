import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { usePrestigeStore } from '../store-prestige/_usePrestigeStore';
import { usePopulationStore } from '../store-world/createPopulationSlice';
import { useResourceStore } from '../store-world/createResourceSlice';
import type { ProductionSpecialSlice } from './_useProductionSpecialStore';

const CAPACITY_SECONDS_PER_LEVEL = 30 * 60;

export interface IncineratorStoreState {
	unlocked: boolean;
	level: number;
	fuelSeconds: number;
	nukeLevel: number;
	nukeUnlocked: boolean;
	cyberHackUnlocked: boolean;
	angryVirusUnlocked: boolean;
	unlock: () => boolean;
	upgrade: () => boolean;
	fuel: (minutes?: number) => boolean;
	tick: (seconds: number) => void;
	unlockNuke: () => boolean;
	upgradeNuke: () => boolean;
	useNuke: () => boolean;
	unlockCyberHack: () => boolean;
	useCyberHack: () => boolean;
	unlockAngryVirus: () => boolean;
	useAngryVirus: () => boolean;
	getZombieEffect: () => number;
	getCyborgEffect: () => number;
	resetForTranscension: () => void;
	reset: () => void;
}

const initialState = () => ({
	unlocked: false,
	level: 1,
	fuelSeconds: 0,
	nukeLevel: 1,
	nukeUnlocked: false,
	cyberHackUnlocked: false,
	angryVirusUnlocked: false,
});

const hasCompleted = (type: 'freeze' | 'wrath' | 'reincarnation' | 'invasion', times = 1) => {
	const prestige = usePrestigeStore.getState();
	return prestige.completedApocalypses.includes(type) && (prestige.apocalypseLevels[type] ?? 0) >= times - 1;
};

/** Paid hostile-population controls; every transformation is constant-time. */
export const useIncineratorStore = create<IncineratorStoreState>()(
	persist(
		(set, get) => ({
			...initialState(),
			unlock: () => {
				if (get().unlocked || (!hasCompleted('reincarnation') && !hasCompleted('invasion'))) return false;
				if (!useResourceStore.getState().spendResource('plasma', 100_000)) return false;
				set({ unlocked: true });
				return true;
			},
			upgrade: () => {
				const state = get();
				if (!state.unlocked || !useResourceStore.getState().spendResource('darkPlasma', decimal(200).times(decimal(2).pow(state.level - 1)))) return false;
				set({ level: state.level + 1 });
				return true;
			},
			fuel: (minutes = 30) => {
				const state = get();
				if (!state.unlocked || !Number.isFinite(minutes) || minutes <= 0) return false;
				const capacity = CAPACITY_SECONDS_PER_LEVEL * state.level;
				const seconds = Math.min(Math.floor(minutes * 60), capacity - state.fuelSeconds);
				if (seconds <= 60) return false;
				const cost = decimal(1.5)
					.pow(state.level)
					.times(seconds / 60);
				if (!useResourceStore.getState().spendResource('plasma', cost)) return false;
				set({ fuelSeconds: state.fuelSeconds + seconds });
				return true;
			},
			tick: seconds => set(state => ({ fuelSeconds: Math.max(0, state.fuelSeconds - Math.max(0, seconds)) })),
			unlockNuke: () => {
				const resources = useResourceStore.getState();
				if (!get().unlocked || get().nukeUnlocked || !hasCompleted('freeze', 2) || resources.resources.plasma.lt(10_000_000) || resources.resources.darkPlasma.lt(1_000)) return false;
				resources.spendResource('plasma', 10_000_000);
				resources.spendResource('darkPlasma', 1_000);
				set({ nukeUnlocked: true });
				return true;
			},
			upgradeNuke: () => {
				const state = get();
				if (!state.nukeUnlocked || !useResourceStore.getState().spendResource('plasma', decimal(100_000_000).times(decimal(100).pow(state.nukeLevel - 1)))) return false;
				set({ nukeLevel: state.nukeLevel + 1 });
				return true;
			},
			useNuke: () => {
				const state = get();
				const resources = useResourceStore.getState();
				const cost = decimal(5_000_000).times(decimal(5).pow(state.nukeLevel - 1));
				if (!state.nukeUnlocked || resources.resources.plasma.lt(cost) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', cost);
				resources.spendResource('quarks', 5);
				const divisor = decimal(10).pow(state.nukeLevel);
				resources.setResource('population', resources.resources.population.div(divisor));
				usePopulationStore.setState(population => ({ zombies: population.zombies.div(divisor), cyborgs: population.cyborgs.div(divisor) }));
				return true;
			},
			unlockCyberHack: () => {
				const resources = useResourceStore.getState();
				if (get().cyberHackUnlocked || !hasCompleted('invasion', 2) || resources.resources.plasma.lt(1_000_000_000) || resources.resources.darkPlasma.lt(10_000)) return false;
				resources.spendResource('plasma', 1_000_000_000);
				resources.spendResource('darkPlasma', 10_000);
				set({ cyberHackUnlocked: true });
				return true;
			},
			useCyberHack: () => {
				const resources = useResourceStore.getState();
				if (!get().cyberHackUnlocked || resources.resources.plasma.lt(50_000_000) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', 50_000_000);
				resources.spendResource('quarks', 5);
				usePopulationStore.setState(state => ({ cyborgs: state.cyborgs.sqrt() }));
				return true;
			},
			unlockAngryVirus: () => {
				const resources = useResourceStore.getState();
				if (get().angryVirusUnlocked || !hasCompleted('wrath', 2) || resources.resources.plasma.lt(1_000_000_000) || resources.resources.darkPlasma.lt(10_000)) return false;
				resources.spendResource('plasma', 1_000_000_000);
				resources.spendResource('darkPlasma', 10_000);
				set({ angryVirusUnlocked: true });
				return true;
			},
			useAngryVirus: () => {
				const resources = useResourceStore.getState();
				if (!get().angryVirusUnlocked || resources.resources.plasma.lt(50_000_000) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', 50_000_000);
				resources.spendResource('quarks', 5);
				resources.setResource('population', resources.resources.population.sqrt());
				usePopulationStore.setState(state => ({ zombies: state.zombies.pow(1 / 3) }));
				return true;
			},
			getZombieEffect: () => (get().fuelSeconds > 0 ? Math.pow(2, get().level) : 0),
			getCyborgEffect: () => (get().fuelSeconds > 0 ? Math.pow(1.5, get().level) : 0),
			resetForTranscension: () => set(initialState()),
			reset: () => set(initialState()),
		}),
		{ name: 'dragonfocus:incinerator', storage: createJSONStorage(() => AsyncStorage) },
	),
);

export const createIncineratorSlice: ProductionSpecialSlice<'incinerator'> = () => ({ incinerator: useIncineratorStore });
