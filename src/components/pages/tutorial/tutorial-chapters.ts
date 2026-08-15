export const TUTORIAL_CHAPTERS = [
	{ id: 'goals', label: 'Goals & Harvesting', title: 'Turn intention into resources', body: ['Check in to choose goals.', 'Complete goals honestly; rapid emergency completions can lose rewards.', 'Harvest every finished goal together for XP, Dark Energy, Shards, calm, and challenge rewards.'] },
	{ id: 'focus', label: 'Pomodoro & Offline', title: 'Focus charges the Heart', body: ['Pomodoro, stopwatch, and quiet sessions place the Heart in its active state.', 'Allowed-app and off-phone time can be summarized as offline progression.', 'Blocked time earns nothing when the blocking mode applies.'] },
	{
		id: 'production',
		label: 'Production & Heart',
		title: 'Read the energy equation',
		body: ['Energy = producer output × amplification × goal multiplier × other multipliers.', 'Amplification begins at ×1, so producers always retain base output.', 'Difficulty acts through Crimson Heart behavior rather than duplicated production and population multipliers.'],
	},
	{ id: 'prestige', label: 'Prestige', title: 'Destroy a run to deepen it', body: ['Armageddon turns accumulated Energy into Plasma.', 'Transcension trades deeper progress for Dark Plasma and Anomalies.', 'Apocalypse effects upgrade independently and combine in their reward calculation.'] },
	{ id: 'special', label: 'Special Features', title: 'Pantheons, spells, and Titanomachy', body: ['Hectate improves spell luck and unlocks Divine lootbox rarities.', 'Fuelable shrines are independent of Crimson Heart and spells.', 'Titanomachy is a high-risk accord that ends when its prerequisites fail.'] },
	{
		id: 'lootboxes',
		label: 'Lootbox Chances',
		title: 'Know every spell chance',
		body: [
			'Each listed percentage is the chance for one roll before Hectate luck is applied.',
			'Hectate uses the disclosed Hectate table and biases rolls toward higher rarities through ×2 Spell Luck per level.',
			'Divine I and Divine II are exclusive to Hectate-enabled lootboxes. Impossible and Infinity appear without Hectate only where standard odds list them.',
		],
	},
] as const;

export type TutorialChapter = (typeof TUTORIAL_CHAPTERS)[number]['id'];

