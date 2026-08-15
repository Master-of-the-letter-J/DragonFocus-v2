export const LAIR_TABS = [
	{ id: 'nexus', label: 'The Nexus' },
	{ id: 'production', label: 'Energy Production' },
	{ id: 'upgrades', label: 'Dark Energy' },
	{ id: 'prestige', label: 'Prestige & Deities' },
] as const;

export const PRODUCTION_TABS = [
	{ id: 'producers', label: 'Production' },
	{ id: 'amplifiers', label: 'Amplifiers' },
	{ id: 'goals', label: 'Goal Multipliers' },
	{ id: 'special', label: 'Special Generation' },
	{ id: 'heart', label: 'Crimson Heart' },
	{ id: 'incinerator', label: 'Incinerator' },
	{ id: 'convertor', label: 'Convertor' },
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

