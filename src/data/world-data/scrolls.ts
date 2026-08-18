export type ScrollTabId = 'dragon-pact' | 'black-market' | 'chronicles' | 'achievements' | 'statistics' | 'graveyard';

export interface ScrollTabDefinition {
	id: ScrollTabId;
	name: string;
	milestone: number;
	description: string;
	info: readonly string[];
}

/** Static Scrolls copy lives outside screens so UI files only render data. */
export const SCROLL_TABS: readonly ScrollTabDefinition[] = [
	{
		id: 'dragon-pact',
		name: 'The Dragon Pact',
		milestone: 2,
		description: 'Account synchronization and optional premium benefits.',
		info: ['Sign-up reward: 50 Crimson Shards.', 'Unlimited Habit and To-Do goals.', 'Much higher Crimson and Quark Challenge limits.', 'Crimson Heart charge and maximums: x2.', 'Harvest Dark Energy: x2.', 'Harvest base XP and Fury reduction: x2.', 'Goal shard cap: x5.', 'Black Market rewards, including shard packs: +10%.', 'Pricing B: $1.99 monthly, $4.99 yearly, or $14.99 lifetime.'],
	},
	{
		id: 'black-market',
		name: 'Black Market & Spells',
		milestone: 3,
		description: 'Fixed purchases, spell crafting, selling, and disclosed Snackbox odds.',
		info: ['Fixed purchases are never randomized; Snackbox odds are disclosed separately.', 'Hold up to three ad charges; one returns every three real-time hours and each verified ad awards 5 Shards.', 'Spell size, effect, duration, and sell value are always visible.', 'Same-type, same-size spell activations stack duration.', 'Hecate unlocks Divine I and Divine II exclusively in Snackboxes and improves their odds.'],
	},
	{
		id: 'chronicles',
		name: 'Chronicles',
		milestone: 2,
		description: 'A compact daily log of surveys, moods, goals, and journal entries.',
		info: ['Empty consecutive dates are collapsed.', 'Columns can be hidden.', 'The table supports vertical and horizontal scrolling.'],
	},
	{
		id: 'achievements',
		name: 'Achievements',
		milestone: 1,
		description: 'Visible and secret long-term objectives that award Crimson Shards.',
		info: ['Progress is shown before opening an achievement.', 'Secret achievements grant larger rewards.'],
	},
	{
		id: 'statistics',
		name: 'Statistics',
		milestone: 1,
		description: 'Survey, goal, reward, Pomodoro, and government-log history.',
		info: ['Tracks lifetime and best-day values.', 'Includes every unlocked Secret Government Log.'],
	},
	{
		id: 'graveyard',
		name: 'Dragon Graveyard',
		milestone: 3,
		description: 'Memorials for past dragons and their causes of death.',
		info: ['Each grave records name, age, stage, and cause.', 'A memorial compensation spell costs 10 Shards.'],
	},
];
