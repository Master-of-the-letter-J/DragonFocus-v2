/** Navigation metadata for the Archives route. */
export const ARCHIVE_TABS = [
	{ id: 'pact', label: 'Dragon Pact', unlockMilestone: 2, noticeId: 'dragon-pact' },
	{ id: 'market', label: 'Black Market', unlockMilestone: 3, noticeId: 'black-market' },
	{ id: 'logs', label: 'Logs', unlockMilestone: 2, noticeId: 'activity-logs' },
	{ id: 'records', label: 'Achievements & Statistics', unlockMilestone: 1, noticeId: 'records' },
	{ id: 'secret', label: 'Secret Logs', unlockMilestone: 1, noticeId: 'secret-logs' },
] as const;

export type ArchiveTab = (typeof ARCHIVE_TABS)[number]['id'];
