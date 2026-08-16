/** Navigation metadata for the Lair route. */
export const LAIR_TABS = [
	{ id: 'nexus', label: "Dragon's Nexus", unlockMilestone: 0 },
	{ id: 'production', label: 'Energy Production', unlockMilestone: 0.25 },
	{ id: 'upgrades', label: 'Dark Energy', unlockMilestone: 0.5 },
	{ id: 'prestige', label: 'Prestige & Deities', unlockMilestone: 5 },
] as const;

export const PRODUCTION_TABS = [
	{ id: 'heart', label: 'Crimson Heart', unlockMilestone: 0.25 },
	{ id: 'producers', label: 'Production', unlockMilestone: 0.25 },
	{ id: 'amplifiers', label: 'Amplifiers', unlockMilestone: 1 },
	{ id: 'goals', label: 'Goal Multipliers', unlockMilestone: 2 },
	{ id: 'special', label: 'Special Generation', unlockMilestone: 5 },
	{ id: 'incinerator', label: 'Incinerator', unlockMilestone: 5 },
	{ id: 'convertor', label: 'Convertor', unlockMilestone: 5 },
] as const;

export const UPGRADE_TABS = [
	{ id: 'amplifier', label: 'Amplifier Efficiency' },
	{ id: 'producer1', label: 'Producer Type I' },
	{ id: 'producer2', label: 'Producer Type II' },
	{ id: 'evolution', label: 'Quantum & Evolution' },
	{ id: 'boosts', label: 'Boost Upgrades' },
] as const;

export const PRESTIGE_TABS = [
	{ id: 'armageddon', label: 'Armageddon' },
	{ id: 'transcension', label: 'Transcension' },
	{ id: 'olympians', label: 'Olympians' },
	{ id: 'titans', label: 'Titans' },
	{ id: 'respec', label: 'Respec' },
	{ id: 'tartarus', label: 'Titanomachy' },
] as const;

export type LairTab = (typeof LAIR_TABS)[number]['id'];
export type ProductionTab = (typeof PRODUCTION_TABS)[number]['id'];
export type UpgradeTab = (typeof UPGRADE_TABS)[number]['id'];
export type PrestigeTab = (typeof PRESTIGE_TABS)[number]['id'];
