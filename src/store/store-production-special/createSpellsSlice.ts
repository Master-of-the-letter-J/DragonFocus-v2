import type { ActiveSpell, Spell } from '@/types/world.types';
import { createSpell, getSpellLuckMultiplier, spellSellValue } from '@/data/world-data/spells';
import { SPELL_LOOTBOX_BY_ID, rollWeightedSpellSize, type SpellLootboxId } from '@/data/world-data/spell-lootboxes';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useProductionStore } from '../store-production/_useProductionStore';

const REWARDED_AD_WINDOW_MS = 8 * 60 * 60 * 1_000;
const REWARDED_AD_CLAIMS_PER_WINDOW = 3;
const lootboxSpellTypes = ['energy', 'dark-energy', 'calm', 'armageddon', 'mega'] as const;

export interface SpellsStoreState {
	spellInventory: Spell[];
	activeSpells: ActiveSpell[];
	rewardedAdClaims: number;
	rewardedAdWindowStartedAt: string;
	claimedRewardedAdIds: string[];
	addSpell: (spell: Spell) => void;
	activateSpell: (id: string, durationMultiplier?: number) => boolean;
	sellSpell: (id: string) => boolean;
	openLootbox: (id: SpellLootboxId, random?: () => number) => Spell[];
	claimRewardedAdLootbox: (verifiedRewardId: string, random?: () => number, now?: Date) => Spell[];
	getRewardedAdClaimsRemaining: (now?: Date) => number;
	tickSpells: (seconds: number) => void;
	clearActiveSpells: () => void;
	reset: () => void;
}

const initialState = () => ({ spellInventory: [] as Spell[], activeSpells: [] as ActiveSpell[], rewardedAdClaims: 0, rewardedAdWindowStartedAt: new Date().toISOString(), claimedRewardedAdIds: [] as string[] });

const rollLootbox = (id: SpellLootboxId, random: () => number) => {
	const box = SPELL_LOOTBOX_BY_ID[id];
	const hectateLevel = useProductionStore.getState().levels.hectate ?? 0;
	const luck = getSpellLuckMultiplier(hectateLevel);
	const weights = hectateLevel > 0 ? box.hectateWeights : box.standardWeights;
	const rolls = box.minimumRolls + Math.floor(random() * (box.maximumRolls - box.minimumRolls + 1));
	const spells: Spell[] = [];
	for (let roll = 0; roll < rolls; roll += 1) {
		const luckAdjustedRoll = Math.pow(Math.max(Number.MIN_VALUE, random()), 1 / luck);
		const size = rollWeightedSpellSize(weights, luckAdjustedRoll);
		const type = lootboxSpellTypes[Math.floor(random() * lootboxSpellTypes.length)] ?? 'energy';
		for (let copy = 0; copy < box.identicalRollBundle; copy += 1) spells.push(createSpell(type, size));
	}
	return spells;
};

/** Timed spells own the inventory and countdowns for temporary resource effects. */
export const createSpellsSlice: ProductionSpecialSlice<'spells'> = (set, get) => {
	const { setSlice, getSlice } = scopeNestedSlice<ProductionSpecialStoreState, 'spells', SpellsStoreState>('spells', set, get);

	return {
		spells: {
			...initialState(),
			addSpell: spell => setSlice(state => ({ spellInventory: [...state.spellInventory, spell] })),
			activateSpell: (id, durationMultiplier = 1) => {
				const spell = getSlice().spellInventory.find(candidate => candidate.id === id);
				if (!spell) return false;
				const hectateLevel = useProductionStore.getState().levels.hectate ?? 0;
				const effectMultiplier = hectateLevel > 0 ? 2 * hectateLevel : 1;
				const activatedSpell = { ...spell, effects: spell.effects.map(effect => ({ ...effect, multiplier: effect.multiplier * effectMultiplier })) };
				setSlice(state => ({
					spellInventory: state.spellInventory.filter(candidate => candidate.id !== id),
					activeSpells: (() => {
						const activeIndex = state.activeSpells.findIndex(candidate => candidate.spellType === spell.spellType && candidate.size === spell.size);
						const duration = spell.durationSeconds * Math.max(0, durationMultiplier);
						if (activeIndex < 0) return [...state.activeSpells, { ...activatedSpell, remainingSeconds: duration }];

						return state.activeSpells.map((candidate, index) => (index === activeIndex ? { ...activatedSpell, remainingSeconds: candidate.remainingSeconds + duration } : candidate));
					})(),
				}));
				return true;
			},
			sellSpell: id => {
				const spell = getSlice().spellInventory.find(candidate => candidate.id === id);
				if (!spell) return false;
				useWorldStore.getState().resourceStore.addResource('shards', spellSellValue(spell.size));
				setSlice(state => ({ spellInventory: state.spellInventory.filter(candidate => candidate.id !== id) }));
				return true;
			},
			openLootbox: (id, random = Math.random) => {
				const box = SPELL_LOOTBOX_BY_ID[id];
				if (!box || !useWorldStore.getState().resourceStore.spendResource('shards', box.shardCost)) return [];
				const spells = rollLootbox(id, random);
				setSlice(state => ({ spellInventory: [...state.spellInventory, ...spells] }));
				return spells;
			},
			claimRewardedAdLootbox: (verifiedRewardId, random = Math.random, now = new Date()) => {
				const state = getSlice();
				if (!verifiedRewardId.trim() || state.claimedRewardedAdIds.includes(verifiedRewardId)) return [];
				const windowExpired = now.getTime() - Date.parse(state.rewardedAdWindowStartedAt) >= REWARDED_AD_WINDOW_MS;
				const claims = windowExpired ? 0 : state.rewardedAdClaims;
				if (claims >= REWARDED_AD_CLAIMS_PER_WINDOW) return [];
				const spells = rollLootbox('basic', random);
				setSlice(current => ({
					spellInventory: [...current.spellInventory, ...spells],
					rewardedAdClaims: claims + 1,
					rewardedAdWindowStartedAt: windowExpired ? now.toISOString() : current.rewardedAdWindowStartedAt,
					claimedRewardedAdIds: [...current.claimedRewardedAdIds, verifiedRewardId],
				}));
				return spells;
			},
			getRewardedAdClaimsRemaining: (now = new Date()) => {
				const state = getSlice();
				return now.getTime() - Date.parse(state.rewardedAdWindowStartedAt) >= REWARDED_AD_WINDOW_MS ? REWARDED_AD_CLAIMS_PER_WINDOW : Math.max(0, REWARDED_AD_CLAIMS_PER_WINDOW - state.rewardedAdClaims);
			},
			tickSpells: seconds => {
				if (!Number.isFinite(seconds) || seconds <= 0) return;
				setSlice(state => ({
					activeSpells: state.activeSpells.map(spell => ({ ...spell, remainingSeconds: Math.max(0, spell.remainingSeconds - seconds) })).filter(spell => spell.remainingSeconds > 0),
				}));
			},
			clearActiveSpells: () => setSlice({ activeSpells: [] }),
			reset: () => setSlice(initialState()),
		},
	};
};
