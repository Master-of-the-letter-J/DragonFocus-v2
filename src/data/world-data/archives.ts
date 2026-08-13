export interface ArchiveSectionDefinition {
	id: string;
	name: string;
	milestone: number;
	fields: readonly string[];
}

export const CHRONICLE_COLUMNS = ['date', 'mood-check-in', 'mood-check-out', 'goals-completed', 'goals-completed-late', 'goals-late', 'goals-remaining', 'journal'] as const;

export const ARCHIVE_SECTIONS: readonly ArchiveSectionDefinition[] = [
	{
		id: 'survey-statistics',
		name: 'Surveys',
		milestone: 1,
		fields: ['incomplete-habits-all-time', 'completed-day-goals-all-time', 'incomplete-day-goals-all-time', 'average-morning-mood', 'average-evening-mood', 'best-day-goal-streak', 'prompts-answered', 'trivia-answered', 'trivia-accuracy', 'journal-entries'],
	},
	{
		id: 'reward-statistics',
		name: 'Rewards',
		milestone: 1,
		fields: ['energy-earned', 'dark-energy-earned', 'shards-earned', 'xp-earned', 'fury-earned', 'average-rewards-per-day', 'highest-reward-day'],
	},
	{ id: 'secret-government-logs', name: 'Top Secret Government Logs', milestone: 1, fields: ['unlocked-log-ids'] },
	{ id: 'dragon-graveyard', name: 'Dragon Graveyard', milestone: 3, fields: ['name', 'age', 'stage', 'cause-of-death'] },
];

export const GRAVEYARD_COMPENSATION_SHARD_COST = 10;

export const compactEmptyChronicleDates = (dates: readonly string[]) => {
	if (!dates.length) return [];
	const sorted = [...new Set(dates)].sort();
	const ranges: { start: string; end: string; days: number }[] = [];
	let start = sorted[0];
	let previous = sorted[0];
	for (const current of sorted.slice(1)) {
		const isConsecutive = Date.parse(current) - Date.parse(previous) === 86_400_000;
		if (!isConsecutive) {
			ranges.push({ start, end: previous, days: Math.round((Date.parse(previous) - Date.parse(start)) / 86_400_000) + 1 });
			start = current;
		}
		previous = current;
	}
	ranges.push({ start, end: previous, days: Math.round((Date.parse(previous) - Date.parse(start)) / 86_400_000) + 1 });
	return ranges;
};
