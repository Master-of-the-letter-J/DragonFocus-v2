export interface PageUnlockNoticeDefinition {
	id: string;
	title: string;
	destination: string;
	milestone: number;
	requiresDragon?: boolean;
}

/** User-facing destinations that become available as the world progresses. */
export const PAGE_UNLOCK_NOTICES: readonly PageUnlockNoticeDefinition[] = [
	{ id: 'earth', title: 'The Earth', destination: 'Use the Earth tab to manage the world and its population.', milestone: 0, requiresDragon: true },
	{ id: 'scrolls', title: 'The Scrolls', destination: 'Use the Scrolls tab for account, market, logs, and records.', milestone: 0, requiresDragon: true },
	{ id: 'crimson-heart', title: 'Crimson Heart', destination: "Open it from the Dragon's Lair to inspect real-time tick speed and Heart upgrades.", milestone: 0.25, requiresDragon: true },
	{ id: 'energy-production', title: 'Energy Production', destination: "Open it from the Dragon's Lair to purchase producers.", milestone: 0.25, requiresDragon: true },
	{ id: 'producers', title: 'Production', destination: 'Open Energy Production, then choose Production to purchase producers.', milestone: 0.25, requiresDragon: true },
	{ id: 'command-center', title: 'Command Center', destination: 'Open it from The Earth to interact with population systems.', milestone: 0.25, requiresDragon: true },
	{ id: 'surveys', title: 'Surveys', destination: 'Open it from The Earth to manage check-in and check-out surveys.', milestone: 0.25, requiresDragon: true },
	{ id: 'energy-upgrades', title: 'Energy Upgrades', destination: "Open it from the Dragon's Lair to improve production systems.", milestone: 0.5, requiresDragon: true },
	{ id: 'amplifier-efficiency', title: 'Amplifier Efficiency', destination: 'Open Energy Upgrades, then choose Amplifier Efficiency.', milestone: 0.5, requiresDragon: true },
	{ id: 'producer-upgrades-one', title: 'Producer Type I', destination: 'Open Energy Upgrades, then choose Producer Type I.', milestone: 0.5, requiresDragon: true },
	{ id: 'producer-upgrades-two', title: 'Producer Type II', destination: 'Open Energy Upgrades, then choose Producer Type II.', milestone: 0.5, requiresDragon: true },
	{ id: 'quantum-evolution', title: 'Quantum & Evolution', destination: 'Open Energy Upgrades, then choose Quantum & Evolution.', milestone: 0.5, requiresDragon: true },
	{ id: 'boost-upgrades', title: 'Boost Upgrades', destination: 'Open Energy Upgrades, then choose Boost Upgrades.', milestone: 0.5, requiresDragon: true },
	{ id: 'active-goals', title: 'Active Goals', destination: 'Open it from The Earth to create and complete goals.', milestone: 0.5, requiresDragon: true },
	{ id: 'finished-goals', title: 'Finished Goals', destination: 'Open it from The Earth to review and harvest finished work.', milestone: 0.5, requiresDragon: true },
	{ id: 'pomodoro-cave', title: 'Pomodoro Cave', destination: 'Open it from The Earth to begin a focus session.', milestone: 0.75, requiresDragon: true },
	{ id: 'hoards-cave', title: "Hoard's Cave", destination: 'Open it from The Earth to review offline progress.', milestone: 0.75, requiresDragon: true },
	{ id: 'amplifiers', title: 'Amplifiers', destination: 'Open Energy Production, then choose Amplifiers.', milestone: 1, requiresDragon: true },
	{ id: 'records', title: 'Achievements & Statistics', destination: 'Open it from The Scrolls to review world records.', milestone: 1, requiresDragon: true },
	{ id: 'secret-logs', title: 'Secret Logs', destination: 'Open it from The Scrolls to read declassified government records.', milestone: 1, requiresDragon: true },
	{ id: 'goal-multipliers', title: 'Goal Multipliers', destination: 'Open Energy Production, then choose Goal Multipliers.', milestone: 2, requiresDragon: true },
	{ id: 'dragon-pact', title: 'Dragon Pact', destination: 'Open it from The Scrolls to inspect Premium benefits.', milestone: 2, requiresDragon: true },
	{ id: 'activity-logs', title: 'Activity Logs', destination: 'Open it from The Scrolls to inspect surveys, goals, rewards, and focus history.', milestone: 2, requiresDragon: true },
	{ id: 'black-market', title: 'Black Market', destination: 'Open it from The Scrolls to spend Shards and claim rewarded ads.', milestone: 3, requiresDragon: true },
	{ id: 'prestige-deities', title: 'Prestige & Deities', destination: "Open it from the Dragon's Lair for Armageddon, Transcension, and pantheons.", milestone: 5, requiresDragon: true },
	{ id: 'armageddon', title: 'Armageddon', destination: 'Open Prestige & Deities, then choose Armageddon.', milestone: 5, requiresDragon: true },
	{ id: 'transcension', title: 'Transcension', destination: 'Open Prestige & Deities, then choose Transcension.', milestone: 5, requiresDragon: true },
	{ id: 'olympians', title: 'Olympians', destination: 'Open Prestige & Deities, then choose Olympians.', milestone: 5, requiresDragon: true },
	{ id: 'titans', title: 'Titans', destination: 'Open Prestige & Deities, then choose Titans.', milestone: 5, requiresDragon: true },
	{ id: 'respec', title: 'Respec', destination: 'Open Prestige & Deities, then choose Respec.', milestone: 5, requiresDragon: true },
	{ id: 'titanomachy', title: 'Titanomachy', destination: 'Open Prestige & Deities, then choose Titanomachy.', milestone: 5, requiresDragon: true },
	{ id: 'special-production', title: 'Special Production', destination: "Open it from the Dragon's Lair for generators, the Incinerator, and the Convertor.", milestone: 5, requiresDragon: true },
	{ id: 'special-generation', title: 'Special Generation', destination: 'Open Special Production, then choose Special Generation.', milestone: 5, requiresDragon: true },
	{ id: 'incinerator', title: 'Incinerator', destination: 'Open Special Production, then choose Incinerator.', milestone: 5, requiresDragon: true },
	{ id: 'convertor', title: 'Convertor', destination: 'Open Special Production, then choose Convertor.', milestone: 5, requiresDragon: true },
];

