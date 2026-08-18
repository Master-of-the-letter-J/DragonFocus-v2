export type NewsKind = 'news' | 'tip';

export interface NewsItem {
	id: string;
	kind: NewsKind;
	text: string;
	minimumMilestone: number;
}

/**
 * News and tips become available as the user's all-time Energy reaches each
 * milestone. The bar chooses randomly from the entries currently unlocked.
 */
export const NEWS_DATA: readonly NewsItem[] = [
	{ id: 'welcome', kind: 'news', text: 'Welcome to Dragon Focus. Every click helps awaken the world.', minimumMilestone: 0 },
	{ id: 'dragon-click-tip', kind: 'tip', text: 'Click the dragon to make Energy and strengthen your opening momentum.', minimumMilestone: 0 },
	{ id: 'earth-click-tip', kind: 'tip', text: 'Click the Earth to help its population grow alongside your Energy.', minimumMilestone: 0 },
	{ id: 'first-shard', kind: 'news', text: 'The first shard has answered your progress. New systems will emerge as Energy accumulates.', minimumMilestone: 0.25 },
	{ id: 'survey-tip', kind: 'tip', text: 'Check-in and check-out surveys can guide your goals and reward a consistent day.', minimumMilestone: 0.25 },
	{ id: 'heart-news', kind: 'news', text: 'The Crimson Heart converts focus into a special production stream. Keep an eye on its charge.', minimumMilestone: 0.5 },
	{ id: 'fury-tip', kind: 'tip', text: 'Missed goals can raise Dragon Fury. Complete goals and surveys to keep the dragon calm.', minimumMilestone: 0.5 },
	{ id: 'converter-news', kind: 'news', text: 'The Convertor can reshape rare resources, spells, and special plasmas once it is unlocked.', minimumMilestone: 0.75 },
	{ id: 'spell-tip', kind: 'tip', text: 'Spell effects stay active in your backpack. Tap a spell to review what it is doing.', minimumMilestone: 0.75 },
	{ id: 'milestone-one', kind: 'news', text: 'Milestone 1 marks the start of a deeper run: more upgrades, modes, and dragon lore await.', minimumMilestone: 1 },
	{ id: 'pomodoro-tip', kind: 'tip', text: 'A focused Pomodoro session can help complete special goals and build a stronger routine.', minimumMilestone: 1 },
	{ id: 'command-center', kind: 'news', text: 'The Command Center gathers the dragon’s active systems, including Fury and its current stage.', minimumMilestone: 2 },
	{ id: 'anger-shields', kind: 'tip', text: 'Anger Shields temporarily protect the dragon from higher Fury stages.', minimumMilestone: 2 },
	{ id: 'hard-modes', kind: 'news', text: 'Harder game modes increase the stakes and offer stronger Energy rewards.', minimumMilestone: 3 },
	{ id: 'offline-tip', kind: 'tip', text: 'Offline progress keeps your world moving while you are away. Review the report when you return.', minimumMilestone: 3 },
	{ id: 'dark-energy', kind: 'news', text: 'Dark Energy opens more powerful upgrades and helps reveal the next layer of the Nexus.', minimumMilestone: 5 },
	{ id: 'late-game', kind: 'tip', text: 'Later milestones unlock rarer resources, deeper spell paths, and more ways to shape a run.', minimumMilestone: 10 },
];

export const getUnlockedNews = (milestone: number) => NEWS_DATA.filter(item => item.minimumMilestone <= milestone);
