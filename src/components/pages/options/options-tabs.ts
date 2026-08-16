/** Navigation metadata for the Options route. */
export type OptionsTab = 'general' | 'surveys' | 'tutorial';

export const OPTIONS_TABS: readonly { id: OptionsTab; label: string }[] = [
	{ id: 'general', label: '⚙ General & Game Modes' },
	{ id: 'surveys', label: '☀ Check-In & Out' },
	{ id: 'tutorial', label: '📖 Tutorial' },
];
