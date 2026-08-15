export const EARTH_TABS = [
	{ id: 'command', label: 'Command Center' },
	{ id: 'active', label: 'Active Goals' },
	{ id: 'finished', label: 'Finished Goals' },
	{ id: 'focus', label: 'Pomodoro Cave' },
	{ id: 'hoard', label: "Hoard's Cave" },
] as const;

export type EarthTab = (typeof EARTH_TABS)[number]['id'];

