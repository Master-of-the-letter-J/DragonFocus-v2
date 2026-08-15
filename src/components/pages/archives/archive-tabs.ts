export const ARCHIVE_TABS = [
	{ id: 'pact', label: 'Dragon Pact' },
	{ id: 'market', label: 'Black Market' },
	{ id: 'logs', label: 'Logs' },
	{ id: 'records', label: 'Achievements & Statistics' },
	{ id: 'secret', label: 'Secret Logs' },
] as const;

export type ArchiveTab = (typeof ARCHIVE_TABS)[number]['id'];

