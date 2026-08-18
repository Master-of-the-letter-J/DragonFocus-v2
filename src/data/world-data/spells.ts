import type { Spell, SpellEffect, SpellSize, SpellType } from '@/types/world.types';

export interface SpellSizeDefinition {
	size: SpellSize;
	name: string;
	multiplier: number;
	megaMultiplier: number;
	durationSeconds: number;
	sellShards: number;
}

export const SPELL_SIZES: readonly SpellSizeDefinition[] = [
	{ size: 1, name: 'Small', multiplier: 2, megaMultiplier: 2, durationSeconds: 2 * 3_600, sellShards: 2 },
	{ size: 2, name: 'Medium', multiplier: 3, megaMultiplier: 2, durationSeconds: 2 * 3_600, sellShards: 4 },
	{ size: 3, name: 'Large', multiplier: 4, megaMultiplier: 3, durationSeconds: 2 * 3_600, sellShards: 8 },
	{ size: 4, name: 'Titanic', multiplier: 8, megaMultiplier: 6, durationSeconds: 3 * 3_600, sellShards: 16 },
	{ size: 5, name: 'Divine I', multiplier: 16, megaMultiplier: 12, durationSeconds: 3 * 3_600, sellShards: 32 },
	{ size: 6, name: 'Divine II', multiplier: 32, megaMultiplier: 24, durationSeconds: 3 * 3_600, sellShards: 64 },
	{ size: 7, name: 'Impossible', multiplier: 777, megaMultiplier: 333, durationSeconds: 60, sellShards: 128 },
	{ size: 8, name: 'Infinity', multiplier: 7_777, megaMultiplier: 3_333, durationSeconds: 15, sellShards: 256 },
];

const effectFor = (type: Exclude<SpellType, 'mega'>, multiplier: number): SpellEffect => ({
	resource:
		type === 'energy' ? 'energy'
		: type === 'dark-energy' ? 'darkEnergy'
		: type === 'plasma' ? 'plasma'
		: type === 'chaos' ? 'chaosEnergy'
		: type === 'calm' ? 'furyReduction'
		: 'armageddon',
	multiplier,
});

export const createSpell = (type: SpellType, size: SpellSize, id = `spell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`): Spell => {
	const sizeDefinition = SPELL_SIZES[size - 1];
	const multiplier = type === 'mega' ? sizeDefinition.megaMultiplier : sizeDefinition.multiplier;
	const effects: SpellEffect[] =
		type === 'mega' ?
			[
				{ resource: 'energy', multiplier },
				{ resource: 'darkEnergy', multiplier },
				{ resource: 'furyReduction', multiplier },
			]
		:	[effectFor(type, multiplier)];

	return {
		id,
		name: `${sizeDefinition.name} ${type === 'mega' ? 'Mega' : type.replace('-', ' ')} Spell`,
		spellType: type,
		size,
		mega: type === 'mega',
		durationSeconds: type === 'mega' && size <= 6 ? 3 * 3_600 : sizeDefinition.durationSeconds,
		effects,
	};
};

export const spellSellValue = (size: SpellSize) => SPELL_SIZES[size - 1].sellShards;

export const getSpellLuckMultiplier = (hecateLevel: number) => Math.pow(2, Math.max(0, Math.floor(hecateLevel)));
