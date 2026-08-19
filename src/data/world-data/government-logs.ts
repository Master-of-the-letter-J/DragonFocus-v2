export interface GovernmentLog {
	id: string;
	title: string;
	body: string;
	milestone: number;
	requiresDragon?: boolean;
}

export const GOVERNMENT_LOGS: readonly GovernmentLog[] = [
	{ id: 'nexus-directive', title: 'CLASSIFIED: Nexus Directive', milestone: 0, body: "Only Dragon's Nexus and Options are authorized. Spawn the dragon and click it to establish the first Energy signal. Earth and The Scrolls remain sealed; offline time is already being recorded, and a future government account can synchronize verified progress across devices." },
	{ id: 'world-signal', title: 'The World Signal', milestone: 0.25, requiresDragon: true, body: 'At 50 total Energy, the dragon reaches the world grid. Earth, Population, Milestones, Fury, base Production, and Dragon Clickers are now authorized.' },
	{ id: 'dark-pathway', title: 'An Obscure Energy', milestone: 0.5, requiresDragon: true, body: 'At 200 total Energy, focused goals reveal Dark Energy. Surveys, Active Goals, Harvest Goals, and their rewards are now cleared.' },
	{ id: 'pomodoro-blueprint', title: 'The Pomodoro Blueprint', milestone: 0.75, requiresDragon: true, body: "At 500 total Energy, timed focus stabilizes the signal. Pomodoro Cave, Hoard's Cave, offline rewards, and app-blocking controls are now available." },
	{ id: 'amplifier-order', title: 'Amplifier Order', milestone: 1, requiresDragon: true, body: 'The first dragon amplifiers are approved. Statistics and achievement records have also been declassified.' },
	{ id: 'armageddon-warning', title: 'Armageddon Warning', milestone: 5, requiresDragon: true, body: 'Plasma can be extracted through catastrophic reset. The government advises preparation before authorizing Armageddon.' },
];
