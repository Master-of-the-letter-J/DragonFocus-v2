/** Navigation metadata for the Lair route. */
export const LAIR_TABS = [
	{ id: 'nexus', label: "Dragon's Nexus", unlockMilestone: 0 },
	{ id: 'heart', label: 'Crimson Heart', unlockMilestone: 0.25, noticeId: 'crimson-heart' },
	{ id: 'production', label: 'Energy Production', unlockMilestone: 0.25, noticeId: 'energy-production', childNoticeIds: ['producers', 'amplifiers', 'goal-multipliers'] },
	{ id: 'prestige', label: 'Prestige & Deities', unlockMilestone: 5, noticeId: 'prestige-deities', childNoticeIds: ['armageddon', 'transcension', 'olympians', 'titans', 'respec', 'titanomachy'] },
	{ id: 'special', label: 'Special Production', unlockMilestone: 5, noticeId: 'special-production', childNoticeIds: ['special-generation', 'incinerator', 'convertor'] },
	{ id: 'upgrades', label: 'Energy Upgrades', unlockMilestone: 0.5, noticeId: 'energy-upgrades', childNoticeIds: ['amplifier-efficiency', 'producer-upgrades-one', 'producer-upgrades-two', 'quantum-evolution', 'boost-upgrades'] },
] as const;

export const PRODUCTION_TABS = [
	{ id: 'producers', label: 'Production', unlockMilestone: 0.25, noticeId: 'producers' },
	{ id: 'amplifiers', label: 'Amplifiers', unlockMilestone: 1, noticeId: 'amplifiers' },
	{ id: 'goals', label: 'Goal Multipliers', unlockMilestone: 2, noticeId: 'goal-multipliers' },
] as const;

export const SPECIAL_PRODUCTION_TABS = [
	{ id: 'generation', label: 'Special Generation', unlockMilestone: 5, noticeId: 'special-generation' },
	{ id: 'incinerator', label: 'Incinerator', unlockMilestone: 5, noticeId: 'incinerator' },
	{ id: 'convertor', label: 'Convertor', unlockMilestone: 5, noticeId: 'convertor' },
] as const;

export const UPGRADE_TABS = [
	{ id: 'amplifier', label: 'Amplifier Efficiency', noticeId: 'amplifier-efficiency' },
	{ id: 'producer1', label: 'Producer Type I', noticeId: 'producer-upgrades-one' },
	{ id: 'producer2', label: 'Producer Type II', noticeId: 'producer-upgrades-two' },
	{ id: 'evolution', label: 'Quantum & Evolution', noticeId: 'quantum-evolution' },
	{ id: 'boosts', label: 'Boost Upgrades', noticeId: 'boost-upgrades' },
] as const;

export const PRESTIGE_TABS = [
	{ id: 'armageddon', label: 'Armageddon', noticeId: 'armageddon' },
	{ id: 'transcension', label: 'Transcension', noticeId: 'transcension' },
	{ id: 'olympians', label: 'Olympians', noticeId: 'olympians' },
	{ id: 'titans', label: 'Titans', noticeId: 'titans' },
	{ id: 'respec', label: 'Respec', noticeId: 'respec' },
	{ id: 'tartarus', label: 'Titanomachy', noticeId: 'titanomachy' },
] as const;

export type LairTab = (typeof LAIR_TABS)[number]['id'];
export type ProductionTab = (typeof PRODUCTION_TABS)[number]['id'];
export type SpecialProductionTab = (typeof SPECIAL_PRODUCTION_TABS)[number]['id'];
export type UpgradeTab = (typeof UPGRADE_TABS)[number]['id'];
export type PrestigeTab = (typeof PRESTIGE_TABS)[number]['id'];
