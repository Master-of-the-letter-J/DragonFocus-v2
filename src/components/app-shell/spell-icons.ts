import type { SpellSize, SpellType } from '@/types/world.types';

const SPELL_TYPE_ICONS: Record<SpellType, string> = {
	energy: '⚡',
	'dark-energy': '◈',
	plasma: '◉',
	calm: '☯',
	armageddon: '☄',
	chaos: '⟡',
	mega: '✦',
	'snack-energy': '🍪',
	'snack-dark-energy': '🍫',
	'snack-plasma': '🍬',
	'snack-chaos': '🍭',
};

const SPELL_SIZE_ICONS: Record<SpellSize, string> = {
	1: '·',
	2: '•',
	3: '✦',
	4: '✧',
	5: '♢',
	6: '♜',
	7: '☄',
	8: '∞',
};

export const spellTypeIcon = (type: SpellType) => SPELL_TYPE_ICONS[type];
export const spellSizeIcon = (size: SpellSize) => SPELL_SIZE_ICONS[size];
