import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { DRAGON_QUOTES } from '@/data/statistics-data/dragon-quotes';
import type { DragonFuryBand } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import { useOnlineProgressStore } from '../store-online-progress/_useOnlineProgressStore';
import { useProductionStore } from '../store-production/_useProductionStore';
import { scopeNestedSlice } from '../nested-slice';
import type { WorldSlice, WorldStoreState } from './_useWorldStore';

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
export const createDragonSlice: WorldSlice<'dragonStore'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<WorldStoreState, 'dragonStore', DragonStoreState>('dragonStore', set, get);

	return {
		dragonStore: {
			...initialState(),
			spawnDragon: name => {
		if (getSlice().dragonSpawned) return false;
		const dragonName = name?.trim();
		getRoot().resourceStore.setDragon({
			name: dragonName || WORLD_CONSTANTS.dragon.defaultName,
			isAlive: true,
			fury: decimal(0),
			deathReason: undefined,
			lastDeathAt: undefined,
		});
		setSlice({ dragonSpawned: true, nexusIntroStep: 3 });
		return true;
	},
	dismissNexusIntro: () => setSlice(state => ({ nexusIntroStep: Math.min(3, state.nexusIntroStep + 1) })),
	renameDragon: name => {
		const trimmed = name.trim();
		if (!trimmed || trimmed.length > 32 || getRoot().resourceStore.dragon.ageDays < 365) return false;
		getRoot().resourceStore.setDragon({ name: trimmed });
		return true;
	},
	getFuryBand: () => useOnlineProgressStore.getState().getFuryBand(),
	buyAngerShields: (quantity = 1) => {
		const amount = Math.max(1, Math.floor(quantity));
		const resources = getRoot().resourceStore;
		const maxShields = Math.floor(resources.dragon.furyThreshold.toNumber());
		const available = Math.max(0, Math.min(amount, maxShields - getSlice().angerShields));
		const costPerShield = 1 + Math.floor(resources.dragon.ageDays / 30);
		if (!available || !resources.spendResource('shards', decimal(costPerShield).times(available))) return false;
		setSlice(state => ({ angerShields: state.angerShields + available }));
		return true;
	},
	siphonFury: (amount = 1) => {
		const resources = getRoot().resourceStore;
		const mode = getRoot().optionsStore.gameMode;
		if (!useProductionStore.getState().isEffectActive('typhon-siphon') || mode === 'hard' || mode === 'hard-plus') return false;
		const reduction = decimal(Math.max(1, Math.floor(amount))).min(resources.resources.fury);
		const cost = reduction.times(1 + Math.floor(resources.dragon.ageDays / 30));
		if (reduction.lte(0) || !resources.spendResource('shards', cost)) return false;
		resources.setResource('fury', resources.resources.fury.minus(reduction));
		return true;
	},
	reviveDragon: () => {
		const resources = getRoot().resourceStore;
		if (resources.dragon.isAlive) return false;
		resources.setDragon({ isAlive: true, fury: decimal(0), deathReason: undefined });
		getSlice().startReviveGrace(WORLD_CONSTANTS.dragon.reviveGraceSeconds);
		setSlice({ lastDragonQuote: 'The Nexus answers. The dragon rises again.' });
		return true;
	},
	clickDragon: () => {
		const resources = getRoot().resourceStore;
		const levels = useProductionStore.getState().levels;
		if (!getSlice().dragonSpawned || !resources.dragon.isAlive) return undefined;
		const base = decimal(1 + (levels['bigger-clicks'] ?? 0)).times(decimal(2).pow(levels['double-clicks'] ?? 0));
		resources.addResource('energy', base);
		resources.addPopulation(decimal(10).pow(levels['gaias-gift'] ?? 0));
		resources.addResource('fury', Math.max(0, 0.01 - (levels['less-angry-clicks'] ?? 0) * 0.001));
		const bonusTicks = 0.2 * ((levels['true-dragon-clicks'] ?? 0) + (levels['un-worldly-clicks'] ?? 0));
		if (bonusTicks > 0) useOnlineProgressStore.getState().tickWorld(bonusTicks);
		const quote = DRAGON_QUOTES[Math.floor(Math.random() * DRAGON_QUOTES.length)];
		if (getRoot().optionsStore.nexusSettings.showDragonQuotes) setSlice({ lastDragonQuote: quote });
		return quote;
	},
	clickWorld: () => {
		const resources = getRoot().resourceStore;
		if (!getSlice().dragonSpawned || !resources.dragon.isAlive) return;
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
	setAngerShields: amount => setSlice({ angerShields: Math.max(0, amount) }),
	recordDragonAge: ageDays => {
		if (Number.isFinite(ageDays)) setSlice(state => ({ bestDragonAge: Math.max(state.bestDragonAge, ageDays) }));
	},
	startReviveGrace: seconds => {
		if (Number.isFinite(seconds) && seconds > 0) setSlice({ reviveGraceUntil: new Date(Date.now() + seconds * 1_000).toISOString() });
	},
	clearReviveGrace: () => setSlice({ reviveGraceUntil: undefined }),
	reset: () => setSlice(initialState()),
		},
	};
};
