import { decimal } from '@/utils/decimal';
import { usePrestigeStore } from '../store-prestige/_usePrestigeStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';

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
export const createIncineratorSlice: ProductionSpecialSlice<'incinerator'> = (set, get) => {
	const { setSlice, getSlice } = scopeNestedSlice<ProductionSpecialStoreState, 'incinerator', IncineratorStoreState>('incinerator', set, get);

	return {
		incinerator: {
			...initialState(),
			unlock: () => {
				if (getSlice().unlocked || (!hasCompleted('reincarnation') && !hasCompleted('invasion'))) return false;
				if (!useWorldStore.getState().resourceStore.spendResource('plasma', 100_000)) return false;
				setSlice({ unlocked: true });
				return true;
			},
			upgrade: () => {
				const state = getSlice();
				if (!state.unlocked || !useWorldStore.getState().resourceStore.spendResource('darkPlasma', decimal(200).times(decimal(2).pow(state.level - 1)))) return false;
				setSlice({ level: state.level + 1 });
				return true;
			},
			fuel: (minutes = 30) => {
				const state = getSlice();
				if (!state.unlocked || !Number.isFinite(minutes) || minutes <= 0) return false;
				const capacity = CAPACITY_SECONDS_PER_LEVEL * state.level;
				const seconds = Math.min(Math.floor(minutes * 60), capacity - state.fuelSeconds);
				if (seconds <= 60) return false;
				const cost = decimal(1.5)
					.pow(state.level)
					.times(seconds / 60);
				if (!useWorldStore.getState().resourceStore.spendResource('plasma', cost)) return false;
				setSlice({ fuelSeconds: state.fuelSeconds + seconds });
				return true;
			},
			tick: seconds => setSlice(state => ({ fuelSeconds: Math.max(0, state.fuelSeconds - Math.max(0, seconds)) })),
			unlockNuke: () => {
				const resources = useWorldStore.getState().resourceStore;
				if (!getSlice().unlocked || getSlice().nukeUnlocked || !hasCompleted('freeze', 2) || resources.resources.plasma.lt(10_000_000) || resources.resources.darkPlasma.lt(1_000)) return false;
				resources.spendResource('plasma', 10_000_000);
				resources.spendResource('darkPlasma', 1_000);
				setSlice({ nukeUnlocked: true });
				return true;
			},
			upgradeNuke: () => {
				const state = getSlice();
				if (!state.nukeUnlocked || !useWorldStore.getState().resourceStore.spendResource('plasma', decimal(100_000_000).times(decimal(100).pow(state.nukeLevel - 1)))) return false;
				setSlice({ nukeLevel: state.nukeLevel + 1 });
				return true;
			},
			useNuke: () => {
				const state = getSlice();
				const resources = useWorldStore.getState().resourceStore;
				const cost = decimal(5_000_000).times(decimal(5).pow(state.nukeLevel - 1));
				if (!state.nukeUnlocked || resources.resources.plasma.lt(cost) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', cost);
				resources.spendResource('quarks', 5);
				const divisor = decimal(10).pow(state.nukeLevel);
				resources.setResource('population', resources.resources.population.div(divisor));
				useWorldStore.setState(world => ({ populationStore: { ...world.populationStore, zombies: world.populationStore.zombies.div(divisor), cyborgs: world.populationStore.cyborgs.div(divisor) } }));
				return true;
			},
			unlockCyberHack: () => {
				const resources = useWorldStore.getState().resourceStore;
				if (getSlice().cyberHackUnlocked || !hasCompleted('invasion', 2) || resources.resources.plasma.lt(1_000_000_000) || resources.resources.darkPlasma.lt(10_000)) return false;
				resources.spendResource('plasma', 1_000_000_000);
				resources.spendResource('darkPlasma', 10_000);
				setSlice({ cyberHackUnlocked: true });
				return true;
			},
			useCyberHack: () => {
				const resources = useWorldStore.getState().resourceStore;
				if (!getSlice().cyberHackUnlocked || resources.resources.plasma.lt(50_000_000) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', 50_000_000);
				resources.spendResource('quarks', 5);
				useWorldStore.setState(world => ({ populationStore: { ...world.populationStore, cyborgs: world.populationStore.cyborgs.sqrt() } }));
				return true;
			},
			unlockAngryVirus: () => {
				const resources = useWorldStore.getState().resourceStore;
				if (getSlice().angryVirusUnlocked || !hasCompleted('wrath', 2) || resources.resources.plasma.lt(1_000_000_000) || resources.resources.darkPlasma.lt(10_000)) return false;
				resources.spendResource('plasma', 1_000_000_000);
				resources.spendResource('darkPlasma', 10_000);
				setSlice({ angryVirusUnlocked: true });
				return true;
			},
			useAngryVirus: () => {
				const resources = useWorldStore.getState().resourceStore;
				if (!getSlice().angryVirusUnlocked || resources.resources.plasma.lt(50_000_000) || resources.resources.quarks.lt(5)) return false;
				resources.spendResource('plasma', 50_000_000);
				resources.spendResource('quarks', 5);
				resources.setResource('population', resources.resources.population.sqrt());
				useWorldStore.setState(world => ({ populationStore: { ...world.populationStore, zombies: world.populationStore.zombies.pow(1 / 3) } }));
				return true;
			},
			getZombieEffect: () => (getSlice().fuelSeconds > 0 ? Math.pow(2, getSlice().level) : 0),
			getCyborgEffect: () => (getSlice().fuelSeconds > 0 ? Math.pow(1.5, getSlice().level) : 0),
			resetForTranscension: () => setSlice(initialState()),
			reset: () => setSlice(initialState()),
		},
	};
};