export const PAGE_UNLOCK_NOTICE_BY_ID = Object.fromEntries(PAGE_UNLOCK_NOTICES.map(notice => [notice.id, notice])) as Readonly<Record<string, PageUnlockNoticeDefinition>>;

export const unlockedPageNoticeIds = (milestone: number, dragonSpawned: boolean) =>
	PAGE_UNLOCK_NOTICES.filter(notice => milestone >= notice.milestone && (!notice.requiresDragon || dragonSpawned)).map(notice => notice.id);

export type PageUnlockSection = 'earth' | 'lair' | 'archives';

export const PAGE_UNLOCK_NOTICE_IDS_BY_SECTION: Record<PageUnlockSection, readonly string[]> = {
	earth: ['earth', 'command-center', 'surveys', 'active-goals', 'finished-goals', 'pomodoro-cave', 'hoards-cave'],
	lair: ['crimson-heart', 'energy-production', 'producers', 'energy-upgrades', 'amplifier-efficiency', 'producer-upgrades-one', 'producer-upgrades-two', 'quantum-evolution', 'boost-upgrades', 'amplifiers', 'goal-multipliers', 'prestige-deities', 'armageddon', 'transcension', 'olympians', 'titans', 'respec', 'titanomachy', 'special-production', 'special-generation', 'incinerator', 'convertor'],
	archives: ['scrolls', 'records', 'secret-logs', 'dragon-pact', 'activity-logs', 'black-market'],
};

export const hasUnvisitedPageInSection = (section: PageUnlockSection, milestone: number, dragonSpawned: boolean, seenIds: readonly string[]) => {
	const sectionIds = new Set(PAGE_UNLOCK_NOTICE_IDS_BY_SECTION[section]);
	return PAGE_UNLOCK_NOTICES.some(notice => sectionIds.has(notice.id) && milestone >= notice.milestone && (!notice.requiresDragon || dragonSpawned) && !seenIds.includes(notice.id));
};
