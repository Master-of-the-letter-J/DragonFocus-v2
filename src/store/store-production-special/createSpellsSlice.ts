import type { ActiveSpell, Spell } from '@/types/world.types';
import { createSpell, getSpellLuckMultiplier, spellSellValue } from '@/data/world-data/spells';
import { SPELL_SNACKBOX_BY_ID, rollWeightedSpellSize, type SpellSnackboxId } from '@/data/world-data/spell-snackboxes';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useProductionStore } from '../store-production/_useProductionStore';

const snackboxSpellTypes = ['energy', 'dark-energy', 'calm', 'armageddon', 'mega'] as const;

export interface SpellsStoreState {
	spellInventory: Spell[];
	activeSpells: ActiveSpell[];
	addSpell: (spell: Spell) => void;
	activateSpell: (id: string, durationMultiplier?: number) => boolean;
	sellSpell: (id: string) => boolean;
	openSnackbox: (id: SpellSnackboxId, random?: () => number) => Spell[];
	tickSpells: (seconds: number) => void;
	clearActiveSpells: () => void;
	reset: () => void;
}

const initialState = () => ({ spellInventory: [] as Spell[], activeSpells: [] as ActiveSpell[] });

const rollSnackbox = (id: SpellSnackboxId, random: () => number) => {
	const box = SPELL_SNACKBOX_BY_ID[id];
	const hecateLevel = useProductionStore.getState().levels.hecate ?? 0;
	const luck = getSpellLuckMultiplier(hecateLevel);
	const weights = hecateLevel > 0 ? box.hecateWeights : box.standardWeights;
	const rolls = box.minimumRolls + Math.floor(random() * (box.maximumRolls - box.minimumRolls + 1));
	const spells: Spell[] = [];
	for (let roll = 0; roll < rolls; roll += 1) {
		const luckAdjustedRoll = Math.pow(Math.max(Number.MIN_VALUE, random()), 1 / luck);
		const size = rollWeightedSpellSize(weights, luckAdjustedRoll);
		const type = snackboxSpellTypes[Math.floor(random() * snackboxSpellTypes.length)] ?? 'energy';
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
				const hecateLevel = useProductionStore.getState().levels.hecate ?? 0;
				const effectMultiplier = hecateLevel > 0 ? 2 * hecateLevel : 1;
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
			openSnackbox: (id, random = Math.random) => {
				const box = SPELL_SNACKBOX_BY_ID[id];
				if (!box || !useWorldStore.getState().resourceStore.spendResource('shards', box.shardCost)) return [];
				const spells = rollSnackbox(id, random);
				setSlice(state => ({ spellInventory: [...state.spellInventory, ...spells] }));
				return spells;
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
