export const OPTIONS_TABS = [
	{ id: 'general', label: 'General & Game Modes' },
	{ id: 'surveys', label: 'Survey & Goal Options' },
] as const;

export type OptionsTab = (typeof OPTIONS_TABS)[number]['id'];

