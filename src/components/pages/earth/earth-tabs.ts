/** Navigation metadata for the Earth route. */
export const EARTH_TABS = [
	{ id: 'command', label: 'Command Center', unlockMilestone: 0.25, noticeId: 'command-center' },
	{ id: 'surveys', label: 'Surveys', unlockMilestone: 0.5, noticeId: 'surveys' },
	{ id: 'active', label: 'Active Goals', unlockMilestone: 0.5, noticeId: 'active-goals' },
	{ id: 'finished', label: 'Harvest Goals', unlockMilestone: 0.5, noticeId: 'finished-goals' },
	{ id: 'focus', label: 'Pomodoro Cave', unlockMilestone: 0.75, noticeId: 'pomodoro-cave' },
	{ id: 'hoard', label: "Hoard's Cave", unlockMilestone: 0.75, noticeId: 'hoards-cave' },
] as const;

export type EarthTab = (typeof EARTH_TABS)[number]['id'];
