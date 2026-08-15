import { calculateExponentialGrowth } from '@/data/calculations/formula-production';
import { createSpell } from '@/data/world-data/spells';
import type { SpendableResourceId } from '@/types/resources.types';
import type { Spell, SpellSize, SpellType } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import { useProductionStore } from '../store-production/_useProductionStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';

export interface ConvertorRule {
	id: string;
	from: SpendableResourceId;
	to: SpendableResourceId;
	rate: number;
}

export interface ConvertorStoreState {
	rules: ConvertorRule[];
	erosConversionsToday: number;
	erosConversionDate: string;
	registerRule: (rule: ConvertorRule) => void;
	convert: (ruleId: string, amount: number) => boolean;
	convertDarkPlasmaToDarkEnergy: (amount: number) => boolean;
	convertQuarkToMicroQuarks: () => boolean;
	convertMicroQuarksToQuark: () => boolean;
	convertPlasmaToFury: () => boolean;
	convertPlasmaToAge: () => boolean;
	combineSpells: (spellIds: string[]) => boolean;
	reset: () => void;
}

const converterUnlocked = () => useProductionStore.getState().isEffectActive('primordial-converter');
const today = () => new Date().toISOString().slice(0, 10);

const spend = (resource: SpendableResourceId, amount: number | string) => useWorldStore.getState().resourceStore.spendResource(resource, decimal(amount));

const spendAll = (costs: readonly { resource: SpendableResourceId; amount: number | string }[]) => {
	const resources = useWorldStore.getState().resourceStore;
	if (!costs.every(cost => resources.resources[cost.resource].gte(decimal(cost.amount)))) return false;
	costs.forEach(cost => resources.spendResource(cost.resource, decimal(cost.amount)));
	return true;
};

/** The converter owns all paid resource and spell transformations unlocked by its monument. */
export const createConvertorSlice: ProductionSpecialSlice<'convertor'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionSpecialStoreState, 'convertor', ConvertorStoreState>('convertor', set, get);

	return {
		convertor: {
			rules: [],
			erosConversionsToday: 0,
			erosConversionDate: today(),
			registerRule: rule => setSlice(state => ({ rules: [...state.rules.filter(candidate => candidate.id !== rule.id), rule] })),
			convert: (ruleId, amount) => {
				const rule = getSlice().rules.find(candidate => candidate.id === ruleId);
				if (!converterUnlocked() || !rule || !Number.isFinite(amount) || amount <= 0 || !spend(rule.from, amount)) return false;
				useWorldStore.getState().resourceStore.addResource(rule.to, decimal(amount).times(rule.rate));
				return true;
			},
			convertDarkPlasmaToDarkEnergy: amount => {
				if (
					!converterUnlocked() ||
					!Number.isFinite(amount) ||
					amount <= 0 ||
					!spendAll([
						{ resource: 'quarks', amount: 1 },
						{ resource: 'darkPlasma', amount },
					])
				)
					return false;
				useWorldStore.getState().resourceStore.addResource('darkEnergy', decimal(amount).times(100));
				return true;
			},
			convertQuarkToMicroQuarks: () => {
				if (!converterUnlocked() || !spendAll([{ resource: 'quarks', amount: 1 }])) return false;
				useWorldStore.getState().resourceStore.addResource('microQuarks', 10_000);
				return true;
			},
			convertMicroQuarksToQuark: () => {
				if (
					!converterUnlocked() ||
					!spendAll([
						{ resource: 'shards', amount: 1 },
						{ resource: 'microQuarks', amount: 1_000_000 },
					])
				)
					return false;
				useWorldStore.getState().resourceStore.addResource('quarks', 1);
				return true;
			},
			convertPlasmaToFury: () => {
				const state = getSlice();
				const conversionDate = today();
				const timesUsed = state.erosConversionDate === conversionDate ? state.erosConversionsToday : 0;
				const plasmaCost = calculateExponentialGrowth({ base: 1, growthFactor: 4 }, timesUsed);
				const resources = useWorldStore.getState().resourceStore;
				if (
					!converterUnlocked() ||
					!useProductionStore.getState().isEffectActive('eros-monument') ||
					resources.resources.fury.lte(0) ||
					!spendAll([
						{ resource: 'quarks', amount: 5 },
						{ resource: 'plasma', amount: plasmaCost.toString() },
					])
				)
					return false;
				resources.setResource('fury', decimal(0).max(resources.resources.fury.minus(1)));
				setSlice({ erosConversionDate: conversionDate, erosConversionsToday: timesUsed + 1 });
				return true;
			},
			convertPlasmaToAge: () => {
				const resources = useWorldStore.getState().resourceStore;
				const age = resources.dragon.ageDays;
				const ageCap = useWorldStore.getState().dragonStore.bestDragonAge;
				const plasmaCost = calculateExponentialGrowth({ base: 1, growthFactor: 4 }, age);
				if (
					!converterUnlocked() ||
					!useProductionStore.getState().isEffectActive('chronos-monument') ||
					age >= ageCap ||
					!spendAll([
						{ resource: 'quarks', amount: 10 },
						{ resource: 'plasma', amount: plasmaCost.toString() },
					])
				)
					return false;
				resources.setDragon({ ageDays: Math.min(ageCap, age + 1) });
				return true;
			},
			combineSpells: spellIds => {
				if (!converterUnlocked()) return false;
				const spells = getRoot().spells;
				const selected = spellIds.map(id => spells.spellInventory.find(spell => spell.id === id)).filter((spell): spell is Spell => Boolean(spell));
				if (selected.length !== spellIds.length || !selected.length) return false;

				const [first] = selected;
				const sameType = selected.every(spell => spell.spellType === first.spellType && spell.size === first.size && Boolean(spell.mega) === Boolean(first.mega));
				const requiredMegaTypes: readonly SpellType[] = ['energy', 'dark-energy', 'calm'];
				const hasThreeOfEveryMegaType = requiredMegaTypes.every(type => selected.filter(spell => spell.spellType === type).length === 3);
				const sameSize = selected.every(spell => spell.size === first.size && !spell.mega);
				const nextSize = first.size + 1;
				const nextSizeIsLootboxExclusive = nextSize === 5 || nextSize === 6;
				const twoOfSame = selected.length === 2 && sameType && first.size < 8 && !nextSizeIsLootboxExclusive && (Boolean(first.mega) || requiredMegaTypes.includes(first.spellType));
				const allOfSameSize = selected.length === requiredMegaTypes.length * 3 && hasThreeOfEveryMegaType && sameSize && first.size !== 5 && first.size !== 6;
				if ((!twoOfSame && !allOfSameSize) || !spend('quarks', 1)) return false;

				const output = allOfSameSize ? createSpell('mega', first.size) : createSpell(first.spellType, (first.size + 1) as SpellSize);
				set(state => ({ ...state, spells: { ...state.spells, spellInventory: [...state.spells.spellInventory.filter(spell => !spellIds.includes(spell.id)), output] } }));
				return true;
			},
			reset: () => setSlice({ rules: [], erosConversionsToday: 0, erosConversionDate: today() }),
		},
	};
};
