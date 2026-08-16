/** Navigation metadata for the Archives route. */
export const ARCHIVE_TABS = [
	{ id: 'pact', label: 'Dragon Pact', unlockMilestone: 2 },
	{ id: 'market', label: 'Black Market', unlockMilestone: 3 },
	{ id: 'logs', label: 'Logs', unlockMilestone: 2 },
	{ id: 'records', label: 'Achievements & Statistics', unlockMilestone: 1 },
	{ id: 'secret', label: 'Secret Logs', unlockMilestone: 1 },
] as const;

export type ArchiveTab = (typeof ARCHIVE_TABS)[number]['id'];
