export interface GovernmentLog {
	id: string;
	title: string;
	body: string;
	milestone: number;
	requiresDragon?: boolean;
}

export const GOVERNMENT_LOGS: readonly GovernmentLog[] = [
	{ id: 'nexus-directive', title: 'CLASSIFIED: Nexus Directive', milestone: 0, body: "Only Dragon's Nexus and Options are authorized. Spawn the dragon in the Nexus; its first energy pulse will begin decrypting the remaining application." },
	{ id: 'world-signal', title: 'The World Signal', milestone: 0.25, requiresDragon: true, body: 'The dragon is affecting the global energy grid. Earth monitoring and base production have been authorized.' },
	{ id: 'dark-pathway', title: 'An Obscure Energy', milestone: 0.5, requiresDragon: true, body: 'Focused goals produce a darker energy signature. Surveys and goal harvesting are now cleared.' },
	{ id: 'pomodoro-blueprint', title: 'The Pomodoro Blueprint', milestone: 0.75, requiresDragon: true, body: 'Timed focus stabilizes the signal. Pomodoro Cave and the Offline Hoard are now available.' },
	{ id: 'amplifier-order', title: 'Amplifier Order', milestone: 1, requiresDragon: true, body: 'The first dragon amplifiers are approved. Statistics and achievement records have also been declassified.' },
	{ id: 'armageddon-warning', title: 'Armageddon Warning', milestone: 5, requiresDragon: true, body: 'Plasma can be extracted through catastrophic reset. The government advises preparation before authorizing Armageddon.' },
];

