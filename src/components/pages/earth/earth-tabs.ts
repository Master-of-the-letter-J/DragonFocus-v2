/** Navigation metadata for the Earth route. */
export const EARTH_TABS = [
	{ id: 'command', label: 'Command Center', unlockMilestone: 0.25 },
	{ id: 'surveys', label: 'Surveys', unlockMilestone: 0.25 },
	{ id: 'active', label: 'Active Goals', unlockMilestone: 0.5 },
	{ id: 'finished', label: 'Finished Goals', unlockMilestone: 0.5 },
	{ id: 'focus', label: 'Pomodoro Cave', unlockMilestone: 0.75 },
	{ id: 'hoard', label: "Hoard's Cave", unlockMilestone: 0.75 },
] as const;

export type EarthTab = (typeof EARTH_TABS)[number]['id'];
