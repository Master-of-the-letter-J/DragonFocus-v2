import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { DRAGON_QUOTES } from '@/data/statistics-data/dragon-quotes';
import type { DragonFuryBand } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useOnlineProgressStore } from '../store-online-progress/_useOnlineProgressStore';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useResourceStore } from './createResourceSlice';
import { useWorldOptionsStore } from './createWorldOptionsSlice';

export interface DragonStoreState {
	dragonSpawned: boolean;
	nexusIntroStep: number;
	angerShields: number;
	lastDragonQuote?: string;
	bestDragonAge: number;
	reviveGraceUntil?: string;
	spawnDragon: (name?: string) => boolean;
	dismissNexusIntro: () => void;
	renameDragon: (name: string) => boolean;
	getFuryBand: () => DragonFuryBand;
	buyAngerShields: (quantity?: number) => boolean;
	siphonFury: (amount?: number) => boolean;
	reviveDragon: () => boolean;
	clickDragon: () => string | undefined;
	clickWorld: () => void;
	setAngerShields: (amount: number) => void;
	recordDragonAge: (ageDays: number) => void;
	startReviveGrace: (seconds: number) => void;
	clearReviveGrace: () => void;
	reset: () => void;
}

const initialState = () => ({
	dragonSpawned: false,
	nexusIntroStep: 0,
	angerShields: 0,
	lastDragonQuote: undefined as string | undefined,
	bestDragonAge: 0,
	reviveGraceUntil: undefined as string | undefined,
});

/** Canonical owner for dragon lifecycle, Fury controls, shields, and age state. */
const createDragonStoreSlice: StateCreator<DragonStoreState> = (set, get) => ({
	...initialState(),
	spawnDragon: name => {
		if (get().dragonSpawned) return false;
		const dragonName = name?.trim();
		useResourceStore.getState().setDragon({
			name: dragonName || WORLD_CONSTANTS.dragon.defaultName,
			isAlive: true,
			fury: decimal(0),
			deathReason: undefined,
			lastDeathAt: undefined,
		});
		set({ dragonSpawned: true, nexusIntroStep: 3 });
		return true;
	},
	dismissNexusIntro: () => set(state => ({ nexusIntroStep: Math.min(3, state.nexusIntroStep + 1) })),
	renameDragon: name => {
		const trimmed = name.trim();
		if (!trimmed || trimmed.length > 32 || useResourceStore.getState().dragon.ageDays < 365) return false;
		useResourceStore.getState().setDragon({ name: trimmed });
		return true;
	},
	getFuryBand: () => useOnlineProgressStore.getState().getFuryBand(),
	buyAngerShields: (quantity = 1) => {
		const amount = Math.max(1, Math.floor(quantity));
		const resources = useResourceStore.getState();
		const maxShields = Math.floor(resources.dragon.furyThreshold.toNumber());
		const available = Math.max(0, Math.min(amount, maxShields - get().angerShields));
		const costPerShield = 1 + Math.floor(resources.dragon.ageDays / 30);
		if (!available || !resources.spendResource('shards', decimal(costPerShield).times(available))) return false;
		set(state => ({ angerShields: state.angerShields + available }));
		return true;
	},
	siphonFury: (amount = 1) => {
		const resources = useResourceStore.getState();
		const mode = useWorldOptionsStore.getState().gameMode;
		if (!useProductionStore.getState().isEffectActive('typhon-siphon') || mode === 'hard' || mode === 'hard-plus') return false;
		const reduction = decimal(Math.max(1, Math.floor(amount))).min(resources.resources.fury);
		const cost = reduction.times(1 + Math.floor(resources.dragon.ageDays / 30));
		if (reduction.lte(0) || !resources.spendResource('shards', cost)) return false;
		resources.setResource('fury', resources.resources.fury.minus(reduction));
		return true;
	},
	reviveDragon: () => {
		const resources = useResourceStore.getState();
		if (resources.dragon.isAlive) return false;
		resources.setDragon({ isAlive: true, fury: decimal(0), deathReason: undefined });
		get().startReviveGrace(WORLD_CONSTANTS.dragon.reviveGraceSeconds);
		set({ lastDragonQuote: 'The Nexus answers. The dragon rises again.' });
		return true;
	},
	clickDragon: () => {
		const resources = useResourceStore.getState();
		const levels = useProductionStore.getState().levels;
		if (!get().dragonSpawned || !resources.dragon.isAlive) return undefined;
		const base = decimal(1 + (levels['bigger-clicks'] ?? 0)).times(decimal(2).pow(levels['double-clicks'] ?? 0));
		resources.addResource('energy', base);
		resources.addPopulation(decimal(10).pow(levels['gaias-gift'] ?? 0));
		resources.addResource('fury', Math.max(0, 0.01 - (levels['less-angry-clicks'] ?? 0) * 0.001));
		const bonusTicks = 0.2 * ((levels['true-dragon-clicks'] ?? 0) + (levels['un-worldly-clicks'] ?? 0));
		if (bonusTicks > 0) useOnlineProgressStore.getState().tickWorld(bonusTicks);
		const quote = DRAGON_QUOTES[Math.floor(Math.random() * DRAGON_QUOTES.length)];
		if (useWorldOptionsStore.getState().nexusSettings.showDragonQuotes) set({ lastDragonQuote: quote });
		return quote;
	},
	clickWorld: () => {
		const resources = useResourceStore.getState();
		if (!get().dragonSpawned || !resources.dragon.isAlive) return;
		resources.addResource('energy', 1);
		const level = useProductionStore.getState().levels['un-worldly-clicks'] ?? 0;
		const growthTicks = Math.min(1, level * 0.2);
		if (growthTicks > 0) {
			const population = resources.resources.population;
			const nextPopulation = useOnlineProgressStore.getState().calculatePopulationProgress({ initial: population, ticks: growthTicks, multiplier: 1 });
			resources.addPopulation(nextPopulation.minus(population));
		}
		resources.addResource('fury', 0.01);
	},
	setAngerShields: amount => set({ angerShields: Math.max(0, amount) }),
	recordDragonAge: ageDays => {
		if (Number.isFinite(ageDays)) set(state => ({ bestDragonAge: Math.max(state.bestDragonAge, ageDays) }));
	},
	startReviveGrace: seconds => {
		if (Number.isFinite(seconds) && seconds > 0) set({ reviveGraceUntil: new Date(Date.now() + seconds * 1_000).toISOString() });
	},
	clearReviveGrace: () => set({ reviveGraceUntil: undefined }),
	reset: () => set(initialState()),
});

export const useDragonStore = create<DragonStoreState>()(
	persist((...store) => ({ ...createDragonStoreSlice(...store) }), {
		name: 'dragonfocus:dragon',
		storage: createJSONStorage(() => AsyncStorage),
	}),
);

/** Registers the canonical dragon hook in the combined world store. */
export const createDragonSlice = () => ({ dragonStore: useDragonStore });
