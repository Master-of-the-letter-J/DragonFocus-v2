export interface PomodoroBoost {
	id: string;
	name: string;
	resourceMultiplier: number;
	description: string;
}

export const POMODORO_BOOSTS: readonly PomodoroBoost[] = [
	{ id: 'steady-flame', name: 'Steady Flame', resourceMultiplier: 1.25, description: 'A reliable production boost.' },
	{ id: 'clear-mind', name: 'Clear Mind', resourceMultiplier: 1.5, description: 'A stronger reward boost for focused sessions.' },
	{ id: 'crimson-surge', name: 'Crimson Surge', resourceMultiplier: 2, description: 'A powerful short-session multiplier.' },
];

